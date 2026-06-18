"use client";

import { useState } from "react";
import { callNer } from "@/lib/services/ner";
import { STORES } from "@/lib/shared/catalog";

interface InspectorResult {
  userQuery: string;
  executionTimeMs: number;
  entityExtraction: unknown;
  roadMap: unknown;
  error: string | null;
}

export function InspectorView() {
  const [query, setQuery] = useState("Tôi muốn nấu bún bò Huế cho 1 người ở nhà");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<InspectorResult | null>(null);

  async function run() {
    const q = query.trim();
    if (!q || running) return;
    setRunning(true);
    const startedAt = performance.now();
    try {
      const ner = await callNer(q);
      const elapsed = Math.round(performance.now() - startedAt);
      setResult({
        userQuery: q,
        executionTimeMs: elapsed,
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
        // Road map remains mock until the Sprint 4 optimizer exists — surfaced honestly.
        roadMap: [
          { brand: "bhx", lat: STORES.bhx.lat, lon: STORES.bhx.lon, address: STORES.bhx.address },
        ],
        error: null,
      });
    } catch (e) {
      const elapsed = Math.round(performance.now() - startedAt);
      setResult({
        userQuery: q,
        executionTimeMs: elapsed,
        entityExtraction: null,
        roadMap: null,
        error: e instanceof Error ? e.message : "Lỗi không xác định.",
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      {/* query runner */}
      <div className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Nhập query để chạy pipeline…"
          className="flex-1 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 outline-none focus:shadow-md"
          aria-label="Query để kiểm tra"
        />
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-[var(--radius-input)] bg-[var(--color-primary)] px-6 py-2 font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
        >
          {running ? "Đang chạy…" : "Chạy / Run"}
        </button>
      </div>

      {result && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Panel title="1. User Query">
              <p className="font-medium">{result.userQuery}</p>
            </Panel>

            <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-sm">
              <span className="font-semibold">Execution Time</span>
              <span className="font-bold tabular-nums">{result.executionTimeMs} ms</span>
            </div>

            {/* loud error surface — never silently "no results" */}
            {result.error && (
              <div role="alert" className="rounded-[var(--radius-card)] border-2 border-[var(--color-danger)] bg-[var(--color-danger)]/10 p-4">
                <p className="font-semibold text-[var(--color-danger)]">Search error</p>
                <p className="text-sm text-[var(--color-danger)]">{result.error}</p>
              </div>
            )}

            <Panel title="3. Road map">
              <JsonBlock data={result.roadMap} />
            </Panel>
          </div>

          <div className="flex flex-col gap-6">
            <Panel title="2. Entity Extraction">
              <JsonBlock data={result.entityExtraction} />
            </Panel>
            {result.entityExtraction != null && (
              <button
                type="button"
                onClick={() => downloadJson(result)}
                className="self-start rounded-[var(--radius-input)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-background)]"
              >
                Tải JSON
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function downloadJson(result: InspectorResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gomgom-inspector.json";
  a.click();
  URL.revokeObjectURL(url);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-h-[460px] overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-[var(--color-text-primary)]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
