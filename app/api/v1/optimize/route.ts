import { NextResponse } from "next/server";
import { searchProducts, getFreshness } from "@/lib/server/productSearch";
import {
  assemblePlan,
  type IngredientInput,
  type PlanItem,
} from "@/lib/services/buildPlan";

// POST /api/v1/optimize — match ingredients against REAL Supabase products
// (normalized_products, ~3k food rows) and assemble a store-grouped plan.
// Real ACO route optimization still lands in Sprint 4; this pass does
// cheapest-match grouping with real prices + real data freshness.

export const runtime = "nodejs";

const MAX_INGREDIENTS = 20;

interface OptimizeBody {
  ingredients?: unknown;
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

  try {
    const freshnessPromise = getFreshness();
    const results = await Promise.all(ingredients.map((ing) => searchProducts(ing)));
    const freshness = await freshnessPromise;

    const matched: PlanItem[] = [];
    const unmatched: string[] = [];
    ingredients.forEach((ing, i) => {
      const candidates = results[i];
      if (candidates.length === 0) {
        unmatched.push(ing.name);
        return;
      }
      // candidates are already price-ascending — cheapest first
      matched.push({
        ingredientKey: ing.key,
        requestedName: ing.name,
        product: candidates[0],
      });
    });

    const plan = assemblePlan(matched, unmatched, freshness);
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
