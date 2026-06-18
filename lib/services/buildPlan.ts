// Build a plan-first shopping plan from NER ingredients (Sprint 2 heuristic).
// Real ACO route optimization lands in Sprint 4; here we group cheapest matches by store.
import { CATALOG, STORES, type CatalogProduct } from "@/lib/shared/catalog";
import type { StoreCode } from "@/lib/shared/types";

export interface PlanItem {
  ingredientKey: string;
  requestedName: string;
  product: CatalogProduct;
}

export interface PlanStore {
  code: StoreCode;
  name: string;
  color: string;
  address: string;
  items: PlanItem[];
  productSubtotal: number;
  deliveryFee: number;
  lastUpdatedHoursAgo: number;
}

export interface ShoppingPlan {
  stores: PlanStore[];
  unmatched: string[]; // ingredient display names with no catalog match
  productTotal: number;
  deliveryTotal: number;
  finalTotal: number;
  storeCount: number;
  staleStores: string[]; // store names with data older than 48h
  reason: string;
}

export interface IngredientInput {
  key: string; // canonical ingredient key
  name: string; // display name
}

/**
 * Greedy matcher: for each ingredient pick the cheapest in-stock product,
 * then group by store and total up including delivery fees.
 */
export function buildPlan(ingredients: IngredientInput[]): ShoppingPlan {
  const matchedByStore = new Map<StoreCode, PlanItem[]>();
  const unmatched: string[] = [];

  for (const ing of ingredients) {
    const candidates = CATALOG.filter(
      (p) => p.ingredientKey === ing.key && p.inStock,
    );
    if (candidates.length === 0) {
      unmatched.push(ing.name);
      continue;
    }
    const best = candidates.reduce((a, b) => (b.price < a.price ? b : a));
    const list = matchedByStore.get(best.storeCode) ?? [];
    list.push({ ingredientKey: ing.key, requestedName: ing.name, product: best });
    matchedByStore.set(best.storeCode, list);
  }

  const stores: PlanStore[] = [...matchedByStore.entries()].map(([code, items]) => {
    const meta = STORES[code];
    const productSubtotal = items.reduce((s, it) => s + it.product.price, 0);
    return {
      code,
      name: meta.name,
      color: meta.color,
      address: meta.address,
      items,
      productSubtotal,
      deliveryFee: meta.deliveryFee,
      lastUpdatedHoursAgo: meta.lastUpdatedHoursAgo,
    };
  });

  // Cheapest-store first, so the route reads in a sensible order.
  stores.sort((a, b) => a.productSubtotal - b.productSubtotal);

  const productTotal = stores.reduce((s, st) => s + st.productSubtotal, 0);
  const deliveryTotal = stores.reduce((s, st) => s + st.deliveryFee, 0);
  const staleStores = stores
    .filter((st) => st.lastUpdatedHoursAgo > 48)
    .map((st) => st.name);

  return {
    stores,
    unmatched,
    productTotal,
    deliveryTotal,
    finalTotal: productTotal + deliveryTotal,
    storeCount: stores.length,
    staleStores,
    reason: buildReason(stores, unmatched),
  };
}

function buildReason(stores: PlanStore[], unmatched: string[]): string {
  if (stores.length === 0) {
    return "Không tìm thấy sản phẩm phù hợp cho yêu cầu của bạn.";
  }
  const missingNote =
    unmatched.length > 0 ? ` Còn ${unmatched.length} món chưa khớp được sản phẩm.` : "";
  if (stores.length === 1) {
    return `Mua tất cả ở ${stores[0].name} cho tổng chi phí thấp nhất sau khi tính phí giao, và đủ các món.${missingNote}`;
  }
  return `Tách ${stores.length} cửa hàng vì mỗi nơi có giá tốt nhất cho từng nhóm món; tổng đã gồm phí giao của các cửa hàng.${missingNote}`;
}
