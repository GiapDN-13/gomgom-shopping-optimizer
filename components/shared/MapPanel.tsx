"use client";

// Real route map: Leaflet + OSM tiles, road route + turn-by-turn via OSRM.
// Keeps the original prop contract, so ResultsView is unchanged.
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { PlanStore } from "@/lib/services/buildPlan";
import {
  fetchRoute,
  fmtDuration,
  fmtKm,
  haversineM,
  orderByNearest,
  type LatLon,
  type RouteResult,
} from "@/lib/services/route";
import type { Branch } from "@/app/api/v1/branches/route";
import { usePlanStore } from "@/hooks/usePlanStore";
import { useRouteSummary } from "@/hooks/useRouteSummary";

// Leaflet touches `window` — must be loaded client-side only.
const RouteMap = dynamic(() => import("@/components/shared/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-[var(--color-surface-high)] text-sm text-[var(--color-text-secondary)]">
      Đang tải bản đồ…
    </div>
  ),
});

interface MapPanelProps {
  title?: string;
  stores?: PlanStore[];
  expanded?: boolean;
  onToggle?: () => void;
}

// Default origin: Da Nang city centre (until the user shares their location).
const DEFAULT_ORIGIN: LatLon = { lat: 16.0544, lon: 108.2022 };

const TRANSPORT_ICON: Record<string, string> = {
  walking: "🚶",
  motorbike: "🛵",
  car: "🚗",
};

