// Client service for the optimize endpoint (real Supabase product matching).
import type { IngredientInput, ShoppingPlan } from "./buildPlan";
import type { TransportMode } from "@/lib/shared/types";

export interface OptimizeOptions {
  /** User location — enables distance-aware store selection on the server. */
  location?: { lat: number; lon: number } | null;
  transport?: TransportMode;
  signal?: AbortSignal;
}

/**
 * Calls POST /api/v1/optimize. Returns the real-data plan, or null when the
 * server can't serve one (missing Supabase config, DB error, network failure)
 * — callers fall back to the local mock buildPlan().
 */
export async function callOptimize(
  ingredients: IngredientInput[],
  options: OptimizeOptions = {},
): Promise<ShoppingPlan | null> {
  try {
    const res = await fetch("/api/v1/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients,
        ...(options.location ? { location: options.location } : {}),
        ...(options.transport ? { transport: options.transport } : {}),
      }),
      signal: options.signal,
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
