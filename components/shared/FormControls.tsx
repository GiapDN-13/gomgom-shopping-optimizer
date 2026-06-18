"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

const FIELD =
  "h-11 w-full rounded-[var(--radius-input)] border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 text-sm outline-none transition-shadow focus:border-[var(--color-primary)] focus:shadow-[0_0_0_2px_rgba(0,106,66,0.2)]";

export function TextInput({
  error,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`${FIELD} ${
        error
          ? "border-[var(--color-error)] bg-[var(--color-error-container)]/10 focus:border-[var(--color-error)] focus:shadow-none"
          : ""
      } ${className}`}
      {...rest}
    />
  );
}

export function Select({
  children,
  className = "",
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={`${FIELD} appearance-none pr-8 ${className}`} {...rest}>
      {children}
    </select>
  );
}

// iOS-style toggle (dark mode, preferences).
export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${
        checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-outline-variant)]"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// Segmented control (transport mode, language).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex gap-1 rounded-[var(--radius-input)] bg-[var(--color-surface-variant)] p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-[calc(var(--radius-input)-4px)] px-3 text-sm font-medium transition-all ${
              active
                ? "bg-[var(--color-surface-lowest)] text-[var(--color-primary)] shadow-sm"
                : "text-[var(--color-on-surface-variant)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
