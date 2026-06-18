"use client";

import { motion } from "framer-motion";
import type { PlanStatus } from "@/hooks/usePlanStore";

const STEPS: Array<{ key: PlanStatus; label: string }> = [
  { key: "extracting", label: "Đang trích xuất danh sách" },
  { key: "matching", label: "Đang so khớp sản phẩm" },
  { key: "optimizing", label: "Đang tối ưu đường mua" },
];

// Full-screen 3-step loading overlay with a cancel action (FR-03, Stitch Home).
export function LoadingOverlay({
  status,
  onCancel,
}: {
  status: PlanStatus;
  onCancel?: () => void;
}) {
  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === status),
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--color-surface-lowest)] p-6 shadow-[var(--shadow-elevation)]">
        <h2 className="mb-5 text-center text-lg font-semibold">Đang tạo kế hoạch…</h2>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <li key={step.key} className="flex items-center gap-3">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${
                    done
                      ? "bg-[var(--color-primary)] text-white"
                      : active
                        ? "border-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                        : "border-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm ${
                    active
                      ? "font-medium text-[var(--color-on-surface)]"
                      : "text-[var(--color-on-surface-variant)]"
                  }`}
                >
                  {step.label}
                  {active && "…"}
                </span>
                {active && (
                  <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                )}
              </li>
            );
          })}
        </ol>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-6 w-full rounded-[var(--radius-input)] border border-[var(--color-outline-variant)] py-2 text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-low)]"
          >
            Hủy bỏ
          </button>
        )}
      </div>
    </motion.div>
  );
}
