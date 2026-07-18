// Client service for the optimize endpoint (real Supabase product matching).
import type { IngredientInput, ShoppingPlan } from "./buildPlan";

/**
 * Calls POST /api/v1/optimize. Returns the real-data plan, or null when the
 * server can't serve one (missing Supabase config, DB error, network failure)
 * — callers fall back to the local mock buildPlan().
 */
export async function callOptimize(
  ingredients: IngredientInput[],
  signal?: AbortSignal,
): Promise<ShoppingPlan | null> {
  try {
    const res = await fetch("/api/v1/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
      signal,
    });
    if (!res.ok) {
      console.warn(`[optimize] server trả ${res.status} — dùng dữ liệu mẫu.`);
      return null;
    }
    return (await res.json()) as ShoppingPlan;
  } catch (e) {
    console.warn("[optimize] không gọi được server — dùng dữ liệu mẫu.", e);
    return null;
  }
}
