import { create } from "zustand";
import type { NerResult } from "@/lib/services/ner";
import { callNer, nerToIngredients, recipeFromText } from "@/lib/services/ner";
import { buildPlan, type ShoppingPlan, type IngredientInput } from "@/lib/services/buildPlan";
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
  ner: NerResult | null;
  ingredients: IngredientInput[];
  plan: ShoppingPlan | null;
  status: PlanStatus;
  error: string | null;
  saved: SavedPlan[];
  setCity: (city: string) => void;
  setTransport: (mode: TransportMode) => void;
  setServings: (n: number) => void;
  run: (text: string) => Promise<void>;
  applyIngredients: (inputs: IngredientInput[]) => void;
  savePlan: () => string | null;
  reset: () => void;
}

// small delay so the 3-step loading overlay is visible (demo UX)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const usePlanStore = create<PlanState>((set, get) => ({
  query: "",
  city: "Đà Nẵng",
  transport: "motorbike",
  servings: 4,
  ner: null,
  ingredients: [],
  plan: null,
  status: "idle",
  error: null,
  saved: [],

  setCity: (city) => set({ city }),
  setTransport: (transport) => set({ transport }),
  setServings: (servings) => set({ servings: Math.max(1, servings) }),

  run: async (text: string) => {
    const query = text.trim();
    if (!query) return;
    set({ query, status: "extracting", error: null, plan: null });

    try {
      const ner = await callNer(query);
      set({ ner, status: "matching" });
      await wait(450);

      const ingredients = recipeFromText(query) ?? nerToIngredients(ner);
      set({ status: "optimizing" });
      await wait(450);

      const plan = buildPlan(ingredients);
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

  applyIngredients: (inputs: IngredientInput[]) => {
    // Rebuild the plan from a (possibly edited) ingredient list — Parse Preview edits.
    set({ ingredients: inputs, plan: buildPlan(inputs), status: "ready" });
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
