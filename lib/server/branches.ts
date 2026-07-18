// Server-only: real store branches in Da Nang.
// Priority: 1) Supabase `store_locations` (synced via scripts/sync-branches.mjs,
// can also hold manually-added/official-locator rows), 2) live OSM Overpass,
// 3) the static per-chain coordinate. Shared by /api/v1/branches (map display)
// and /api/v1/optimize (distance-aware store selection). Cached in-memory.
import { getSupabaseServiceClient } from "@/lib/supabase/client";
import { sourceToStoreCode } from "@/lib/server/productSearch";
import { STORES } from "@/lib/shared/catalog";
import type { StoreCode } from "@/lib/shared/types";

export interface Branch {
  code: StoreCode;
  name: string;
  lat: number;
  lon: number;
  street?: string;
}

// Greater Da Nang bounding box.
const BBOX = "15.90,108.05,16.20,108.40";
const OVERPASS_URL = process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
// Matches by name OR brand tag; includes malls (GO!/Lotte are tagged as malls).
const QUERY = `
[out:json][timeout:30];
(
  nwr["shop"~"supermarket|convenience|mall|department_store"]["name"~"WinMart|Winmart|VinMart|winmart|Bach Hoa Xanh|Bách hóa|Bách Hóa|bach hoa|GO!|Big C|BigC|Lotte|MM Mega|Mega Market",i](${BBOX});
  nwr["brand"~"WinMart|VinMart|Bách hóa XANH|Bach Hoa Xanh|GO!|Big C|Lotte Mart|MM Mega Market",i](${BBOX});
);
out center tags 300;
`;

/** OSM name -> app StoreCode. Null = a chain we don't carry (e.g. Co.opmart). */
function brandToCode(name: string): StoreCode | null {
  const n = name.toLowerCase();
  if (n.includes("winmart") || n.includes("vinmart")) return "winmart";
  if (n.includes("bách hóa") || n.includes("bach hoa")) return "bhx";
  if (n.includes("go!") || n.includes("big c") || n.includes("bigc")) return "gobigc";
  if (n.includes("lotte")) return "lotte";
  if (n.includes("mm mega")) return "mm";
  return null;
}

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

let cache: { at: number; branches: Branch[] } | null = null;
const CACHE_MS = 6 * 60 * 60 * 1000; // 6h

/** Drop the in-memory cache — call after syncing new rows into store_locations. */
export function clearBranchCache(): void {
  cache = null;
}

/** Branches from Supabase `store_locations` (preferred source). */
async function fromStoreLocations(): Promise<Branch[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("store_locations")
      .select("source,store_name,address,lat,lon,active")
      .eq("active", true)
      .limit(500);
    if (error || !data) return [];
    const out: Branch[] = [];
    for (const row of data as Array<{
      source: string; store_name: string | null; address: string | null;
      lat: number | null; lon: number | null;
    }>) {
      const code = sourceToStoreCode(row.source);
      if (!code || row.lat == null || row.lon == null) continue;
      out.push({
        code,
        name: row.store_name ?? STORES[code].name,
        lat: row.lat,
        lon: row.lon,
        street: row.address ?? undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** All known branches. Returns [] on total failure — callers fall back to STORES. */
export async function getBranches(): Promise<Branch[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.branches;

  // 1) DB table (curated, survives Overpass outages/rate limits)
  const fromDb = await fromStoreLocations();
  if (fromDb.length > 0) {
    cache = { at: Date.now(), branches: fromDb };
    return fromDb;
  }

  // 2) live OSM
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Overpass rejects requests without a descriptive User-Agent (HTTP 406).
        "User-Agent": "gomgom-shopping-optimizer/1.0 (university capstone)",
      },
      body: new URLSearchParams({ data: QUERY }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const data = (await res.json()) as { elements?: OverpassElement[] };

    const branches: Branch[] = [];
    for (const el of data.elements ?? []) {
      const tags = el.tags ?? {};
      const name = tags.name ?? "";
      const code = brandToCode(name);
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!code || lat == null || lon == null) continue;
      branches.push({ code, name, lat, lon, street: tags["addr:street"] || undefined });
    }
    cache = { at: Date.now(), branches };
    return branches;
  } catch {
    return [];
  }
}

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Straight-line km from the user to the NEAREST branch of a chain (×1.35 urban
 * detour factor). Falls back to the chain's static coordinate when OSM has no
 * branch for it (MM/Lotte genuinely have one location in Da Nang).
 */
export function nearestBranchKm(
  code: StoreCode,
  user: { lat: number; lon: number },
  branches: Branch[],
): number {
  const candidates = branches.filter((b) => b.code === code);
  const points = candidates.length > 0 ? candidates : [STORES[code]];
  const best = Math.min(...points.map((p) => haversineKm(user, p)));
  return best * 1.35;
}
