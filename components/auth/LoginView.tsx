"use client";

import { useState } from "react";
import Link from "next/link";
import { TextInput } from "@/components/shared/FormControls";
import { Button } from "@/components/shared/Button";
import { GlowBackground } from "@/components/shared/GlowBackground";

// Auth — Stitch "ng_nh_p": tabs + email/password + Google + guest path (FR-26/27, NFR-25).
export function LoginView() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Demo: no real auth yet. Show the error state if fields are blank.
    setError(!email || !password);
  }

  return (
    <section className="relative grid min-h-[80vh] place-items-center px-6">
      <GlowBackground />
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-7 shadow-[var(--shadow-elevation)]">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary)]/10 text-xl">
            🧺
          </span>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Gomgom</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Thông minh hóa việc đi chợ của bạn.
          </p>
        </div>

        {/* tabs */}
        <div className="mb-5 flex border-b border-[var(--color-outline-variant)]/50">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 border-b-2 pb-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-on-surface-variant)]"
              }`}
            >
              {t === "signin" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
              Email
            </label>
            <TextInput
              id="email"
              type="email"
              placeholder="Nhập địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="pw" className={`text-xs font-semibold uppercase tracking-wide ${error ? "text-[var(--color-error)]" : "text-[var(--color-on-surface-variant)]"}`}>
                Mật khẩu
              </label>
              <button type="button" className="text-xs text-[var(--color-primary)] hover:underline">
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <TextInput
                id="pw"
                type={showPw ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]"
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {error && (
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-error)]">
                ⚠ Email hoặc mật khẩu không đúng.
              </p>
            )}
          </div>

          <Button type="submit" fullWidth>
            {tab === "signin" ? "Tiếp tục →" : "Tạo tài khoản →"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-[var(--color-on-surface-variant)]">
          <span className="h-px flex-1 bg-[var(--color-outline-variant)]/50" />
          hoặc
          <span className="h-px flex-1 bg-[var(--color-outline-variant)]/50" />
        </div>

        <Button variant="secondary" fullWidth>
          <span aria-hidden>🔵</span> Đăng nhập với Google
        </Button>

        <div className="mt-5 border-t border-[var(--color-outline-variant)]/40 pt-4 text-center">
          <Link href="/" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            Tiếp tục không cần tài khoản →
          </Link>
          <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
            Bạn vẫn dùng được mọi tính năng; lịch sử sẽ không được lưu.
          </p>
        </div>
      </div>
    </section>
  );
}
