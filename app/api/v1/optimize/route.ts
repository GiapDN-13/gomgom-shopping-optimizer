import { NextResponse } from "next/server";
import {
  cheapestPerStore,
  searchProducts,
  getFreshness,
} from "@/lib/server/productSearch";
import { getBranches, nearestBranchKm } from "@/lib/server/branches";
import { STORES, type CatalogProduct } from "@/lib/shared/catalog";
import type { StoreCode, TransportMode } from "@/lib/shared/types";
import {
  assemblePlan,
  type IngredientInput,
  type PlanItem,
} from "@/lib/services/buildPlan";

// POST /api/v1/optimize — match ingredients against REAL Supabase products
// (normalized_products) and assemble a store-grouped plan.
//
// With `location` (+ `transport`) in the body, store selection weighs PRICE
// AGAINST DISTANCE: exhaustive search over all 31 chain subsets, cost =
//   Σ item prices + Σ per-used-chain (delivery fee + km-to-nearest-branch × đ/km)
// Distances use real OSM branches (lib/server/branches). Without `location`,
// behaviour stays cheapest-price-only.

export const runtime = "nodejs";

const MAX_INGREDIENTS = 20;

// đ/km travel-cost assumptions per transport (selection heuristic — the
// displayed total stays products + delivery; the reason string discloses this).
const COST_PER_KM: Record<TransportMode, number> = {
  walking: 5000, // walking far is expensive in time/effort
  motorbike: 1500,
  car: 4000,
};

interface OptimizeBody {
  ingredients?: unknown;
  location?: unknown;
  transport?: unknown;
}

function parseLocation(loc: unknown): { lat: number; lon: number } | null {
  if (typeof loc !== "object" || loc === null) return null;
  const { lat, lon } = loc as { lat?: unknown; lon?: unknown };
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function parseTransport(t: unknown): TransportMode {
  return t === "walking" || t === "car" || t === "motorbike" ? t : "motorbike";
}

/**
 * Exhaustive search over all non-empty subsets of the 5 chains (31 total).
 * For each subset: every ingredient goes to its cheapest product among the
 * subset's chains; subset cost = item prices + per-used-chain overhead
 * (delivery fee + travel distance × đ/km). A subset is only comparable if it
 * covers every ingredient that ANY chain can cover (no trading items away).
 */
function pickBestSubset(
  ingredients: IngredientInput[],
  perStoreList: Array<Partial<Record<StoreCode, CatalogProduct>>>,
  kmByStore: Record<StoreCode, number>,
  transport: TransportMode,
): { matched: PlanItem[]; unmatched: string[]; note: string } {
  const CODES = Object.keys(STORES) as StoreCode[];
  const coverable = ingredients.map((_, i) => Object.keys(perStoreList[i]).length > 0);
  const ratePerKm = COST_PER_KM[transport];

  let best: { cost: number; matched: PlanItem[]; used: Set<StoreCode> } | null = null;

  for (let mask = 1; mask < 1 << CODES.length; mask++) {
    const subset = CODES.filter((_, idx) => mask & (1 << idx));
    const matched: PlanItem[] = [];
    const used = new Set<StoreCode>();
    let itemCost = 0;
    let ok = true;

    for (let i = 0; i < ingredients.length; i++) {
      if (!coverable[i]) continue;
      let bestProduct: CatalogProduct | null = null;
      for (const code of subset) {
        const p = perStoreList[i][code];
        if (p && (!bestProduct || p.price < bestProduct.price)) bestProduct = p;
      }
      if (!bestProduct) {
        ok = false; // this subset loses an ingredient another chain covers
        break;
      }
      matched.push({
        ingredientKey: ingredients[i].key,
        requestedName: ingredients[i].name,
        product: bestProduct,
      });
      used.add(bestProduct.storeCode);
      itemCost += bestProduct.price;
    }
    if (!ok) continue;

    let overhead = 0;
    for (const code of used) {
      overhead += STORES[code].deliveryFee + kmByStore[code] * ratePerKm;
    }
    const cost = itemCost + overhead;
    if (!best || cost < best.cost) best = { cost, matched, used };
  }

  const unmatched = ingredients.filter((_, i) => !coverable[i]).map((ing) => ing.name);
  if (!best) return { matched: [], unmatched, note: "" };

  const kmParts = [...best.used]
    .map((c) => `${STORES[c].name} ~${kmByStore[c].toFixed(1)}km`)
    .join(", ");
  const note =
    `Đã cân nhắc khoảng cách từ vị trí của bạn (${kmParts}; ` +
    `quy đổi ${ratePerKm.toLocaleString("vi-VN")}đ/km cho việc di chuyển).`;
  return { matched: best.matched, unmatched, note };
}

function parseIngredients(body: OptimizeBody): IngredientInput[] | null {
  if (!Array.isArray(body.ingredients)) return null;
  if (body.ingredients.length === 0 || body.ingredients.length > MAX_INGREDIENTS) {
    return null;
  }
  const out: IngredientInput[] = [];
  for (const item of body.ingredients) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as IngredientInput).key !== "string" ||
      typeof (item as IngredientInput).name !== "string"
    ) {
      return null;
    }
    const { key, name } = item as IngredientInput;
    if (!name.trim() || name.length > 100 || key.length > 100) return null;
    out.push({ key: key.trim(), name: name.trim() });
  }
  return out;
}

export async function POST(request: Request) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Chưa cấu hình Supabase — dùng dữ liệu mẫu." },
      { status: 503 },
    );
  }

  let body: OptimizeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const ingredients = parseIngredients(body);
  if (!ingredients) {
    return NextResponse.json(
      { error: `Cần danh sách ingredients hợp lệ (1–${MAX_INGREDIENTS} món).` },
      { status: 400 },
    );
  }

  const location = parseLocation(body.location);
  const transport = parseTransport(body.transport);

  try {
    const freshnessPromise = getFreshness();

    let matched: PlanItem[];
    let unmatched: string[];
    let travelNote = "";

    if (location) {
      // --- distance-aware: price + travel trade-off over all chain subsets ---
      const [perStoreList, branches] = await Promise.all([
        Promise.all(ingredients.map((ing) => cheapestPerStore(ing))),
        getBranches(),
      ]);
      const kmByStore = {} as Record<StoreCode, number>;
      for (const code of Object.keys(STORES) as StoreCode[]) {
        kmByStore[code] = nearestBranchKm(code, location, branches);
      }
      const picked = pickBestSubset(ingredients, perStoreList, kmByStore, transport);
      matched = picked.matched;
      unmatched = picked.unmatched;
      travelNote = picked.note;
    } else {
      // --- legacy: cheapest price only ---
      const results = await Promise.all(ingredients.map((ing) => searchProducts(ing)));
      matched = [];
      unmatched = [];
      ingredients.forEach((ing, i) => {
        const candidates = results[i];
        if (candidates.length === 0) {
          unmatched.push(ing.name);
          return;
        }
        matched.push({ ingredientKey: ing.key, requestedName: ing.name, product: candidates[0] });
      });
    }

    const freshness = await freshnessPromise;
    const plan = assemblePlan(matched, unmatched, freshness);
    if (travelNote) plan.reason = `${plan.reason} ${travelNote}`;
    return NextResponse.json(plan, { status: 200 });
  } catch (e) {
    // NFR-25: human-readable message, no stack traces.
    console.error("[optimize] Supabase error:", e);
    return NextResponse.json(
      { error: "Không thể truy vấn dữ liệu sản phẩm. Vui lòng thử lại." },
      { status: 502 },
    );
  }
}
