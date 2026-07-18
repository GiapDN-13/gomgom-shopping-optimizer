// Sync real store-branch locations into Supabase `store_locations`.
//
// Source: OpenStreetMap (Overpass) — supermarkets/convenience/malls of the 5
// chains inside greater Da Nang, matched by name OR brand tag. Rows are
// upserted with store_code "osm-<id>" so re-running refreshes cleanly.
//
// Run:  node scripts/sync-branches.mjs
// Add other sources later (official locators, manual entries) by inserting
// into the same table with a different store_code prefix — the app reads the
// whole table.
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const SUPABASE_URL = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}

const BBOX = "15.90,108.05,16.20,108.40"; // greater Da Nang
const QUERY = `
[out:json][timeout:30];
(
  nwr["shop"~"supermarket|convenience|mall|department_store"]["name"~"WinMart|Winmart|VinMart|winmart|Bach Hoa Xanh|Bách hóa|Bách Hóa|bach hoa|GO!|Big C|BigC|Lotte|MM Mega|Mega Market",i](${BBOX});
  nwr["brand"~"WinMart|VinMart|Bách hóa XANH|Bach Hoa Xanh|GO!|Big C|Lotte Mart|MM Mega Market",i](${BBOX});
);
out center tags 300;
`;

// DB `source` convention follows normalized_products: "go" for GO!/BigC.
function brandToSource(tags) {
  const s = `${tags.name ?? ""} ${tags.brand ?? ""}`.toLowerCase();
  if (s.includes("winmart") || s.includes("vinmart")) return "winmart";
  if (s.includes("bách hóa") || s.includes("bach hoa")) return "bhx";
  if (s.includes("go!") || s.includes("big c") || s.includes("bigc")) return "go";
  if (s.includes("lotte")) return "lotte";
  if (s.includes("mm mega") || s.includes("mega market")) return "mm";
  return null;
}

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function fetchOverpass() {
  let lastErr = "";
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "gomgom-shopping-optimizer/1.0 (university capstone; branch sync)",
        },
        body: new URLSearchParams({ data: QUERY }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        lastErr = `${url} -> ${res.status}`;
        continue;
      }
      console.log(`   nguồn: ${url}`);
      return await res.json();
    } catch (e) {
      lastErr = `${url} -> ${e.message}`;
    }
  }
  throw new Error(`Mọi Overpass mirror đều lỗi (${lastErr})`);
}

async function main() {
  console.log("1) Lấy chi nhánh từ Overpass…");
  const data = await fetchOverpass();

  const seen = new Set();
  const rows = [];
  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {};
    const source = brandToSource(tags);
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!source || lat == null || lon == null) continue;
    const dedup = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    rows.push({
      store_code: `osm-${el.type ?? "n"}-${el.id}`,
      source,
      store_name: tags.name || tags.brand || source,
      city: "Đà Nẵng",
      province: "Đà Nẵng",
      ward: tags["addr:ward"] ?? null,
      address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null,
      lat,
      lon,
      active: true,
    });
  }
  const byChain = rows.reduce((m, r) => ((m[r.source] = (m[r.source] ?? 0) + 1), m), {});
  console.log(`   ${rows.length} chi nhánh:`, byChain);

  const headers = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  };

  console.log("2) Xoá bản ghi osm-* cũ…");
  const del = await fetch(
    `${SUPABASE_URL}/rest/v1/store_locations?store_code=like.osm-*`,
    { method: "DELETE", headers },
  );
  if (!del.ok) throw new Error(`DELETE ${del.status}: ${await del.text()}`);

  console.log("3) Ghi bản ghi mới…");
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/store_locations`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!ins.ok) throw new Error(`INSERT ${ins.status}: ${await ins.text()}`);

  console.log(`Xong — ${rows.length} chi nhánh trong store_locations.`);
}

main().catch((e) => {
  console.error("Lỗi:", e.message);
  process.exit(1);
});
