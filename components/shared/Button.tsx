"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:bg-[var(--color-primary-container)] hover:shadow-[var(--shadow-hover)]",
  secondary:
    "border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-low)]",
  ghost:
    "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-high)]",
  danger:
    "border border-[var(--color-error)] bg-transparent text-[var(--color-error)] hover:bg-[var(--color-error-container)]/30",
};

// Reusable button — primary/secondary/ghost/danger + loading/disabled (44px min target).
export function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-input)] px-5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTS[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {loading ? "Đang xử lý…" : children}
    </button>
  );
}
