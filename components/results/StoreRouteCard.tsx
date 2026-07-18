"use client";

import { ProductCard } from "@/components/shared/ProductCard";
import { useResultsStore } from "@/hooks/useResultsStore";
import { formatVnd } from "@/lib/shared/catalog";
import type { PlanStore } from "@/lib/services/buildPlan";

// One store stop in visit order (StoreRouteCard) — store-grouped, plan-first.
export function StoreRouteCard({
  store,
  order,
  substitutedIds,
}: {
  store: PlanStore;
  order: number;
  /** product ids standing in for a variety the user named (near-match swaps) */
  substitutedIds?: Set<string>;
}) {
  const { layout, selectProduct } = useResultsStore();
  const stale = store.lastUpdatedHoursAgo > 48;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: store.color }}
        >
          {order}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold">{store.name}</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{store.address}</p>
          <span
            className={`mt-1 inline-block rounded-[var(--radius-pill)] px-2 py-0.5 text-xs ${
              stale
                ? "bg-[var(--color-warning)]/15 text-[var(--color-warning)]"
                : "bg-[var(--color-success)]/10 text-[var(--color-success)]"
            }`}
          >
            {stale
              ? `Dữ liệu giá có thể đã cũ (>48 giờ)`
              : `Cập nhật ${store.lastUpdatedHoursAgo} giờ trước`}
          </span>
        </div>
      </div>

      <div
        className={
          layout === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
            : "flex flex-col gap-3"
        }
      >
        {store.items.map((item) => (
          <div key={item.product.id} className="relative">
            {substitutedIds?.has(item.product.id) && (
              <span className="absolute right-2 top-2 z-10 rounded-[var(--radius-pill)] bg-[#ff7a1b]/90 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                ≈ Thay thế gần đúng
              </span>
            )}
            <ProductCard
              product={item.product}
              layout={layout}
              onClick={() => selectProduct(item.product)}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-1 border-t border-[var(--color-border)] pt-3 text-sm">
        <Row label="Tạm tính" value={formatVnd(store.productSubtotal)} />
        <Row label="Phí giao (ước tính)" value={formatVnd(store.deliveryFee)} muted />
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-[var(--color-text-secondary)]" : ""}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-[var(--color-text-secondary)]" : "font-semibold"}`}>
        {value}
      </span>
    </div>
  );
}
