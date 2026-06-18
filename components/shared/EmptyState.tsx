import Link from "next/link";

// Generic empty state — icon + title + description + CTA (Stitch).
export function EmptyState({
  icon = "🧺",
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon?: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="text-6xl" aria-hidden>
        {icon}
      </span>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-[var(--color-on-surface-variant)]">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="rounded-[var(--radius-input)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-container)]"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
