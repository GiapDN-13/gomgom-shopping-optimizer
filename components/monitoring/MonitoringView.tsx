"use client";

import { useCallback, useEffect, useState } from "react";

// Gomgom Monitoring — dashboard for the disclosed verification-gate architecture.
// Shows honestly, per request: which backend answered (self-trained model vs
// Ckey API fallback), the gate score/verdict/reasons, and real latencies.
// Light Material 3 styling — same design tokens as the rest of the app.
// Charts are hand-drawn SVG/divs — no chart lib.

interface LatencyMs {
  model?: number | null;
  api?: number | null;
}

interface GateCheck {
  name: string;
  status: "pass" | "fail" | "warn" | "skip";
}

interface NerOutput {
  query_type?: string;
  objective_id?: string;
  candidate?: string[];
  excluded?: string[];
}

interface LogEntry {
  ts: number;
  query: string;
  gate_score: number | null;
  verdict: string;
  reasons: string[];
  gate_checks?: GateCheck[];
  source: string;
  latency_ms?: LatencyMs;
  output?: NerOutput | null;
  /** model answer that the gate rejected — present only when Ckey replaced it */
  model_output?: NerOutput | null;
}

// Dev-facing labels + weights for each gate check (mirrors app/gate.py).
const CHECK_LABELS: Record<string, { label: string; kind: "hard" | "soft" }> = {
  schema: { label: "Schema JSON hợp lệ", kind: "hard" },
  labels: { label: "query_type/objective trong tập đóng", kind: "hard" },
  consistency: { label: "Objective ↔ candidate nhất quán", kind: "hard" },
  cooking_sanity: { label: "Câu nấu ăn không trả dụng cụ bếp", kind: "hard" },
  protein_echo: { label: "Protein trong câu có trong nguyên liệu", kind: "hard" },
  echo: { label: "Search: sản phẩm xuất hiện trong query", kind: "hard" },
  thin_list: { label: "Danh sách nguyên liệu đủ dày (>2)", kind: "soft" },
  confidence: { label: "PhoBERT confidence ≥ 0.55", kind: "soft" },
};

const CHECK_ICON: Record<GateCheck["status"], string> = {
  pass: "✓",
  fail: "✗",
  warn: "⚠",
  skip: "—",
};

interface Stats {
  total: number;
  sources: Record<string, number>;
  verdicts: Record<string, number>;
  avg_gate_score: number | null;
  avg_latency_ms: { model: number | null; api: number | null };
  hourly: Array<{ hour: string; pass: number; fail: number; model: number; api: number }>;
  points: Array<{
    score: number | null;
    verdict: string;
    source: string;
    model_ms?: number | null;
    api_ms?: number | null;
  }>;
}

interface Health {
  status: string;
  backend: string;
  gate_enabled: boolean;
  ckey_configured: boolean;
  ckey_model: string | null;
}

interface Payload {
  stats: Stats;
  recent: LogEntry[];
  health: Health | null;
}

const REFRESH_MS = 10_000;
const COLOR_MODEL = "#006a42"; // primary green — self-trained model
const COLOR_API = "#ff7a1b"; // secondary orange — external API fallback
const COLOR_FAIL = "#ba1a1a"; // M3 error

