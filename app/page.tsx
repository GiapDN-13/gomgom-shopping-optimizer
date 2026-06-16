import Link from "next/link";

// Home / Input — FR-01, FR-02, FR-03, FR-05. Full UI lands in Sprint 2.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[760px] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <span className="rounded-full bg-[var(--color-surface)] px-4 py-1 text-sm font-medium text-[var(--color-primary)] shadow-sm">
        Gomgom — Shopping Optimizer
      </span>
      <h1 className="text-3xl font-bold sm:text-4xl">
        Bạn muốn nấu hay mua gì hôm nay?
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)]">
        Mô tả bằng lời — Gomgom lo phần còn lại.
      </p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Sprint 1: project shell đã sẵn sàng. Form nhập liệu &amp; tích hợp NER sẽ
        có ở Sprint 2.
      </p>
      <nav className="mt-4 flex gap-4 text-sm">
        <Link className="text-[var(--color-primary)] hover:underline" href="/history">
          Lịch sử
        </Link>
        <Link className="text-[var(--color-primary)] hover:underline" href="/settings">
          Cài đặt
        </Link>
        <Link className="text-[var(--color-primary)] hover:underline" href="/auth/login">
          Đăng nhập
        </Link>
      </nav>
      <p className="mt-8 text-xs text-[var(--color-text-secondary)]">
        Giá hiển thị mang tính tham khảo.
      </p>
    </main>
  );
}
