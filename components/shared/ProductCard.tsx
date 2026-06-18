"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { MockProduct } from "@/lib/shared/mockData";
import { formatVnd } from "@/lib/shared/mockData";

interface ProductCardProps {
  product: MockProduct;
  layout: "list" | "grid";
  onClick?: () => void;
}

export function ProductCard({ product, layout, onClick }: ProductCardProps) {
  const isGrid = layout === "grid";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
        isGrid ? "flex-col items-stretch text-center" : ""
      }`}
      aria-label={`${product.name} — ${product.store} — ${formatVnd(product.price)}`}
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
        <span className="text-lg font-semibold text-[var(--color-text-primary)]">
          {product.name}
        </span>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {product.store}
        </span>
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
