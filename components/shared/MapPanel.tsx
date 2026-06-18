"use client";

// Stylized route-map placeholder (no Maps API key yet — Sprint 4 wires OSRM/Google).
// Pins are driven by the plan's stores so the map reflects real data.
import { useState } from "react";
import type { PlanStore } from "@/lib/services/buildPlan";

interface MapPanelProps {
  title?: string;
  stores?: PlanStore[];
  expanded?: boolean;
  onToggle?: () => void;
}

// Fixed layout points along a route polyline (start + up to 4 stops).
const ROUTE_POINTS = [
  { x: 80, y: 90 },
  { x: 160, y: 170 },
  { x: 240, y: 240 },
  { x: 300, y: 320 },
  { x: 350, y: 360 },
];

export function MapPanel({ title = "Lộ trình đề xuất", stores = [], expanded = false, onToggle }: MapPanelProps) {
  const [activePin, setActivePin] = useState<number | null>(null);
  // start point + one point per store (capped to the layout points)
  const stopCount = Math.min(stores.length, ROUTE_POINTS.length - 1);
  const linePoints = ROUTE_POINTS.slice(0, stopCount + 1)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex-1 text-center text-lg font-semibold">{title}</h2>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "Thu nhỏ bản đồ" : "Mở rộng bản đồ"}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background)]"
          >
            {expanded ? "↩" : "⤢"}
          </button>
        )}
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-[var(--radius-input)] ${
          expanded ? "aspect-[16/9]" : "aspect-square"
        }`}
        style={{ background: "linear-gradient(135deg, #dcefe4 0%, #eef4f1 40%, #e3eef8 100%)" }}
        role="img"
        aria-label="Bản đồ lộ trình mua sắm đề xuất"
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          <g stroke="#cdd9d3" strokeWidth="3" fill="none" opacity="0.7">
            <path d="M0 120 L400 90" />
            <path d="M40 0 L120 400" />
            <path d="M0 280 L400 320" />
            <path d="M260 0 L300 400" />
          </g>
          {stopCount > 0 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="#1A73E8"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* start pin */}
          <circle cx={ROUTE_POINTS[0].x} cy={ROUTE_POINTS[0].y} r="9" fill="#fff" stroke="#0F1B16" strokeWidth="4" />
          {/* numbered store pins */}
          {stores.slice(0, stopCount).map((store, i) => {
            const p = ROUTE_POINTS[i + 1];
            return (
              <g key={store.code} onClick={() => setActivePin(i)} style={{ cursor: "pointer" }}>
                <circle cx={p.x} cy={p.y} r="13" fill={store.color} />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* clicked pin popup */}
        {activePin !== null && stores[activePin] && (
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-[var(--radius-input)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-md">
            <p className="font-semibold">{activePin + 1}. {stores[activePin].name}</p>
            <p className="text-[var(--color-text-secondary)]">{stores[activePin].address}</p>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-[var(--color-text-secondary)]">
        Bản đồ minh hoạ — lộ trình thực tế sẽ tính ở bước tối ưu (OSRM/Google).
      </p>
    </div>
  );
}
