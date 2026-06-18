import { create } from "zustand";
import type { CatalogProduct } from "@/lib/shared/catalog";

type Layout = "list" | "grid";

interface ResultsState {
  layout: Layout;
  selectedProduct: CatalogProduct | null;
  mapExpanded: boolean;
  setLayout: (layout: Layout) => void;
  selectProduct: (product: CatalogProduct | null) => void;
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
