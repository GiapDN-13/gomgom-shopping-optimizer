import Link from "next/link";

// Sign-in-required gate — glass card over a soft background (Stitch History).
export function SignInGate({
  title = "Đăng nhập để xem lịch sử",
  description = "Đăng nhập vào tài khoản để lưu và xem lại các kế hoạch mua sắm của bạn.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid place-items-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-lowest)]/80 p-8 text-center shadow-[var(--shadow-elevation)] backdrop-blur">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-primary)]/10 text-2xl text-[var(--color-primary)]">
          🔒
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-[var(--color-on-surface-variant)]">{description}</p>
        <Link
          href="/auth/login"
          className="rounded-[var(--radius-input)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-container)]"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
