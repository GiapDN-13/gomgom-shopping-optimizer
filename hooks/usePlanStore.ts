import { create } from "zustand";
import type { NerResult } from "@/lib/services/ner";
import { callNer, nerToIngredients, recipeFromText } from "@/lib/services/ner";
import { buildPlan, type ShoppingPlan, type IngredientInput } from "@/lib/services/buildPlan";
import { callOptimize } from "@/lib/services/optimize";
import type { TransportMode } from "@/lib/shared/types";

export type PlanStatus =
  | "idle"
  | "extracting"
  | "matching"
  | "optimizing"
  | "ready"
  | "error";

export interface SavedPlan {
  id: string;
  query: string;
  title: string;
  city: string;
  createdAt: string; // dd/mm/yyyy
  plan: ShoppingPlan;
}

interface PlanState {
  query: string;
  city: string;
  transport: TransportMode;
  servings: number;
  /** User's starting point (map picker / geolocation) — drives distance-aware optimization. */
  location: { lat: number; lon: number } | null;
  ner: NerResult | null;
  ingredients: IngredientInput[];
  plan: ShoppingPlan | null;
  status: PlanStatus;
  error: string | null;
  saved: SavedPlan[];
  setCity: (city: string) => void;
  setTransport: (mode: TransportMode) => void;
  setServings: (n: number) => void;
  setLocation: (loc: { lat: number; lon: number }) => void;
  run: (text: string) => Promise<void>;
  applyIngredients: (inputs: IngredientInput[]) => Promise<void>;
  /** Re-run store selection with the current location/transport (no NER). */
  reoptimize: () => Promise<void>;
  savePlan: () => string | null;
  reset: () => void;
}

// small delay so the 3-step loading overlay is visible (demo UX)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Servings from the query itself ("cho 12 người") — deterministic, works even
 * when the model misses the constraint (training data capped servings at 8).
 */
export function servingsFromQuery(query: string): number | null {
  const m = query.match(/cho\s+(\d{1,2})\s*(?:người|nguoi|ng)\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 50 ? n : null;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  query: "",
  city: "Đà Nẵng",
  transport: "motorbike",
  servings: 4,
  location: null,
  ner: null,
  ingredients: [],
  plan: null,
  status: "idle",
  error: null,
  saved: [],

  setCity: (city) => set({ city }),
  setTransport: (transport) => set({ transport }),
  setServings: (servings) => set({ servings: Math.max(1, servings) }),
  setLocation: (location) => set({ location }),

  run: async (text: string) => {
    const query = text.trim();
    if (!query) return;
    set({ query, status: "extracting", error: null, plan: null });

    try {
      const ner = await callNer(query);
      // Servings: explicit "cho N người" in the query wins; else the model's
      // extraction (>=2 — the adapter defaults to 1 when absent); else keep.
      const fromQuery = servingsFromQuery(query);
      const servings = fromQuery ?? (ner.serving_size >= 2 ? ner.serving_size : get().servings);
      set({ ner, servings, status: "matching" });
      await wait(450);

      const ingredients = recipeFromText(query) ?? nerToIngredients(ner);
      set({ status: "optimizing" });

      // Real Supabase products via /api/v1/optimize; mock catalog as fallback.
      const { location, transport } = get();
      const plan =
        (await callOptimize(ingredients, { location, transport })) ?? buildPlan(ingredients);
      // Store the SAME ingredient list the plan was built from, so Parse Preview
      // shows exactly what will be bought (not the raw model output).
      set({ ingredients, plan, status: "ready", city: ner.city || get().city });
    } catch (e) {
      set({
        status: "error",
        error: e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.",
      });
    }
  },

  applyIngredients: async (inputs: IngredientInput[]) => {
    // Rebuild the plan from a (possibly edited) ingredient list — Parse Preview edits.
    set({ ingredients: inputs, status: "optimizing" });
    const { location, transport } = get();
    const plan = (await callOptimize(inputs, { location, transport })) ?? buildPlan(inputs);
    set({ plan, status: "ready" });
  },

  reoptimize: async () => {
    // Same ingredients, new location/transport — e.g. the user moved the map's
    // starting point. Keeps the current plan visible while recomputing.
    const { ingredients, location, transport } = get();
    if (ingredients.length === 0) return;
    const plan = (await callOptimize(ingredients, { location, transport })) ?? buildPlan(ingredients);
    set({ plan, status: "ready" });
  },

  savePlan: () => {
    const { plan, query, city, saved } = get();
    if (!plan) return null;
    const id = `saved-${saved.length + 1}`;
    const title = query.length > 40 ? `${query.slice(0, 40)}…` : query;
    const entry: SavedPlan = {
      id,
      query,
      title,
      city,
      createdAt: "08/06/2026",
      plan,
    };
    set({ saved: [entry, ...saved] });
    return id;
  },

  reset: () =>
    set({ query: "", ner: null, plan: null, status: "idle", error: null }),
}));

export function retryPlan() {
  const { query, run } = usePlanStore.getState();
  if (query) void run(query);
}
