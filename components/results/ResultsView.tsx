"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QueryPill } from "@/components/shared/QueryPill";
import { MapPanel } from "@/components/shared/MapPanel";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { Button } from "@/components/shared/Button";
import { PlanSummary } from "./PlanSummary";
import { StoreRouteCard } from "./StoreRouteCard";
import { AlternativePlans } from "./AlternativePlans";
import { CostBreakdownPanel } from "./CostBreakdownPanel";
import { ProductDetail } from "./ProductDetail";
import { useResultsStore } from "@/hooks/useResultsStore";
import { usePlanStore } from "@/hooks/usePlanStore";
import { findSubstitutions } from "@/lib/services/substitution";

export function ResultsView({ fallbackQuery }: { fallbackQuery: string }) {
  const router = useRouter();
  const { mapExpanded, toggleMap } = useResultsStore();
  const { query, plan, status, error, run, savePlan } = usePlanStore();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "idle" && !plan) void run(fallbackQuery);
  }, [status, plan, run, fallbackQuery]);

  const displayQuery = query || fallbackQuery;
  const isLoading =
    status === "extracting" || status === "matching" || status === "optimizing" || (status === "idle" && !plan);

  function handleSave() {
    const id = savePlan();
    if (id) setSaved(true);
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <div className="mb-6">
        <QueryPill text={displayQuery} />
      </div>

      {isLoading && <LoadingOverlay status={status === "idle" ? "extracting" : status} />}

      {status === "error" && (
        <div role="alert" className="mx-auto max-w-md rounded-[var(--radius-card)] border border-[var(--color-error)] bg-[var(--color-surface-lowest)] p-6 text-center">
          <p className="mb-3 text-[var(--color-error)]">{error}</p>
          <Button onClick={() => void run(displayQuery)}>Thử lại</Button>
        </div>
      )}

      {status === "ready" && plan && (
        <>
          {mapExpanded ? (
            <MapPanel expanded stores={plan.stores} onToggle={toggleMap} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.62fr_1fr]">
              {/* LEFT */}
              <div className="flex flex-col gap-5">
                <PlanSummary title={displayQuery} plan={plan} />
                {(() => {
                  const substitutedIds = new Set(
                    findSubstitutions(displayQuery, plan).map((s) => s.item.product.id),
                  );
                  return plan.stores.map((store, i) => (
                    <StoreRouteCard
                      key={store.code}
                      store={store}
                      order={i + 1}
                      substitutedIds={substitutedIds}
                    />
                  ));
                })()}
                <AlternativePlans plan={plan} />
              </div>

              {/* RIGHT sticky */}
              <div className="flex flex-col gap-5 lg:sticky lg:top-20 lg:self-start">
                <div className="h-[280px]">
                  <MapPanel stores={plan.stores} onToggle={toggleMap} />
                </div>
                <CostBreakdownPanel plan={plan} />
                <div className="flex flex-col gap-2">
                  <Button fullWidth onClick={handleSave} disabled={saved}>
                    {saved ? "✓ Đã lưu kế hoạch" : "Lưu kế hoạch"}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => window.print()}>
                      In / Xuất PDF
                    </Button>
                    <Button variant="secondary" onClick={() => router.push("/history")}>
                      Lịch sử
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <ProductDetail />
        </>
      )}
    </div>
  );
}
