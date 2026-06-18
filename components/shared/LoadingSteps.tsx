"use client";

import { motion } from "framer-motion";
import type { PlanStatus } from "@/hooks/usePlanStore";

const STEPS: Array<{ status: PlanStatus; label: string }> = [
  { status: "extracting", label: "Đang trích xuất danh sách…" },
  { status: "optimizing", label: "Đang tối ưu đường mua…" },
];

// 3-step progress strip shown while the plan pipeline runs (FR-03).
export function LoadingSteps({ status }: { status: PlanStatus }) {
  const activeIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const done = activeIndex > i;
          const active = activeIndex === i;
          return (
            <div key={step.status} className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  done || active
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-border)]"
                }`}
              />
              {i < STEPS.length - 1 && (
                <span className="h-px w-8 bg-[var(--color-border)]" />
              )}
            </div>
          );
        })}
      </div>
      <motion.p
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-[var(--color-text-secondary)]"
      >
        {STEPS[Math.max(0, activeIndex)]?.label ?? "Đang xử lý…"}
      </motion.p>
    </div>
  );
}
