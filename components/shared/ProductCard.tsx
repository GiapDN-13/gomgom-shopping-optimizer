"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { formatVnd, type CatalogProduct } from "@/lib/shared/catalog";
import { STORES } from "@/lib/shared/catalog";

interface ProductCardProps {
  product: CatalogProduct;
  layout: "list" | "grid";
  onClick?: () => void;
}

export function ProductCard({ product, layout, onClick }: ProductCardProps) {
  const isGrid = layout === "grid";
  const store = STORES[product.storeCode];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
        isGrid ? "flex-col items-stretch text-center" : ""
      }`}
      aria-label={`${product.name} — ${store.name} — ${formatVnd(product.price)}`}
    >
      <div
        className={`relative overflow-hidden rounded-[var(--radius-input)] bg-[var(--color-border)] ${
          isGrid ? "aspect-square w-full" : "h-20 w-20 shrink-0"
        }`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 33vw, 160px"
          className="object-cover"
        />
      </div>
      <div className={`flex flex-1 flex-col ${isGrid ? "" : "gap-1"}`}>
        <span className="text-base font-semibold text-[var(--color-text-primary)]">
          {product.name}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: store.color }}
            aria-hidden
          />
          {store.name}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">{product.unit}</span>
        <span
          className={`font-bold text-[var(--color-text-primary)] ${
            isGrid ? "mt-1" : "mt-1 self-end text-lg"
          }`}
        >
          {formatVnd(product.price)}
        </span>
      </div>
    </motion.button>
  );
}
