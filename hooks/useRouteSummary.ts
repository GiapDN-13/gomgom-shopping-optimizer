"use client";

import { create } from "zustand";

// Shared route metrics: MapPanel computes the real OSRM route and publishes the
// summary here; PlanSummary reads it so the header chips match the map.
export interface RouteSummary {
  distanceM: number;
  durationS: number;
  estimated: boolean; // straight-line fallback (no routing service reachable)
}

interface RouteSummaryStore {
  summary: RouteSummary | null;
  setSummary: (s: RouteSummary | null) => void;
}

export const useRouteSummary = create<RouteSummaryStore>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
}));
