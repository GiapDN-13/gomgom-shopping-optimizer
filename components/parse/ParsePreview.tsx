"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { usePlanStore } from "@/hooks/usePlanStore";
import type { NerResult } from "@/lib/services/ner";

interface Row {
  id: number;
  name: string;
  qty: string;
  unit: string;
  category: string;
  included: boolean;
}

const CATEGORY_DOT: Record<string, string> = {
  thịt: "#E57373",
  "tinh bột": "#FFF176",
  rau: "#81C784",
  "gia vị": "#FFB74D",
  khác: "#BCAAA4",
};

function seedRows(ner: NerResult | null): Row[] {
  if (!ner) return [];
  return ner.ingredients.map((ing, i) => ({
    id: i,
    name: ing.name,
    qty: ing.quantity ? String(ing.quantity) : "1",
    unit: ing.unit ?? "phần",
    category: ing.category ?? "khác",
    included: true,
  }));
}

// Parse Preview — editable structured list shown after NER, before optimization
// (Stitch "parse_preview"; FR-04, FR-06, FR-08).
export function ParsePreview() {
  const router = useRouter();
  const { ner, query, servings, setServings } = usePlanStore();

  // Seed once from the NER result captured by the store (lazy initializers — no effect).
  const [rows, setRows] = useState<Row[]>(() => seedRows(ner));
  const [exclusions, setExclusions] = useState<string[]>(() => ner?.exclusions ?? []);

  const dishTitle = query || "Danh sách mua";
  const pantry = ["Muối", "Nước mắm"];

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRow(id: number) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }
  function addRow() {
    setRows((rs) => [
      ...rs,
      { id: Date.now(), name: "", qty: "1", unit: "phần", category: "khác", included: true },
    ]);
  }

  function confirm() {
    // The plan is already computed in the store; go straight to results.
    router.push("/results/demo");
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 py-8">
      <button
        onClick={() => router.push("/")}
        className="mb-4 flex items-center gap-1 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
      >
        ← Quay lại
      </button>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-lowest)] shadow-[var(--shadow-soft)]">
        {/* header */}
        <div className="border-b border-[var(--color-outline-variant)]/40 p-5">
          <h2 className="text-xl font-semibold">Kiểm tra danh sách</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{dishTitle}</Badge>
            <div className="flex items-center gap-2 rounded-[var(--radius-input)] bg-[var(--color-surface-high)] p-1">
              <button
                onClick={() => setServings(servings - 1)}
                aria-label="Giảm khẩu phần"
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--color-surface-lowest)]"
              >
                −
              </button>
              <span className="min-w-16 text-center text-sm font-semibold tabular-nums">
                {servings} người
              </span>
              <button
                onClick={() => setServings(servings + 1)}
                aria-label="Tăng khẩu phần"
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--color-surface-lowest)]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ingredient list */}
        <ul className="divide-y divide-[var(--color-outline-variant)]/30">
          {rows.map((row) => (
            <li key={row.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-surface-low)]">
              <input
                type="checkbox"
                checked={row.included}
                onChange={(e) => updateRow(row.id, { included: e.target.checked })}
                aria-label={`Bao gồm ${row.name}`}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_DOT[row.category] ?? CATEGORY_DOT.khác }}
                title={row.category}
              />
              <input
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
                placeholder="Tên nguyên liệu"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <input
                value={row.qty}
                onChange={(e) => updateRow(row.id, { qty: e.target.value })}
                className="w-14 rounded-md border border-[var(--color-outline-variant)] bg-transparent px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-[var(--color-primary)]"
              />
              <input
                value={row.unit}
                onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                className="w-16 rounded-md border border-[var(--color-outline-variant)] bg-transparent px-2 py-1 text-sm outline-none focus:border-[var(--color-primary)]"
              />
              <button
                onClick={() => removeRow(row.id)}
                aria-label={`Xóa ${row.name}`}
                className="text-[var(--color-on-surface-variant)] opacity-0 transition-opacity hover:text-[var(--color-error)] group-hover:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="px-5 py-3">
          <button
            onClick={addRow}
            className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            + Thêm nguyên liệu
          </button>
        </div>

        {/* exclusions + pantry */}
        <div className="space-y-3 border-t border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-bright)] p-5">
          {exclusions.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                Loại trừ (Không mua)
              </p>
              <div className="flex flex-wrap gap-2">
                {exclusions.map((ex) => (
                  <span
                    key={ex}
                    className="flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-error-container)]/40 px-3 py-1 text-sm text-[var(--color-on-error-container)]"
                  >
                    {ex}
                    <button
                      onClick={() => setExclusions((xs) => xs.filter((x) => x !== ex))}
                      aria-label={`Bỏ loại trừ ${ex}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
              Đã có sẵn tại nhà
            </p>
            <div className="flex flex-wrap gap-2">
              {pantry.map((p) => (
                <span
                  key={p}
                  className="rounded-[var(--radius-pill)] bg-[var(--color-surface-variant)]/60 px-3 py-1 text-sm text-[var(--color-on-surface-variant)]"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* sticky footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-outline-variant)]/40 p-4">
          <Button variant="secondary" onClick={() => router.push("/")}>
            Sửa lại
          </Button>
          <Button variant="primary" onClick={confirm}>
            Xác nhận &amp; Tối ưu
          </Button>
        </div>
      </div>
    </div>
  );
}
