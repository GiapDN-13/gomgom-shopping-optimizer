"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlowBackground } from "@/components/shared/GlowBackground";
import { LoadingSteps } from "@/components/shared/LoadingSteps";
import { usePlanStore } from "@/hooks/usePlanStore";

const MAX = 500;
const EXAMPLES = [
  "Tôi muốn nấu bún bò Huế cho 4 người",
  "Phở bò cho 2 người",
  "Cơm gà cho cả nhà",
];

// Home hero — Figma screen 1, now wired to the NER pipeline (A1–A4).
export function SearchHero() {
  const router = useRouter();
  const [text, setText] = useState("");
  const { status, error, run, reset } = usePlanStore();

  const isLoading = status === "extracting" || status === "optimizing";

  // When the plan becomes ready, navigate to results.
  useEffect(() => {
    if (status === "ready") {
      router.push("/results/demo");
    }
  }, [status, router]);

  async function submit(value: string) {
    const q = value.trim();
    if (!q || isLoading) return;
    await run(q);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit(text);
  }

  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6">
      <GlowBackground />
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center text-3xl font-bold sm:text-4xl"
      >
        Bạn cần mua gì hôm nay?
      </motion.h1>

      <div className="w-full max-w-2xl">
        {isLoading ? (
          <div className="py-6">
            <LoadingSteps status={status} />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="home-search" className="sr-only">
              Mô tả món bạn muốn nấu hoặc mua
            </label>
            <div className="relative">
              <input
                id="home-search"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX))}
                maxLength={MAX}
                placeholder="Tôi muốn nấu bún bò Huế cho 4 người…"
                className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 pr-28 text-base shadow-sm outline-none transition-shadow focus:shadow-md"
                aria-describedby="char-count"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
              >
                Tối ưu
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between px-2">
              <span className="text-xs text-[var(--color-text-secondary)]">
                Giá hiển thị mang tính tham khảo.
              </span>
              <span id="char-count" className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                {text.length}/{MAX}
              </span>
            </div>

            {/* example prompts (FR-05) */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setText(ex);
                    void submit(ex);
                  }}
                  className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>
        )}

        {/* error + retry (NFR-08/25) */}
        {status === "error" && (
          <div
            role="alert"
            className="mt-6 flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-surface)] p-4 text-center"
          >
            <p className="text-[var(--color-danger)]">{error}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void submit(text)}
                className="rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-5 py-2 text-sm"
              >
                Nhập lại
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
