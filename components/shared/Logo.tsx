import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`text-2xl font-bold tracking-tight text-[var(--color-primary)] ${className}`}
      aria-label="Gomgom — trang chủ"
    >
      Gomgom
    </Link>
  );
}
