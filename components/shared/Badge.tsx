import type { ReactNode } from "react";

type Tone = "freshness" | "savings" | "warning" | "custom" | "success" | "neutral";

const TONES: Record<Tone, string> = {
  freshness: "bg-[var(--color-surface-container)] text-[var(--color-primary)]",
  savings: "bg-[var(--color-secondary-container)] text-white",
  warning: "bg-[var(--color-tertiary-fixed)] text-[var(--color-tertiary)]",
  custom: "bg-[var(--color-secondary-container)]/20 text-[var(--color-secondary)]",
  success: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  neutral: "bg-[var(--color-surface-high)] text-[var(--color-on-surface-variant)]",
};

// Small status badge — freshness/savings/warning/custom/confidence (Stitch).
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
