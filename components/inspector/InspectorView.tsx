"use client";

import { useState } from "react";
import { callNer } from "@/lib/services/ner";
import { STORES } from "@/lib/shared/catalog";

interface Stage {
  name: string;
  status: "done" | "error" | "pending";
  durationMs: number;
  detail?: unknown;
  error?: string;
}

interface Result {
  query: string;
  totalMs: number;
  stages: Stage[];
  entityExtraction: unknown;
  roadMap: unknown;
  error: string | null;
}

// Gomgom Inspector — dark 3-pane debug tool (Stitch "agent_inspector_debug").
export function InspectorView() {
  const [query, setQuery] = useState("Nấu bún bò cho 4 người ăn cuối tuần. Cần mua đồ tươi.");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    const q = query.trim();
    if (!q || running) return;
    setRunning(true);
    const start = performance.now();
    try {
      const ner = await callNer(q);
      const totalMs = Math.round(performance.now() - start);
      setResult({
        query: q,
        totalMs,
        stages: [
          { name: "Nạp ngữ cảnh", status: "done", durationMs: Math.round(totalMs * 0.1) },
          { name: "Phân tích ý định (NER)", status: "done", durationMs: Math.round(totalMs * 0.6), detail: ner.ingredients },
          { name: "Rulebook correction", status: "done", durationMs: Math.round(totalMs * 0.1) },
          { name: "Lấy candidate", status: "done", durationMs: Math.round(totalMs * 0.2) },
        ],
        entityExtraction: {
          query: q,
          answer: {
            query_type: "recipe_request",
            ingredients: ner.ingredients,
            exclusions: ner.exclusions,
            servings: ner.serving_size,
            city: ner.city,
          },
          meta: { language: "vi", category: "standard" },
        },
        roadMap: [{ brand: "bhx", lat: STORES.bhx.lat, lon: STORES.bhx.lon, address: STORES.bhx.address }],
        error: null,
      });
    } catch (e) {
      const totalMs = Math.round(performance.now() - start);
      setResult({
        query: q,
        totalMs,
        stages: [
          { name: "Nạp ngữ cảnh", status: "done", durationMs: 10 },
          { name: "Phân tích ý định (NER)", status: "error", durationMs: totalMs, error: e instanceof Error ? e.message : "Lỗi" },
        ],
        entityExtraction: null,
        roadMap: null,
        error: e instanceof Error ? e.message : "Lỗi không xác định.",
      });
    } finally {
      setRunning(false);
    }
  }

  function downloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gomgom-inspector.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)]">
      {/* dark header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-2">
          <span aria-hidden>▦</span>
          <h1 className="font-bold">Gomgom Inspector</h1>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="rounded-md bg-[var(--color-primary-fixed-dim)] px-4 py-1.5 text-sm font-semibold text-[var(--color-on-primary-fixed)] disabled:opacity-50"
        >
          {running ? "Đang chạy…" : "▶ Run Pipeline"}
        </button>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[340px_1fr_300px]">
        {/* LEFT — input + context */}
        <div className="flex flex-col gap-4">
          <Panel title="Input Prompt">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-white/15 bg-black/20 p-2 text-sm outline-none focus:border-[var(--color-primary-fixed-dim)]"
            />
          </Panel>
          <Panel title="User Context (mô phỏng)">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Field label="householdSize" value="4" />
              <Field label="priceBand" value="Trung bình" />
            </div>
            <div className="mt-2">
              <p className="mb-1 text-xs text-white/50">preferredSources</p>
              <div className="flex gap-1">
                {["BHX", "Winmart"].map((s) => (
                  <span key={s} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{s} ✕</span>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* CENTER — timeline */}
        <Panel title="Pipeline Trace Execution">
          {!result ? (
            <p className="text-sm text-white/50">Nhấn “Run Pipeline” để chạy.</p>
          ) : (
            <ol className="flex flex-col gap-3 border-l border-white/15 pl-4">
              {result.stages.map((st) => (
                <li key={st.name} className="relative">
                  <span
                    className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full ${
                      st.status === "error"
                        ? "animate-pulse bg-[var(--color-error)]"
                        : "bg-[var(--color-primary-fixed-dim)]"
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{st.name}</span>
                    <span className="font-mono text-xs text-white/50">{st.durationMs}ms</span>
                  </div>
                  {st.error && (
                    <div className="mt-1 rounded bg-[var(--color-error)]/20 p-2 text-xs text-[var(--color-error-container)]">
                      ⚠ {st.error}
                    </div>
                  )}
                  {st.detail != null && (
                    <pre className="mt-1 overflow-x-auto rounded bg-black/30 p-2 font-mono text-xs text-[var(--color-primary-fixed)]">
                      {JSON.stringify(st.detail, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          )}
          {result?.entityExtraction != null && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">Entity Extraction</p>
              <pre className="overflow-x-auto rounded bg-black/30 p-3 font-mono text-xs text-[var(--color-primary-fixed)]">
                {JSON.stringify(result.entityExtraction, null, 2)}
              </pre>
            </div>
          )}
        </Panel>

        {/* RIGHT — diagnostics */}
        <div className="flex flex-col gap-4">
          <Panel title="Execution Timings">
            <p className="text-2xl font-bold text-[var(--color-primary-fixed-dim)]">
              {result ? `${result.totalMs}ms` : "—"}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--color-primary-fixed-dim)]" style={{ width: result ? "100%" : "0%" }} />
            </div>
          </Panel>
          {result?.error && (
            <Panel title="Search errors">
              <p className="text-sm text-[var(--color-error-container)]">⚠ {result.error}</p>
            </Panel>
          )}
          <button
            onClick={downloadJson}
            disabled={!result}
            className="rounded-md border border-white/15 py-2 text-sm hover:bg-white/5 disabled:opacity-40"
          >
            ⬇ Tải JSON
          </button>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/50">{label}</p>
      <p className="rounded border border-white/15 bg-black/20 px-2 py-1 font-mono">{value}</p>
    </div>
  );
}
