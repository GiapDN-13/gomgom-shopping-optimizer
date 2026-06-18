"use client";

import { QueryPill } from "@/components/shared/QueryPill";
import { MapPanel } from "@/components/shared/MapPanel";
import { ProductListPanel } from "./ProductListPanel";
import { ProductDetail } from "./ProductDetail";
import { useResultsStore } from "@/hooks/useResultsStore";

export function ResultsView({ query }: { query: string }) {
  const { mapExpanded, toggleMap } = useResultsStore();

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6">
        <QueryPill text={query} />
      </div>

      {mapExpanded ? (
        // Figma screen 4 — full-width map.
        <MapPanel expanded onToggle={toggleMap} />
      ) : (
        // Figma screens 2 & 3 — two columns.
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-[70vh]">
            <ProductListPanel />
          </div>
          <div className="h-[70vh]">
            <MapPanel onToggle={toggleMap} />
          </div>
        </div>
      )}

      <ProductDetail />
    </div>
  );
}
