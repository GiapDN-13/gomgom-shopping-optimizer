"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useResultsStore } from "@/hooks/useResultsStore";
import { formatVnd, STORES } from "@/lib/shared/catalog";

// Product detail card — Figma screen 5. Slides over the results as a dialog.
export function ProductDetail() {
  const { selectedProduct, selectProduct } = useResultsStore();
  const store = selectedProduct ? STORES[selectedProduct.storeCode] : null;

  return (
    <AnimatePresence>
      {selectedProduct && store && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => selectProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Thông tin sản phẩm"
        >
          <motion.div
            className="w-full max-w-3xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Thông tin sản phẩm</h2>
              <button
                type="button"
                onClick={() => selectProduct(null)}
                aria-label="Đóng"
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background)]"
              >
                ↩
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <dl className="flex flex-col gap-5 text-[var(--color-text-primary)]">
                <DetailRow label="Tên sản phẩm" value={selectedProduct.name} />
                <div>
                  <dt className="font-semibold">Nguồn</dt>
                  <dd className="mt-1 flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: store.color }}
                      aria-hidden
                    />
                    {store.name}
                  </dd>
                </div>
                <DetailRow label="Đơn vị" value={selectedProduct.unit} />
                <DetailRow label="Giá bán" value={formatVnd(selectedProduct.price)} />
                <div>
                  <dt className="font-semibold">Tình trạng</dt>
                  <dd className="mt-1 text-[var(--color-text-secondary)]">
                    {selectedProduct.inStock ? "Còn hàng" : "Hết hàng"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Link sản phẩm</dt>
                  <dd className="mt-1">
                    {selectedProduct.url ? (
                      <a
                        href={selectedProduct.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-primary)] underline"
                      >
                        Xem tại {store.name}
                      </a>
                    ) : (
                      <span className="text-[var(--color-on-surface-variant)]">
                        Chưa có link
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
              <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)]">
                {selectedProduct.image ? (
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    sizes="(max-width: 768px) 90vw, 320px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-5xl" aria-hidden>
                    🛒
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold">{label}</dt>
      <dd className="mt-1 text-[var(--color-text-secondary)]">{value}</dd>
    </div>
  );
}
