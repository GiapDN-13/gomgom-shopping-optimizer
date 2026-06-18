"use client";

import { Badge } from "@/components/shared/Badge";
import { formatVnd } from "@/lib/shared/catalog";
import type { ShoppingPlan } from "@/lib/services/buildPlan";

// Plan summary header card — title + "Kế hoạch tốt nhất" + total + reason + 4 stats (Stitch Results).
export function PlanSummary({ title, plan }: { title: string; plan: ShoppingPlan }) {
  // Derive simple route metrics (real distances arrive with the Sprint 4 optimizer).
  const km = (plan.storeCount * 1.6 + 1.6).toFixed(1).replace(".", ",");
  const minutes = plan.storeCount * 6 + 6;

  const stats = [
    { icon: "🏪", label: `${plan.storeCount} cửa hàng` },
    { icon: "🧭", label: `${km} km` },
    { icon: "⏱️", label: `~${minutes} phút` },
    { icon: "✅", label: `${plan.unmatched.length} món thiếu` },
  ];

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <Badge tone="success">✓ Kế hoạch tốt nhất</Badge>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums text-[var(--color-primary)]">
          {formatVnd(plan.finalTotal)}
        </span>
        <span className="pb-1 text-sm text-[var(--color-on-surface-variant)]">đã gồm phí giao</span>
      </div>

      {/* route reason — the killer feature */}
      <div className="mt-3 rounded-[var(--radius-input)] border-l-4 border-[var(--color-secondary-container)] bg-[var(--color-surface-low)] p-3 text-sm">
        <span className="font-semibold">Lý do chọn: </span>
        {plan.reason}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-[var(--radius-input)] bg-[var(--color-surface-container)] p-3 text-center"
          >
            <span aria-hidden>{s.icon}</span>
            <span className="text-sm font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
