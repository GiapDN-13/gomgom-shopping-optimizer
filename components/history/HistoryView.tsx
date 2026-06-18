"use client";

import { useState } from "react";
import Link from "next/link";
import { TextInput, Select } from "@/components/shared/FormControls";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/shared/Badge";
import { formatVnd } from "@/lib/shared/catalog";
import { usePlanStore } from "@/hooks/usePlanStore";

export function HistoryView() {
  const saved = usePlanStore((s) => s.saved);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");

  const filtered = saved.filter(
    (p) =>
      (city === "all" || p.city === city) &&
      p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Kế hoạch đã lưu</h1>
        <p className="text-[var(--color-on-surface-variant)]">
          Xem lại và chạy lại các kế hoạch mua sắm tối ưu của bạn.
        </p>
      </div>

      {saved.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="min-w-56 flex-1">
            <TextInput
              placeholder="🔍 Tìm kiếm kế hoạch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={city} onChange={(e) => setCity(e.target.value)} className="w-auto">
            <option value="all">Tất cả thành phố</option>
            <option>Đà Nẵng</option>
            <option>Hồ Chí Minh</option>
            <option>Hà Nội</option>
          </Select>
          <Select className="w-auto" defaultValue="new">
            <option value="new">Mới nhất</option>
            <option value="old">Cũ nhất</option>
          </Select>
        </div>
      )}

      {saved.length === 0 ? (
        <EmptyState
          title="Chưa có kế hoạch nào được lưu"
          description="Bạn chưa lưu bất kỳ danh sách mua sắm tối ưu nào. Tạo kế hoạch đầu tiên để bắt đầu tiết kiệm."
          ctaLabel="Tạo kế hoạch đầu tiên"
          ctaHref="/"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="hover-lift overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] shadow-[var(--shadow-soft)]"
            >
              <div
                className="flex h-28 items-end p-3"
                style={{ background: "linear-gradient(135deg,#dcefe4,#e3eef8)" }}
              >
                <Badge tone="neutral">📍 {p.city}</Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)]">{p.createdAt}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-on-surface-variant)]">
                  <span>🧺 {p.plan.stores.reduce((n, s) => n + s.items.length, 0)} món</span>
                  <span>🏪 {p.plan.storeCount} cửa hàng</span>
                </div>
                <p className="mt-2 text-lg font-bold tabular-nums text-[var(--color-primary)]">
                  {formatVnd(p.plan.finalTotal)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/history/${p.id}`}
                    className="flex-1 rounded-[var(--radius-input)] border border-[var(--color-outline-variant)] py-2 text-center text-sm hover:border-[var(--color-primary)]"
                  >
                    Xem
                  </Link>
                  <Link
                    href={`/results/${p.id}`}
                    className="flex-1 rounded-[var(--radius-input)] bg-[var(--color-primary)] py-2 text-center text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-container)]"
                  >
                    ↻ Chạy lại
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