export function MapPanel({ title = "Lộ trình đề xuất", stores = [], expanded = false, onToggle }: MapPanelProps) {
  const transport = usePlanStore((s) => s.transport);
  const storeLocation = usePlanStore((s) => s.location);
  const setLocation = usePlanStore((s) => s.setLocation);
  const reoptimize = usePlanStore((s) => s.reoptimize);
  const setSummary = useRouteSummary((s) => s.setSummary);
  // Origin: shared store location (drives distance-aware optimization) or default.
  const origin = storeLocation ?? DEFAULT_ORIGIN;
  const [originLabel, setOriginLabel] = useState("Điểm xuất phát (trung tâm Đà Nẵng)");
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [openLeg, setOpenLeg] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Real branch locations from OSM — so each chain routes to the branch
  // NEAREST the user, not one hardcoded coordinate. Loaded once.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/v1/branches", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (!ctrl.signal.aborted && Array.isArray(d?.branches)) setBranches(d.branches);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Swap each plan store to its nearest same-chain branch (fallback: static coords).
  const effective = useMemo(() => {
    return stores.map((s) => {
      const candidates = branches.filter((b) => b.code === s.code);
      if (candidates.length === 0) return s;
      const nearest = candidates.reduce((a, b) =>
        haversineM(origin, a) <= haversineM(origin, b) ? a : b,
      );
      return {
        ...s,
        lat: nearest.lat,
        lon: nearest.lon,
        address: nearest.street
          ? `${nearest.name} — ${nearest.street} (chi nhánh gần nhất, OSM)`
          : `${nearest.name} (chi nhánh gần nhất, OSM)`,
      };
    });
  }, [stores, branches, origin]);

  // Visit order: nearest-neighbor from the origin (readable, short route).
  const ordered = useMemo(() => orderByNearest(origin, effective), [origin, effective]);

  // Include coords: when OSM branches load, the same chain gets new lat/lon.
  const routeKey = `${origin.lat},${origin.lon}|${transport}|${ordered
    .map((s) => `${s.code}@${s.lat.toFixed(5)},${s.lon.toFixed(5)}`)
    .join(",")}`;
  useEffect(() => {
    if (ordered.length === 0) return; // render already hides the route section
    const ctrl = new AbortController();
    // setState happens only in async callbacks (never synchronously in the effect).
    fetchRoute([origin, ...ordered.map((s) => ({ lat: s.lat, lon: s.lon }))], transport, ctrl.signal)
      .then((r) => {
        if (ctrl.signal.aborted) return;
        setRoute(r);
        // publish so PlanSummary's km/min chips match the map
        setSummary({ distanceM: r.distanceM, durationS: r.durationS, estimated: r.estimated });
      })
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // New origin → share with the plan store and RE-OPTIMIZE store selection
  // (price + distance trade-off happens server-side with this location).
  function applyOrigin(p: LatLon, label: string) {
    setLocation(p);
    setOriginLabel(label);
    void reoptimize();
  }

  function useMyLocation() {
    if (!navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyOrigin({ lat: pos.coords.latitude, lon: pos.coords.longitude }, "Vị trí của bạn");
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  // Origin picker (also handy as a dev mode): click the map = new start point.
  function pickOrigin(p: LatLon) {
    applyOrigin(p, `Điểm bạn chọn (${p.lat.toFixed(4)}, ${p.lon.toFixed(4)})`);
    setPicking(false);
  }

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex-1 text-center text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          title="Định vị và tính lại lộ trình từ vị trí của bạn"
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background)] disabled:opacity-50"
          aria-label="Dùng vị trí của tôi"
        >
          {locating ? "…" : "📍"}
        </button>
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          title="Bấm rồi click lên bản đồ để đặt điểm xuất phát (test nhanh)"
          aria-pressed={picking}
          className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${
            picking
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]"
          }`}
          aria-label="Chọn điểm xuất phát trên bản đồ"
        >
          🎯
        </button>
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
        aria-label="Bản đồ lộ trình mua sắm đề xuất"
      >
        {ordered.length === 0 ? (
          <div className="grid h-full w-full place-items-center bg-[var(--color-surface-high)] text-sm text-[var(--color-text-secondary)]">
            Chưa có cửa hàng nào trong kế hoạch.
          </div>
        ) : (
          <RouteMap
            origin={origin}
            originLabel={originLabel}
            stores={ordered}
            route={route}
            onPick={pickOrigin}
            picking={picking}
          />
        )}
        {picking && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-[1000] -translate-x-1/2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white shadow-md">
            Click lên bản đồ để đặt điểm xuất phát
          </div>
        )}
      </div>
      <p className="mt-1 text-center text-xs text-[var(--color-text-secondary)]">
        Xuất phát: {originLabel}
      </p>

      {/* route summary + turn-by-turn */}
      {route && ordered.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold">
              {TRANSPORT_ICON[transport] ?? "🛵"} {fmtKm(route.distanceM)} · {fmtDuration(route.durationS)}
              {route.estimated && (
                <span className="ml-1 text-xs font-normal text-[var(--color-text-secondary)]">
                  (ước lượng đường thẳng — không kết nối được dịch vụ chỉ đường)
                </span>
              )}
            </p>
            {!route.estimated && route.legs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSteps((v) => !v)}
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {showSteps ? "Ẩn chỉ dẫn ▲" : "Chỉ dẫn đường ▼"}
              </button>
            )}
          </div>

          {showSteps && !route.estimated && (
            <ol className={`mt-2 space-y-1 overflow-y-auto ${expanded ? "max-h-72" : "max-h-44"}`}>
              {route.legs.map((leg, i) => {
                const dest = ordered[i];
                if (!dest) return null;
                const open = openLeg === i;
                return (
                  <li key={dest.code} className="rounded-[var(--radius-input)] border border-[var(--color-border)]">
                    <button
                      type="button"
                      onClick={() => setOpenLeg(open ? null : i)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--color-background)]"
                    >
                      <span>
                        <span
                          className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: dest.color }}
                        >
                          {i + 1}
                        </span>
                        Chặng {i + 1}: đến {dest.name}
                      </span>
                      <span className="whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                        {fmtKm(leg.distanceM)} · {fmtDuration(leg.durationS)} {open ? "▲" : "▼"}
                      </span>
                    </button>
                    {open && (
                      <ul className="border-t border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                        {leg.steps.map((st, j) => (
                          <li key={j} className="flex justify-between gap-2 py-0.5">
                            <span>
                              {st.instruction}
                              {st.name ? ` vào ${st.name}` : ""}
                            </span>
                            {st.distanceM >= 10 && (
                              <span className="whitespace-nowrap tabular-nums">{fmtKm(st.distanceM)}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      <p className="mt-2 text-center text-xs text-[var(--color-text-secondary)]">
        Bản đồ OpenStreetMap · chỉ đường OSRM{route?.estimated ? " (đang offline)" : ""} ·
        {branches.length > 0
          ? " tự chọn chi nhánh cùng chuỗi gần bạn nhất (dữ liệu OSM)."
          : " thứ tự ghé được xếp gần-trước từ điểm xuất phát."}
      </p>
    </div>
  );
}
