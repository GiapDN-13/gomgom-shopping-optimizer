"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { GlowBackground } from "@/components/shared/GlowBackground";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { Select, Segmented } from "@/components/shared/FormControls";
import { usePlanStore } from "@/hooks/usePlanStore";
import type { TransportMode } from "@/lib/shared/types";

const MAX = 500;
const CITIES = ["Đà Nẵng", "Hồ Chí Minh", "Hà Nội"];
const EXAMPLES = ["Lẩu cho 6 người", "Đồ dọn nhà giá rẻ", "Bún xương cho 2 người"];

// "Smart suggestions" that appear as the user types a dish keyword.
const SUGGESTIONS: Array<{ match: RegExp; prompt: string; chips: string[] }> = [
  { match: /mì|mi /i, prompt: "Bạn muốn nấu mì gì?", chips: ["Mì Quảng", "Mì tôm", "Mì xào hải sản", "Mì Ý"] },
  { match: /bún|bun/i, prompt: "Bạn muốn nấu bún gì?", chips: ["Bún bò Huế", "Bún chả", "Bún riêu", "Bún thịt nướng"] },
  { match: /cơm|com /i, prompt: "Bạn muốn nấu cơm gì?", chips: ["Cơm gà", "Cơm tấm", "Cơm chiên", "Cơm rang"] },
  { match: /lẩu|lau/i, prompt: "Lẩu cho mấy người?", chips: ["Lẩu cho 2 người", "Lẩu cho 4 người", "Lẩu cho 6 người"] },
];

const TRANSPORT: Array<{ value: TransportMode; label: string }> = [
  { value: "walking", label: "Đi bộ" },
  { value: "motorbike", label: "Xe máy" },
  { value: "car", label: "Ô tô" },
];

export function SearchHero() {
  const router = useRouter();
  const [text, setText] = useState("");
  const { status, error, run, reset, city, setCity, transport, setTransport } = usePlanStore();

  const isLoading = status === "extracting" || status === "matching" || status === "optimizing";
  const suggestion = SUGGESTIONS.find((s) => s.match.test(text));

  async function submit(value: string) {
    const q = value.trim();
    if (!q || isLoading) return;
    await run(q);
    // Navigate only as a direct result of this submit (not on every "ready" state),
    // so returning Home later doesn't bounce the user back to /parse.
    if (usePlanStore.getState().status === "ready") router.push("/parse");
  }

  return (
    <section className="relative flex min-h-[72vh] flex-col items-center justify-center px-6">
      <GlowBackground />
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 text-center text-3xl font-bold sm:text-4xl"
      >
        Bạn muốn nấu hay mua gì hôm nay?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(text);
          }}
        >
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-lowest)]/70 p-2 shadow-[var(--shadow-soft)] backdrop-blur">
            <label htmlFor="home-search" className="sr-only">
              Mô tả món bạn muốn nấu hoặc mua
            </label>
            <textarea
              id="home-search"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX))}
              rows={2}
              placeholder="Ví dụ: Tôi ở Đà Nẵng, muốn nấu bún bò cho 4 người…"
              className="w-full resize-none rounded-[var(--radius-input)] bg-transparent px-4 py-3 text-base outline-none"
            />
            <div className="flex items-center justify-between px-3 pb-1">
              <span className="text-xs text-[var(--color-on-surface-variant)]">
                Giá hiển thị mang tính tham khảo.
              </span>
              <span
                className={`text-xs tabular-nums ${
                  text.length > 480 ? "text-[var(--color-secondary)]" : "text-[var(--color-on-surface-variant)]"
                }`}
              >
                {text.length}/{MAX}
              </span>
            </div>
          </div>

          {/* smart suggestions */}
          {suggestion && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-3"
            >
              <p className="mb-2 text-sm font-medium">{suggestion.prompt}</p>
              <div className="flex flex-wrap gap-2">
                {suggestion.chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setText(c)}
                    className="rounded-[var(--radius-pill)] bg-[var(--color-primary)]/10 px-3 py-1.5 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* controls: location + transport */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-primary)]" aria-hidden>
                📍
              </span>
              <Select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Thành phố"
                className="h-10 w-auto"
              >
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            <Segmented
              ariaLabel="Phương tiện di chuyển"
              value={transport}
              onChange={setTransport}
              options={TRANSPORT}
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius-input)] bg-[var(--color-primary)] py-3.5 font-semibold text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-container)] disabled:opacity-40"
          >
            ✨ Tối ưu giỏ hàng
          </button>
        </form>

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
              className="rounded-[var(--radius-pill)] border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-4 py-1.5 text-sm text-[var(--color-on-surface-variant)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* error + retry */}
        {status === "error" && (
          <div
            role="alert"
            className="mt-6 flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-error)] bg-[var(--color-surface-lowest)] p-4 text-center"
          >
            <p className="text-[var(--color-error)]">{error}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void submit(text)}
                className="rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-on-primary)]"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-[var(--radius-pill)] border border-[var(--color-outline-variant)] px-5 py-2 text-sm"
              >
                Nhập lại
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {isLoading && <LoadingOverlay status={status} onCancel={reset} />}
    </section>
  );
}
