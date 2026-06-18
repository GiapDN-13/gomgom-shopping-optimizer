"use client";

import { ProductCard } from "@/components/shared/ProductCard";
import { useResultsStore } from "@/hooks/useResultsStore";
import { MOCK_PRODUCTS, MOCK_TOTAL, formatVnd } from "@/lib/shared/mockData";

export function ProductListPanel() {
  const { layout, setLayout, selectProduct } = useResultsStore();
  const isGrid = layout === "grid";

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      {/* header: layout toggle + total */}
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
          Tổng tiền: {formatVnd(MOCK_TOTAL)}
        </span>
      </div>

      {/* scrollable products */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div
          className={
            isGrid
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
              : "flex flex-col gap-3"
          }
        >
          {MOCK_PRODUCTS.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              layout={layout}
              onClick={() => selectProduct(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
