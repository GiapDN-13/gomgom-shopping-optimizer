"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/history", label: "Lịch sử" },
  { href: "/monitoring", label: "Monitoring" },
  { href: "/settings", label: "Cài đặt" },
];

// Sticky top navigation used on every page (Stitch).
export function TopNavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-outline-variant)]/60 bg-[var(--color-surface)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[var(--color-primary)]"
          aria-label="Gomgom — trang chủ"
        >
          Gomgom
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-high)]"
                }`}
              >
                {item.label}
                {active && (
                  <span className="mx-3 block h-0.5 rounded-full bg-[var(--color-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="hidden items-center rounded-[var(--radius-pill)] border border-[var(--color-outline-variant)] text-xs sm:flex"
            role="group"
            aria-label="Ngôn ngữ"
          >
            <button className="rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-2.5 py-1 font-semibold text-[var(--color-on-primary)]">
              VI
            </button>
            <button className="px-2.5 py-1 text-[var(--color-on-surface-variant)]">EN</button>
          </div>
          <Link
            href="/auth/login"
            className="rounded-[var(--radius-input)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-high)]"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
