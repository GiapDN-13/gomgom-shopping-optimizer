"use client";

// Stylized route-map placeholder (no Maps API key yet — Sprint 4 wires OSRM/Google).
// Draws a fake map surface with a route polyline + numbered store pins.

interface MapPanelProps {
  title?: string;
  expanded?: boolean;
  onToggle?: () => void;
}

export function MapPanel({ title = "Lộ trình đề xuất", expanded = false, onToggle }: MapPanelProps) {
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
        style={{
          background:
            "linear-gradient(135deg, #dCeFe4 0%, #eef4f1 40%, #e3eef8 100%)",
        }}
        role="img"
        aria-label="Bản đồ lộ trình mua sắm đề xuất"
      >
        {/* faux roads */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          <g stroke="#cdd9d3" strokeWidth="3" fill="none" opacity="0.7">
            <path d="M0 120 L400 90" />
            <path d="M40 0 L120 400" />
            <path d="M0 280 L400 320" />
            <path d="M260 0 L300 400" />
          </g>
          {/* route polyline */}
          <polyline
            points="80,90 160,180 230,250 300,330"
            fill="none"
            stroke="#1A73E8"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* start pin */}
          <circle cx="80" cy="90" r="9" fill="#fff" stroke="#0F1B16" strokeWidth="4" />
          {/* end pin */}
          <g>
            <circle cx="300" cy="330" r="12" fill="#E5484D" />
            <circle cx="300" cy="330" r="4" fill="#fff" />
          </g>
        </svg>

        {/* travel-time chips */}
        <span className="absolute left-[36%] top-[44%] rounded-md bg-[#1A73E8] px-2 py-0.5 text-xs font-semibold text-white shadow">
          15 min
        </span>
        <span className="absolute left-[64%] top-[70%] rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-primary)] shadow">
          6 min
        </span>
      </div>
    </div>
  );
}
