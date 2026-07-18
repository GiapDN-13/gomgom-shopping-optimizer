// Import a JSON file of branches into Supabase `store_locations`.
//
//   node scripts/import-branches.mjs scripts/data/bhx-danang.json
//
// File format: { "source": "bhx", "prefix": "bhx-web", "branches":
//   [{ "store_name": "...", "address": "...", "lat": 16.05, "lon": 108.2 }, ...] }
//
// Rows are keyed store_code "<prefix>-<index>" — re-importing the same file
// first deletes rows with that prefix, so it stays idempotent. This is the
// companion to sync-branches.mjs (OSM): use it for chain store-locator lists
// or manual entries.
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const SUPABASE_URL = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");

const file = process.argv[2];
if (!file || !SUPABASE_URL || !KEY) {
  console.error("Cách dùng: node scripts/import-branches.mjs <file.json>  (cần .env.local)");
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), "utf-8"));
const { source, prefix, branches } = payload;
if (!source || !prefix || !Array.isArray(branches)) {
  console.error("File cần dạng { source, prefix, branches: [{store_name,address,lat,lon}] }");
  process.exit(1);
}

const rows = branches
  .filter((b) => typeof b.lat === "number" && typeof b.lon === "number")
  .map((b, i) => ({
    store_code: `${prefix}-${i + 1}`,
    source,
    store_name: b.store_name ?? source,
    city: b.city ?? "Đà Nẵng",
    province: b.province ?? "Đà Nẵng",
    ward: b.ward ?? null,
    address: b.address ?? null,
    lat: b.lat,
    lon: b.lon,
    active: true,
  }));

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

console.log(`1) Xoá bản ghi ${prefix}-* cũ…`);
const del = await fetch(
  `${SUPABASE_URL}/rest/v1/store_locations?store_code=like.${encodeURIComponent(prefix)}-*`,
  { method: "DELETE", headers },
);
if (!del.ok) throw new Error(`DELETE ${del.status}: ${await del.text()}`);

console.log(`2) Ghi ${rows.length} chi nhánh (${source})…`);
const ins = await fetch(`${SUPABASE_URL}/rest/v1/store_locations`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=minimal" },
  body: JSON.stringify(rows),
});
if (!ins.ok) throw new Error(`INSERT ${ins.status}: ${await ins.text()}`);
console.log("Xong.");
