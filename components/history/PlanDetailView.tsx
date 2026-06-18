"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { MapPanel } from "@/components/shared/MapPanel";
import { PlanSummary } from "@/components/results/PlanSummary";
import { StoreRouteCard } from "@/components/results/StoreRouteCard";
import { CostBreakdownPanel } from "@/components/results/CostBreakdownPanel";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePlanStore } from "@/hooks/usePlanStore";

// Saved plan detail — read-only Results layout + re-run (Stitch "chi_ti_t_k_ho_ch_l_u").
export function PlanDetailView({ planId }: { planId: string }) {
  const router = useRouter();
  const entry = usePlanStore((s) => s.saved.find((p) => p.id === planId));
  const run = usePlanStore((s) => s.run);

  if (!entry) {
    return (
      <EmptyState
        icon="🔖"
        title="Không tìm thấy kế hoạch"
        description="Kế hoạch này không tồn tại hoặc chưa được lưu trong phiên hiện tại."
        ctaLabel="Về lịch sử"
        ctaHref="/history"
      />
    );
  }

  function rerun() {
    if (!entry) return;
    void run(entry.query);
    router.push("/results/demo");
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <Link
        href="/history"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
      >
        ← Quay lại lịch sử
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{entry.title}</h1>
          <Badge tone="freshness">🔖 Đã lưu • {entry.createdAt}</Badge>
        </div>
        <Button onClick={rerun}>↻ Chạy lại với giá mới</Button>
      </div>

      <div className="mb-5 rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
          Yêu cầu gốc
        </p>
        <p className="mt-1 italic">&ldquo;{entry.query}&rdquo;</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.62fr_1fr]">
        <div className="flex flex-col gap-5">
          <PlanSummary title={entry.title} plan={entry.plan} />
          {entry.plan.stores.map((store, i) => (
            <StoreRouteCard key={store.code} store={store} order={i + 1} />
          ))}
        </div>
        <div className="flex flex-col gap-5 lg:sticky lg:top-20 lg:self-start">
          <div className="h-[280px]">
            <MapPanel stores={entry.plan.stores} />
          </div>
          <CostBreakdownPanel plan={entry.plan} />
        </div>
      </div>
    </div>
  );
}
