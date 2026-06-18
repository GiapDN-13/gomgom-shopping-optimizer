"use client";

import { useResultsStore } from "@/hooks/useResultsStore";
import { formatVnd } from "@/lib/shared/catalog";
import type { ShoppingPlan } from "@/lib/services/buildPlan";
import { StoreRouteCard } from "./StoreRouteCard";

// Left column on Results — layout toggle + grand total + store-grouped route cards.
export function PlanColumn({ plan }: { plan: ShoppingPlan }) {
  const { layout, setLayout } = useResultsStore();
  const isGrid = layout === "grid";

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div
          role="group"
          aria-label="Kiểu hiển thị"
          className="flex overflow-hidden rounded-[var(--radius-input)] border border-[var(--color-border)]"
        >
          <button
            type="button"
            onClick={() => setLayout("list")}
            aria-pressed={!isGrid}
            aria-label="Xem dạng danh sách"
            className={`grid h-9 w-10 place-items-center transition-colors ${
              !isGrid ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)]"
            }`}
          >
            ≣
          </button>
          <button
            type="button"
            onClick={() => setLayout("grid")}
            aria-pressed={isGrid}
            aria-label="Xem dạng lưới"
            className={`grid h-9 w-10 place-items-center transition-colors ${
              isGrid ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)]"
            }`}
          >
            ▦
          </button>
        </div>
        <span className="text-lg font-semibold">
          Tổng tiền: {formatVnd(plan.finalTotal)}
        </span>
      </div>

      {/* unmatched warning (FR-06) */}
      {plan.unmatched.length > 0 && (
        <div
          role="alert"
          className="mb-3 rounded-[var(--radius-input)] border border-[var(--color-warning)] bg-[var(--color-warning)]/10 p-3 text-sm text-[var(--color-warning)]"
        >
          Không tìm thấy sản phẩm cho: {plan.unmatched.join(", ")}.
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1">
        {plan.stores.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-text-secondary)]">
            Không có sản phẩm phù hợp. Hãy thử mô tả khác.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {plan.stores.map((store, i) => (
              <StoreRouteCard key={store.code} store={store} order={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
