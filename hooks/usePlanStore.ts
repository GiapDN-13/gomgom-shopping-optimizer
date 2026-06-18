import { create } from "zustand";
import type { NerResult } from "@/lib/services/ner";
import { callNer, nerToIngredients, recipeFromText } from "@/lib/services/ner";
import { buildPlan, type ShoppingPlan } from "@/lib/services/buildPlan";

export type PlanStatus = "idle" | "extracting" | "optimizing" | "ready" | "error";

interface PlanState {
  query: string;
  ner: NerResult | null;
  plan: ShoppingPlan | null;
  status: PlanStatus;
  error: string | null;
  // Run the full pipeline: NER -> ingredients -> plan.
  run: (text: string) => Promise<void>;
  reset: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  query: "",
  ner: null,
  plan: null,
  status: "idle",
  error: null,

  run: async (text: string) => {
    const query = text.trim();
    if (!query) return;
    set({ query, status: "extracting", error: null, plan: null });

    try {
      const ner = await callNer(query);
      set({ ner, status: "optimizing" });

      // Prefer a recognised dish recipe; otherwise use the extracted ingredients.
      const ingredients = recipeFromText(query) ?? nerToIngredients(ner);
      const plan = buildPlan(ingredients);
      set({ plan, status: "ready" });
    } catch (e) {
      set({
        status: "error",
        error: e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.",
      });
    }
  },

  reset: () => set({ query: "", ner: null, plan: null, status: "idle", error: null }),
}));

// Convenience selector so non-react callers (e.g. retry) can re-run.
export function retryPlan() {
  const { query, run } = usePlanStore.getState();
  if (query) void run(query);
}
