// Sign In / Sign Up — FR-26, FR-27, NFR-25. Supabase Auth. Built in Sprint 6.
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Đăng nhập</h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        Đăng nhập email/mật khẩu và Google OAuth (Supabase Auth) sẽ có ở Sprint 6.
      </p>
      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
        Bạn vẫn dùng được mọi tính năng mà không cần tài khoản; lịch sử sẽ không
        được lưu.
      </p>
    </main>
  );
}
