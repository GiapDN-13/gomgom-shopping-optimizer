"use client";

import { formatVnd } from "@/lib/shared/catalog";
import type { ShoppingPlan } from "@/lib/services/buildPlan";

// Collapsible "Phương án khác" — derived comparison plans (Stitch Results).
export function AlternativePlans({ plan }: { plan: ShoppingPlan }) {
  // Synthesise 1–2 plausible alternatives relative to the chosen plan.
  const alts = [
    {
      label: "Gộp 1 cửa hàng (BHX)",
      total: plan.finalTotal + 22000,
      note: "Tiện hơn nhưng giá kệ cao hơn vài món.",
      issue: false,
    },
    {
      label: "Tách thêm cửa hàng giá rẻ",
      total: plan.finalTotal + 10000,
      note: "Giá kệ thấp hơn nhưng tốn thêm phí giao.",
      issue: true,
    },
  ];

  return (
    <details className="rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-4">
      <summary className="cursor-pointer text-sm font-semibold">Phương án khác</summary>
      <div className="mt-3 flex flex-col gap-2">
        {alts.map((a) => (
          <div
            key={a.label}
            className="flex items-center justify-between rounded-[var(--radius-input)] border border-[var(--color-outline-variant)]/40 p-3"
          >
            <div>
              <p className="text-sm font-medium">{a.label}</p>
              <p className="text-xs text-[var(--color-on-surface-variant)]">{a.note}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">{formatVnd(a.total)}</p>
              <p className="text-xs tabular-nums text-[var(--color-secondary)]">
                +{formatVnd(a.total - plan.finalTotal)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
