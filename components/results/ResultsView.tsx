"use client";

import { useEffect } from "react";
import { QueryPill } from "@/components/shared/QueryPill";
import { MapPanel } from "@/components/shared/MapPanel";
import { LoadingSteps } from "@/components/shared/LoadingSteps";
import { PlanColumn } from "./PlanColumn";
import { CostBreakdownPanel } from "./CostBreakdownPanel";
import { ProductDetail } from "./ProductDetail";
import { useResultsStore } from "@/hooks/useResultsStore";
import { usePlanStore } from "@/hooks/usePlanStore";

// Results — Figma screens 2–5, now plan-first and driven by the plan store.
export function ResultsView({ fallbackQuery }: { fallbackQuery: string }) {
  const { mapExpanded, toggleMap } = useResultsStore();
  const { query, plan, status, error, run } = usePlanStore();

  // If the user landed directly (no plan in memory), run the pipeline once.
  useEffect(() => {
    if (status === "idle" && !plan) {
      void run(fallbackQuery);
    }
  }, [status, plan, run, fallbackQuery]);

  const displayQuery = query || fallbackQuery;
  const isLoading = status === "extracting" || status === "optimizing" || (status === "idle" && !plan);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6">
        <QueryPill text={displayQuery} />
      </div>

      {isLoading && (
        <div className="grid place-items-center py-24">
          <LoadingSteps status={status === "idle" ? "extracting" : status} />
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="mx-auto max-w-md rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-surface)] p-6 text-center">
          <p className="mb-3 text-[var(--color-danger)]">{error}</p>
          <button
            type="button"
            onClick={() => void run(displayQuery)}
            className="rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            Thử lại
          </button>
        </div>
      )}

      {status === "ready" && plan && (
        <>
          {mapExpanded ? (
            <MapPanel expanded stores={plan.stores} onToggle={toggleMap} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="h-[72vh]">
                <PlanColumn plan={plan} />
              </div>
              <div className="flex flex-col gap-6">
                <div className="h-[40vh]">
                  <MapPanel stores={plan.stores} onToggle={toggleMap} />
                </div>
                <CostBreakdownPanel plan={plan} />
              </div>
            </div>
          )}
          <ProductDetail />
        </>
      )}
    </div>
  );
}
