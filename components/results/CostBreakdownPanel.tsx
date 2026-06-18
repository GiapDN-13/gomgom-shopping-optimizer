"use client";

import { formatVnd } from "@/lib/shared/catalog";
import type { ShoppingPlan } from "@/lib/services/buildPlan";

// Cost breakdown + route reason + freshness/disclaimer (FR-19, FR-20, NFR-30/31).
export function CostBreakdownPanel({ plan }: { plan: ShoppingPlan }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Chi tiết chi phí</h2>

      <div className="flex flex-col gap-2 text-sm">
        <Row label="Tiền hàng" value={formatVnd(plan.productTotal)} />
        <Row label="Phí giao" value={formatVnd(plan.deliveryTotal)} />
        <Row label="Số cửa hàng" value={`${plan.storeCount} cửa hàng`} />
        <div className="my-1 border-t border-[var(--color-border)]" />
        <Row label="Tổng cộng" value={formatVnd(plan.finalTotal)} strong />
      </div>

      {/* route reason — the killer feature */}
      <div className="mt-4 rounded-[var(--radius-input)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-text-secondary)]">
        <span className="font-semibold text-[var(--color-text-primary)]">Vì sao chọn lộ trình này? </span>
        {plan.reason}
      </div>

      {/* stale data warning (NFR-30) */}
      {plan.staleStores.length > 0 && (
        <div
          role="alert"
          className="mt-3 rounded-[var(--radius-input)] border border-[var(--color-warning)] bg-[var(--color-warning)]/10 p-3 text-sm text-[var(--color-warning)]"
        >
          Dữ liệu giá tại {plan.staleStores.join(", ")} có thể đã cũ (&gt;48 giờ).
        </div>
      )}

      {/* disclaimer (NFR-31) */}
      <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
        Giá hiển thị mang tính tham khảo, có thể thay đổi tại cửa hàng.
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold" : "text-[var(--color-text-secondary)]"}>
        {label}
      </span>
      <span className={`tabular-nums ${strong ? "text-lg font-bold text-[var(--color-primary)]" : ""}`}>
        {value}
      </span>
    </div>
  );
}
