// OSRM routing client — real road geometry + turn-by-turn directions.
//
// Uses public OSRM instances (no API key): the FOSSGIS servers for per-profile
// routing, falling back to the project demo server. Light per-plan usage only
// (1 request per plan render) — within the public usage policy. If every host
// fails, we degrade honestly to straight lines + speed-based estimates, and the
// UI labels the result "ước lượng" (estimated).
import type { TransportMode } from "@/lib/shared/types";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface RouteStep {
  instruction: string; // Vietnamese-ish turn instruction
  name: string; // street name ("" if unnamed)
  distanceM: number;
}

export interface RouteLeg {
  distanceM: number;
  durationS: number;
  steps: RouteStep[];
}

export interface RouteResult {
  geometry: [number, number][]; // [lat, lon] polyline for Leaflet
  distanceM: number;
  durationS: number;
  legs: RouteLeg[]; // one per stop-to-stop segment
  estimated: boolean; // true = straight-line fallback, not road routing
}

// Per-profile public OSRM bases (FOSSGIS). walking gets a real foot profile.
const PROFILE_BASES: Record<TransportMode, string[]> = {
  car: [
    "https://routing.openstreetmap.de/routed-car/route/v1/driving",
    "https://router.project-osrm.org/route/v1/driving",
  ],
  motorbike: [
    // no public motorbike profile — car roads are the closest approximation
    "https://routing.openstreetmap.de/routed-car/route/v1/driving",
    "https://router.project-osrm.org/route/v1/driving",
  ],
  walking: [
    "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
    "https://router.project-osrm.org/route/v1/driving",
  ],
};

// Fallback speeds (km/h) for the straight-line estimate.
const FALLBACK_SPEED: Record<TransportMode, number> = {
  walking: 4.5,
  motorbike: 28,
  car: 32,
};

/** Order stops nearest-neighbor from the origin so the route reads sensibly. */
export function orderByNearest<T extends LatLon>(origin: LatLon, stops: T[]): T[] {
  const remaining = [...stops];
  const ordered: T[] = [];
  let cur: LatLon = origin;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestD = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineM(cur, s);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    cur = next;
  }
  return ordered;
}

export async function fetchRoute(
  points: LatLon[],
  mode: TransportMode,
  signal?: AbortSignal,
): Promise<RouteResult> {
  if (points.length < 2) {
    return { geometry: points.map((p) => [p.lat, p.lon]), distanceM: 0, durationS: 0, legs: [], estimated: false };
  }

  const coords = points.map((p) => `${p.lon},${p.lat}`).join(";");
  for (const base of PROFILE_BASES[mode]) {
    try {
      const res = await fetch(
        `${base}/${coords}?overview=full&geometries=geojson&steps=true`,
        { signal },
      );
      if (!res.ok) continue;
      const data = await res.json();
      const route = data?.routes?.[0];
      if (!route?.geometry?.coordinates) continue;
      return {
        geometry: route.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon] as [number, number],
        ),
        distanceM: route.distance ?? 0,
        durationS: adjustDuration(route.duration ?? 0, route.distance ?? 0, mode, base),
        legs: (route.legs ?? []).map(parseLeg),
        estimated: false,
      };
    } catch {
      // try next host
    }
  }

  // All hosts failed — honest straight-line estimate.
  let dist = 0;
  const legs: RouteLeg[] = [];
  for (let i = 1; i < points.length; i++) {
    const d = haversineM(points[i - 1], points[i]) * 1.35; // urban detour factor
    dist += d;
    legs.push({
      distanceM: d,
      durationS: (d / 1000 / FALLBACK_SPEED[mode]) * 3600,
      steps: [],
    });
  }
  return {
    geometry: points.map((p) => [p.lat, p.lon]),
    distanceM: dist,
    durationS: (dist / 1000 / FALLBACK_SPEED[mode]) * 3600,
    legs,
    estimated: true,
  };
}

// OSRM's driving durations assume a car; scale for motorbike (similar in VN
// city traffic) and recompute for walking when we had to use the car profile.
function adjustDuration(durationS: number, distanceM: number, mode: TransportMode, base: string): number {
  if (mode === "walking" && base.includes("driving")) {
    return (distanceM / 1000 / FALLBACK_SPEED.walking) * 3600;
  }
  return durationS;
}

interface OsrmStep {
  name?: string;
  distance?: number;
  maneuver?: { type?: string; modifier?: string };
}

function parseLeg(leg: { distance?: number; duration?: number; steps?: OsrmStep[] }): RouteLeg {
  return {
    distanceM: leg.distance ?? 0,
    durationS: leg.duration ?? 0,
    steps: (leg.steps ?? []).map((s) => ({
      instruction: viInstruction(s.maneuver?.type ?? "", s.maneuver?.modifier ?? ""),
      name: s.name ?? "",
      distanceM: s.distance ?? 0,
    })),
  };
}

const MODIFIER_VI: Record<string, string> = {
  left: "trái",
  right: "phải",
  "slight left": "chếch trái",
  "slight right": "chếch phải",
  "sharp left": "gắt trái",
  "sharp right": "gắt phải",
  straight: "thẳng",
  uturn: "quay đầu",
};

/** Map OSRM maneuver type/modifier to a Vietnamese instruction. */
export function viInstruction(type: string, modifier: string): string {
  const dir = MODIFIER_VI[modifier] ?? "";
  switch (type) {
    case "depart":
      return "Xuất phát";
    case "arrive":
      return "Đến nơi";
    case "turn":
      return modifier === "straight" ? "Đi thẳng" : modifier === "uturn" ? "Quay đầu" : `Rẽ ${dir}`;
    case "new name":
    case "continue":
      return dir && dir !== "thẳng" ? `Đi tiếp, nghiêng ${dir}` : "Đi thẳng tiếp";
    case "merge":
      return `Nhập làn ${dir}`.trim();
    case "on ramp":
      return "Vào đường dẫn";
    case "off ramp":
      return "Ra khỏi đường dẫn";
    case "fork":
      return `Giữ ${dir || "hướng"} tại ngã ba`;
    case "roundabout":
    case "rotary":
      return "Vào vòng xuyến";
    case "exit roundabout":
    case "exit rotary":
      return "Ra khỏi vòng xuyến";
    case "end of road":
      return `Cuối đường rẽ ${dir}`.trim();
    default:
      return dir ? `Rẽ ${dir}` : "Đi tiếp";
  }
}

export function haversineM(a: LatLon, b: LatLon): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function fmtKm(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function fmtDuration(s: number): string {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} phút`;
  return `${Math.floor(min / 60)}g${String(min % 60).padStart(2, "0")}`;
}
