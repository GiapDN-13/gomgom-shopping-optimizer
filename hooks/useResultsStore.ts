import { create } from "zustand";
import type { MockProduct } from "@/lib/shared/mockData";

type Layout = "list" | "grid";

interface ResultsState {
  layout: Layout;
  selectedProduct: MockProduct | null;
  mapExpanded: boolean;
  setLayout: (layout: Layout) => void;
  selectProduct: (product: MockProduct | null) => void;
  toggleMap: () => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  layout: "list",
  selectedProduct: null,
  mapExpanded: false,
  setLayout: (layout) => set({ layout }),
  selectProduct: (selectedProduct) => set({ selectedProduct }),
  toggleMap: () => set((s) => ({ mapExpanded: !s.mapExpanded })),
}));
