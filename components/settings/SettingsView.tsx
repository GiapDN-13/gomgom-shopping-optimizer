"use client";

import { useState } from "react";
import { Select, Segmented, ToggleSwitch } from "@/components/shared/FormControls";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { usePlanStore } from "@/hooks/usePlanStore";
import type { TransportMode } from "@/lib/shared/types";

const SECTIONS = [
  { id: "account", label: "Tài khoản" },
  { id: "prefs", label: "Tùy chọn" },
  { id: "advanced", label: "Nâng cao" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const TRANSPORT: Array<{ value: TransportMode; label: string }> = [
  { value: "walking", label: "Đi bộ" },
  { value: "motorbike", label: "Xe máy" },
  { value: "car", label: "Ô tô" },
];

export function SettingsView() {
  const [section, setSection] = useState<SectionId>("account");
  const { city, setCity, transport, setTransport, saved } = usePlanStore();
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [weight, setWeight] = useState(30);
  const [dark, setDark] = useState(false);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Cài đặt</h1>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`rounded-[var(--radius-input)] px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                section === s.id
                  ? "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-high)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* content */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-lowest)] p-6 shadow-[var(--shadow-soft)]">
          {section === "account" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--color-primary)]/10 text-2xl">
                  🧑
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Nguyễn Văn A</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">nguyen.van.a@gmail.com</p>
                  <div className="mt-1">
                    <Badge tone="freshness">🔖 {saved.length} kế hoạch đã lưu</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost">Đăng xuất</Button>
                <Button variant="danger">Xóa tài khoản</Button>
              </div>
            </div>
          )}

          {section === "prefs" && (
            <div className="flex flex-col gap-6">
              <Row label="Thành phố mặc định" hint="Tự điền vào ô vị trí ở trang chủ.">
                <Select value={city} onChange={(e) => setCity(e.target.value)} className="w-48">
                  <option>Đà Nẵng</option>
                  <option>Hồ Chí Minh</option>
                  <option>Hà Nội</option>
                </Select>
              </Row>
              <Row label="Phương tiện mặc định" hint="Áp dụng cho mỗi kế hoạch mới.">
                <Segmented ariaLabel="Phương tiện" value={transport} onChange={setTransport} options={TRANSPORT} />
              </Row>
              <Row label="Ngôn ngữ">
                <Segmented
                  ariaLabel="Ngôn ngữ"
                  value={lang}
                  onChange={setLang}
                  options={[
                    { value: "vi", label: "Tiếng Việt" },
                    { value: "en", label: "English" },
                  ]}
                />
              </Row>
            </div>
          )}

          {section === "advanced" && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm font-medium">Ưu tiên: Giá rẻ ↔ Ít di chuyển</p>
                <p className="mb-2 text-xs text-[var(--color-on-surface-variant)]">
                  Điều chỉnh trọng số giữa tiết kiệm tiền và công đi lại.
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                  aria-label="Trọng số giá rẻ và di chuyển"
                />
                <p className="mt-2 rounded-[var(--radius-input)] bg-[var(--color-surface-low)] p-2 text-xs">
                  💡 {weight < 50 ? "Đang ưu tiên tiết kiệm tiền hơn công đi lại." : "Đang ưu tiên ít di chuyển hơn giá rẻ."}
                </p>
              </div>
              <Row label="Chế độ tối" hint="Giao diện nền tối, dịu mắt.">
                <ToggleSwitch checked={dark} onChange={setDark} label="Chế độ tối" />
              </Row>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-outline-variant)]/30 pb-4 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-[var(--color-on-surface-variant)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