export function MonitoringView() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/monitoring", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) {
        setError(typeof body?.error === "string" ? body.error : "Lỗi tải dữ liệu monitoring.");
        setData(null);
      } else {
        setData(body as Payload);
        setError(null);
      }
    } catch {
      setError("Không thể kết nối máy chủ.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so no setState runs synchronously inside the effect body.
    const first = setTimeout(load, 0);
    const t = setInterval(load, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  const stats = data?.stats;
  const modelCount = sumSources(stats?.sources, false);
  const apiCount = sumSources(stats?.sources, true);
  const total = stats?.total ?? 0;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Monitoring</h1>
          <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
            Model tự train được ưu tiên — API chỉ thay khi gate đánh giá sai rõ ràng.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
          {data?.health && (
            <span className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-lowest)] px-3 py-1.5">
              <Dot ok={data.health.status === "ok"} />
              backend <b className="text-[var(--color-on-surface)]">{data.health.backend}</b>
              · gate <b className="text-[var(--color-on-surface)]">{data.health.gate_enabled ? "bật" : "tắt"}</b>
              · API{" "}
              <b className="text-[var(--color-on-surface)]">
                {data.health.ckey_configured ? (data.health.ckey_model ?? "sẵn sàng") : "chưa cấu hình"}
              </b>
            </span>
          )}
          <button
            onClick={load}
            className="rounded-[var(--radius-input)] border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-1.5 font-medium transition-colors hover:bg-[var(--color-surface-high)]"
          >
            ⟳ Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-10 text-center text-sm text-[var(--color-on-surface-variant)]">Đang tải…</p>
      ) : error ? (
        <EmptyCard emoji="📡" text={error} sub="Khởi động NER service (uvicorn app.main:app --port 8000) rồi bấm Làm mới." />
      ) : !stats || total === 0 ? (
        <EmptyCard
          emoji="🗒️"
          text="Chưa có request nào được ghi log."
          sub="Chạy vài câu ở trang chủ hoặc Inspector, log sẽ xuất hiện ở đây."
        />
      ) : (
        <>
          {/* stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Tổng request" value={String(total)} />
            <Card
              label="Nguồn trả lời"
              value={`${pct(modelCount, total)}% model`}
              sub={`${modelCount} model · ${apiCount} API`}
            />
            <Card
              label="Gate score trung bình"
              value={stats.avg_gate_score != null ? stats.avg_gate_score.toFixed(2) : "—"}
              sub={`${stats.verdicts["pass"] ?? 0} pass · ${stats.verdicts["fail"] ?? 0} fail`}
            />
            <Card
              label="Latency trung bình"
              value={fmtMs(stats.avg_latency_ms.model)}
              sub={`model · API: ${fmtMs(stats.avg_latency_ms.api)}`}
            />
          </div>

          {/* scoring methodology — devs should not have to trust a bare number */}
          <details className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-4 shadow-[var(--shadow-soft)]">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--color-primary)]">
              📐 Cách tính gate score &amp; khi nào Ckey API trả thay
            </summary>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-mono text-xs">
                score = 1 − 0.40 × (số hard check vi phạm) − 0.15 × (số soft signal) · verdict = fail nếu ≥1 hard
              </p>
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {Object.entries(CHECK_LABELS).map(([k, v]) => (
                  <p key={k} className="text-xs">
                    <span
                      className={`mr-1 rounded-[var(--radius-pill)] px-1.5 py-0.5 font-semibold ${
                        v.kind === "hard"
                          ? "bg-[var(--color-error-container)]/40 text-[var(--color-error)]"
                          : "bg-[#ff7a1b]/15 text-[#9c4500]"
                      }`}
                    >
                      {v.kind === "hard" ? "hard −0.40" : "soft −0.15"}
                    </span>
                    {v.label}
                  </p>
                ))}
              </div>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                Luồng: model trả lời → gate chấm. <b>pass</b> → dùng model (nguồn &quot;Model&quot;).{" "}
                <b>fail</b> + có CKEY_API_KEY → gọi Ckey, parse hợp lệ thì dùng và ghi nguồn{" "}
                <b>&quot;API&quot;</b> (kèm output model bị loại để so sánh); Ckey lỗi/thiếu key →
                vẫn dùng model, lý do ghi trong log. Check &quot;—&quot; = không áp dụng cho loại câu đó.
              </p>
            </div>
          </details>

          {/* charts */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel title="Nguồn trả lời (Model vs API)">
              <Donut model={modelCount} api={apiCount} />
              {apiCount === 0 && (
                <p className="mt-2 text-xs text-[var(--color-on-surface-variant)]">
                  Ckey API = 0 vì chưa có request nào bị gate đánh fail — model tự trả 100%.
                  (Số này là thật, không phải lỗi hiển thị.)
                </p>
              )}
            </Panel>
            <Panel title="Gate score theo request (50 gần nhất)">
              <Sparkline points={stats.points} />
            </Panel>
            <Panel title="Pass / Fail theo giờ">
              <HourlyBars hourly={stats.hourly} />
            </Panel>
          </div>

          {/* log table */}
          <Panel title="Log gần nhất (mới → cũ)" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="text-[var(--color-on-surface-variant)]">
                  <tr className="border-b border-[var(--color-outline-variant)]/50">
                    <th className="py-2 pr-3 font-medium">Thời gian</th>
                    <th className="py-2 pr-3 font-medium">Query</th>
                    <th className="py-2 pr-3 font-medium">Gate</th>
                    <th className="py-2 pr-3 font-medium">Nguồn</th>
                    <th className="py-2 pr-3 font-medium">Latency</th>
                    <th className="py-2 font-medium">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent ?? []).map((e, i) => (
                    <Row
                      key={`${e.ts}-${i}`}
                      entry={e}
                      expanded={expanded === i}
                      onToggle={() => setExpanded(expanded === i ? null : i)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

/* ---------- table ---------- */

function Row({
  entry,
  expanded,
  onToggle,
}: {
  entry: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isApi = entry.source === "ckey-api";
  const verdictClass =
    entry.verdict === "pass"
      ? "bg-[var(--color-primary-container)]/25 text-[var(--color-primary)]"
      : entry.verdict === "fail"
        ? "bg-[var(--color-error-container)]/50 text-[var(--color-error)]"
        : "bg-[var(--color-surface-variant)]/60 text-[var(--color-on-surface-variant)]";
  return (
    <>
      <tr className="border-b border-[var(--color-outline-variant)]/30 align-top hover:bg-[var(--color-surface-low)]">
        <td className="whitespace-nowrap py-2 pr-3 font-mono text-[var(--color-on-surface-variant)]">
          {new Date(entry.ts * 1000).toLocaleTimeString("vi-VN")}
        </td>
        <td className="max-w-[280px] py-2 pr-3">
          <span className="line-clamp-2">{entry.query}</span>
        </td>
        <td className="whitespace-nowrap py-2 pr-3">
          <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 font-semibold ${verdictClass}`}>
            {entry.verdict}
            {entry.gate_score != null ? ` · ${entry.gate_score.toFixed(2)}` : ""}
          </span>
        </td>
        <td className="whitespace-nowrap py-2 pr-3">
          <span
            className="rounded-[var(--radius-pill)] px-2 py-0.5 font-semibold"
            style={{
              backgroundColor: isApi ? "rgba(255,122,27,0.14)" : "rgba(0,106,66,0.10)",
              color: isApi ? "#9c4500" : COLOR_MODEL,
            }}
          >
            {isApi ? "API" : "Model"}
          </span>
        </td>
        <td className="whitespace-nowrap py-2 pr-3 font-mono text-[var(--color-on-surface-variant)]">
          {fmtMs(entry.latency_ms?.model)}
          {entry.latency_ms?.api != null && (
            <span style={{ color: "#9c4500" }}> +{fmtMs(entry.latency_ms.api)}</span>
          )}
        </td>
        <td className="py-2">
          <button
            onClick={onToggle}
            className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            {expanded ? "Thu gọn ▲" : "Xem ▼"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[var(--color-outline-variant)]/30">
          <td colSpan={6} className="py-2">
            {/* per-check breakdown so devs can verify the score, not trust it */}
            {entry.gate_checks && entry.gate_checks.length > 0 && (
              <div className="mb-2 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                {entry.gate_checks.map((c) => (
                  <p key={c.name} className="text-xs">
                    <span
                      className={`mr-1.5 inline-block w-4 text-center font-bold ${
                        c.status === "pass"
                          ? "text-[var(--color-primary)]"
                          : c.status === "fail"
                            ? "text-[var(--color-error)]"
                            : c.status === "warn"
                              ? "text-[#9c4500]"
                              : "text-[var(--color-on-surface-variant)]"
                      }`}
                    >
                      {CHECK_ICON[c.status] ?? "?"}
                    </span>
                    {CHECK_LABELS[c.name]?.label ?? c.name}
                  </p>
                ))}
              </div>
            )}
            {entry.reasons.length > 0 && (
              <ul className="mb-2 list-inside list-disc text-[var(--color-on-surface-variant)]">
                {entry.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <p className="mb-1 text-xs font-semibold text-[var(--color-on-surface-variant)]">
              {isApi ? "Kết quả CUỐI (Ckey API trả):" : "Kết quả (model tự train):"}
            </p>
            <pre className="overflow-x-auto rounded-[var(--radius-input)] bg-[var(--color-surface-high)] p-2 font-mono text-[11px] text-[var(--color-on-surface)]">
              {JSON.stringify(entry.output ?? {}, null, 2)}
            </pre>
            {entry.model_output && (
              <>
                <p className="mb-1 mt-2 text-xs font-semibold text-[#9c4500]">
                  Output model bị gate loại (để so sánh):
                </p>
                <pre className="overflow-x-auto rounded-[var(--radius-input)] border border-[#ff7a1b]/30 bg-[#ff7a1b]/5 p-2 font-mono text-[11px] text-[var(--color-on-surface)]">
                  {JSON.stringify(entry.model_output, null, 2)}
                </pre>
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ---------- charts (hand-drawn, no deps) ---------- */

function Donut({ model, api }: { model: number; api: number }) {
  const total = model + api;
  if (total === 0)
    return <p className="text-sm text-[var(--color-on-surface-variant)]">Chưa có dữ liệu.</p>;
  const r = 40;
  const c = 2 * Math.PI * r;
  const modelFrac = model / total;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90" role="img"
        aria-label={`Model ${model}, API ${api}`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={COLOR_API} strokeWidth="14" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={COLOR_MODEL} strokeWidth="14"
          strokeDasharray={`${c * modelFrac} ${c}`}
        />
      </svg>
      <div className="flex flex-col gap-1 text-xs">
        <Legend color={COLOR_MODEL} label={`Model tự train: ${model} (${pct(model, total)}%)`} />
        <Legend color={COLOR_API} label={`Ckey API: ${api} (${pct(api, total)}%)`} />
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: Stats["points"] }) {
  const vals = points.map((p) => (typeof p.score === "number" ? p.score : null));
  if (vals.length === 0)
    return <p className="text-sm text-[var(--color-on-surface-variant)]">Chưa có dữ liệu.</p>;
  const W = 260;
  const H = 80;
  const step = vals.length > 1 ? W / (vals.length - 1) : 0;
  const y = (v: number) => H - 6 - v * (H - 12);
  const path = vals
    .map((v, i) => (v == null ? null : `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" role="img" aria-label="Gate score">
      {/* threshold guide at score=0.6 (a hard-check violation drops below this) */}
      <line x1="0" x2={W} y1={y(0.6)} y2={y(0.6)} stroke="rgba(0,0,0,0.12)" strokeDasharray="4 4" />
      <path d={path} fill="none" stroke={COLOR_MODEL} strokeWidth="2" />
      {vals.map((v, i) =>
        v == null ? null : (
          <circle
            key={i}
            cx={i * step}
            cy={y(v)}
            r="2.5"
            fill={points[i].verdict === "fail" ? COLOR_FAIL : COLOR_MODEL}
          />
        ),
      )}
    </svg>
  );
}

function HourlyBars({ hourly }: { hourly: Stats["hourly"] }) {
  if (hourly.length === 0)
    return <p className="text-sm text-[var(--color-on-surface-variant)]">Chưa có dữ liệu.</p>;
  const max = Math.max(...hourly.map((h) => h.pass + h.fail), 1);
  return (
    <div className="flex h-24 items-end gap-1" role="img" aria-label="Pass/fail theo giờ">
      {hourly.map((h) => {
        const total = h.pass + h.fail;
        return (
          <div key={h.hour} className="group relative flex-1" title={`${h.hour}: ${h.pass} pass, ${h.fail} fail`}>
            <div
              className="flex w-full flex-col justify-end overflow-hidden rounded-sm"
              style={{ height: `${(total / max) * 100}%`, minHeight: 4 }}
            >
              {h.fail > 0 && (
                <div style={{ height: `${(h.fail / total) * 100}%`, backgroundColor: COLOR_FAIL }} />
              )}
              <div className="flex-1" style={{ backgroundColor: "rgba(0,106,66,0.55)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- small pieces ---------- */

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-4 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-primary)]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-on-surface-variant)]">{sub}</p>}
    </section>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-4 shadow-[var(--shadow-soft)] ${className}`}
    >
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyCard({ emoji, text, sub }: { emoji: string; text: string; sub: string }) {
  return (
    <div className="mx-auto mt-12 max-w-md rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-6 text-center shadow-[var(--shadow-soft)]">
      <p className="text-2xl" aria-hidden>
        {emoji}
      </p>
      <p className="mt-2 text-sm">{text}</p>
      <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{sub}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: ok ? "#006a42" : "#ba1a1a" }}
    />
  );
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function fmtMs(ms?: number | null): string {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

function sumSources(sources: Record<string, number> | undefined, api: boolean): number {
  if (!sources) return 0;
  return Object.entries(sources)
    .filter(([k]) => (k === "ckey-api") === api)
    .reduce((acc, [, v]) => acc + v, 0);
}
