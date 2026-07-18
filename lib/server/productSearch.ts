// Server-only: search real products in Supabase `normalized_products`.
// Uses the service-role client — NEVER import this from client components.
import { getSupabaseServiceClient } from "@/lib/supabase/client";
import type { CatalogProduct } from "@/lib/shared/catalog";
import type { StoreCode } from "@/lib/shared/types";
import type { IngredientInput } from "@/lib/services/buildPlan";

/** DB `source` value -> app StoreCode (DB uses "go" for GO!/BigC). */
const SOURCE_TO_STORE: Record<string, StoreCode> = {
  bhx: "bhx",
  mm: "mm",
  lotte: "lotte",
  go: "gobigc",
  winmart: "winmart",
};

export function sourceToStoreCode(source: string): StoreCode | null {
  return SOURCE_TO_STORE[source] ?? null;
}

/**
 * Match the DB's `name_normalized` convention: lowercase, diacritics stripped.
 * NFD decomposition doesn't split "đ/Đ" — replace those manually.
 */
export function normalizeVi(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Search keywords per canonical ingredient key, tried in order until one hits.
 * Longer/more specific first — short keywords like "sa" substring-match too much.
 */
export const KEYWORDS: Record<string, string[]> = {
  beef: ["thit bo", "bo uc", "nam bo"],
  pork: ["thit heo", "ba chi", "heo xay", "suon heo"],
  chicken: ["thit ga", "dui ga", "uc ga", "ga ta"],
  rice_noodle: ["bun tuoi", "banh pho", "bun kho", "pho kho", "bun"],
  lemongrass: ["sa cay", "sa bam", "cu sa"],
  fish_sauce: ["mam ruoc hue", "mam ruoc", "nuoc mam"],
  fresh_herbs: ["rau thom", "hanh la", "ngo gai", "hung que"],
  vegetables: ["rau cai", "ca chua", "cai xanh", "rau muong"],
  tofu: ["dau hu", "dau phu", "tau hu"],
  crab: ["cua dong", "rieu cua", "cua xay", "gach cua"],
  tomato: ["ca chua"],
  shrimp_paste: ["mam tom"],
  peanuts: ["dau phong", "lac rang"],
  shrimp: ["tom tuoi", "tom su", "tom the", "tom dong lanh"],
  squid: ["muc ong", "muc tuoi", "muc la"],
  // "nam" alone substring-matches too much ("nam" = male) — specific types only.
  mushroom: ["nam kim cham", "nam rom", "nam huong", "nam bao ngu", "nam dui ga"],
  fish: ["ca dieu hong", "ca basa", "ca loc", "ca thu", "phi le ca"],
  egg: ["trung ga", "trung vit", "trung cut"],
};

export function keywordsFor(ing: IngredientInput): string[] {
  const mapped = KEYWORDS[ing.key];
  if (mapped && mapped.length > 0) return mapped;
  const norm = normalizeVi(ing.name);
  return norm ? [norm] : [];
}

interface DbRow {
  product_id: string;
  name: string;
  name_normalized: string | null;
  source: string;
  price: number | null;
  unit_label: string | null;
  price_unit: string | null;
  thumbnail_url: string | null;
  image_url: string | null;
  product_url: string | null;
  in_stock: boolean | null;
}

const ROW_COLUMNS =
  "product_id,name,name_normalized,source,price,unit_label,price_unit,thumbnail_url,image_url,product_url,in_stock";

/**
 * ILIKE %kw% substring-matches inside words ("bun" hits "Bunapi" mushrooms).
 * Require the keyword to appear at word boundaries in name_normalized.
 */
export function matchesWholeWords(nameNormalized: string | null, kw: string): boolean {
  if (!nameNormalized) return false;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(nameNormalized);
}

/**
 * Cheapest-first ordering surfaces things you can't cook with: seed packets
 * ("hạt giống cà chua" beats actual tomatoes on price), seasoning sachets,
 * multi-item combos, etc.
 */
const NAME_BLOCKLIST = ["hat giong", "gia vi", "huong lieu", "combo"];

/**
 * Per-ingredient blocklist: products whose name CONTAINS the keyword but are a
 * different thing ("bánh tráng mắm ruốc" is a snack, not a jar of mắm ruốc).
 */
const KEY_BLOCKLIST: Record<string, string[]> = {
  // "xot ga chien nuoc mam" (cooking sauce packets) contain the nuoc mam
  // keyword but aren't fish sauce — block sauce/marinade derivatives.
  fish_sauce: ["banh trang", "snack", "banh", "xot", "sot", "chien", "uop"],
  rice_noodle: ["snack", "mi tron"],
  shrimp_paste: ["banh trang", "snack", "xot", "sot", "chien"],
  // Raw-meat ingredients: processed products contain the meat keyword but
  // aren't what a recipe means by "thịt ..." (sausages, jerky, snacks).
  pork: ["xuc xich", "snack", "kho bo", "kho heo", "banh", "heo ham", "pate", "chao ", "an lien"],
  beef: ["xuc xich", "snack", "kho bo", "banh", "bo ham", "pate", "an lien"],
  chicken: ["xuc xich", "snack", "kho ga", "banh", "ga ham", "pate", "an lien"],
};

export function isBlockedName(nameNormalized: string | null, ingredientKey?: string): boolean {
  if (!nameNormalized) return false;
  if (NAME_BLOCKLIST.some((b) => nameNormalized.includes(b))) return true;
  const perKey = ingredientKey ? KEY_BLOCKLIST[ingredientKey] : undefined;
  return perKey ? perKey.some((b) => nameNormalized.includes(b)) : false;
}

/** next/image only accepts https remotes per our config; drop anything else. */
function httpsOnly(url: string | null): string {
  return url && url.startsWith("https://") ? url : "";
}

function rowToProduct(row: DbRow, ingredientKey: string): CatalogProduct | null {
  const storeCode = sourceToStoreCode(row.source);
  if (!storeCode || row.price == null || row.price <= 0) return null;
  return {
    id: row.product_id,
    ingredientKey,
    name: row.name,
    storeCode,
    price: row.price,
    unit: row.unit_label ?? row.price_unit ?? "",
    inStock: row.in_stock ?? true,
    image: httpsOnly(row.thumbnail_url) || httpsOnly(row.image_url),
    url: row.product_url ?? "",
  };
}

/**
 * Find real product candidates for one ingredient: food-only, in-stock,
 * cheapest-first. Tries each keyword until one returns results.
 */
export async function searchProducts(
  ing: IngredientInput,
  limit = 5,
): Promise<CatalogProduct[]> {
  const supabase = getSupabaseServiceClient();

  // The DB's is_food flag is incomplete (e.g. "Mắm ruốc Huế", "Bún tươi Safoco"
  // are labeled non-food). Prefer labeled-food rows, but when a keyword finds
  // nothing there, retry without the flag — word-boundary + blocklist still apply.
  const attempts: Array<{ kw: string; requireFood: boolean }> = [];
  for (const kw of keywordsFor(ing)) {
    attempts.push({ kw, requireFood: true });
    attempts.push({ kw, requireFood: false });
  }

  for (const { kw, requireFood } of attempts) {
    // Over-fetch: ILIKE gives substring hits; the word-boundary filter below
    // then drops mid-word false positives ("bun" inside "bunapi").
    let query = supabase
      .from("normalized_products")
      .select(ROW_COLUMNS)
      .eq("in_stock", true)
      .ilike("name_normalized", `%${kw}%`)
      .gt("price", 0)
      .order("price", { ascending: true })
      .limit(limit * 5);
    if (requireFood) query = query.eq("is_food", true);
    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query lỗi: ${error.message}`);
    }
    const rows = (data as DbRow[]).filter(
      (r) => matchesWholeWords(r.name_normalized, kw) && !isBlockedName(r.name_normalized, ing.key),
    );
    // Relevance before price: a name STARTING with the keyword ("ca chua beef")
    // is the item itself; a mid-name hit ("dau sot ca chua") is a derivative.
    rows.sort((a, b) => {
      const aStarts = a.name_normalized?.startsWith(kw) ? 0 : 1;
      const bStarts = b.name_normalized?.startsWith(kw) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return (a.price ?? 0) - (b.price ?? 0);
    });
    const products = rows
      .map((r) => rowToProduct(r, ing.key))
      .filter((p): p is CatalogProduct => p !== null)
      .slice(0, limit);
    if (products.length > 0) return products;
  }
  return [];
}

/**
 * Cheapest valid product of EACH chain for one ingredient — the input the
 * distance-aware optimizer needs (it weighs price against travel distance).
 * Keyword priority is preserved: once a chain is filled by an earlier
 * (more specific) keyword, later keywords don't overwrite it.
 */
export async function cheapestPerStore(
  ing: IngredientInput,
): Promise<Partial<Record<StoreCode, CatalogProduct>>> {
  const supabase = getSupabaseServiceClient();
  const found: Partial<Record<StoreCode, CatalogProduct>> = {};

  const attempts: Array<{ kw: string; requireFood: boolean }> = [];
  for (const kw of keywordsFor(ing)) {
    attempts.push({ kw, requireFood: true });
    attempts.push({ kw, requireFood: false });
  }

  for (const { kw, requireFood } of attempts) {
    if (Object.keys(found).length >= 5) break; // all chains filled
    let query = supabase
      .from("normalized_products")
      .select(ROW_COLUMNS)
      .eq("in_stock", true)
      .ilike("name_normalized", `%${kw}%`)
      .gt("price", 0)
      .order("price", { ascending: true })
      .limit(60);
    if (requireFood) query = query.eq("is_food", true);
    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase query lỗi: ${error.message}`);
    }
    const rows = (data as DbRow[]).filter(
      (r) => matchesWholeWords(r.name_normalized, kw) && !isBlockedName(r.name_normalized, ing.key),
    );
    rows.sort((a, b) => {
      const aStarts = a.name_normalized?.startsWith(kw) ? 0 : 1;
      const bStarts = b.name_normalized?.startsWith(kw) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return (a.price ?? 0) - (b.price ?? 0);
    });
    for (const row of rows) {
      const product = rowToProduct(row, ing.key);
      if (product && !found[product.storeCode]) {
        found[product.storeCode] = product;
      }
    }
  }
  return found;
}

/** Real per-store data age in hours, from `source_freshness.last_updated_at`. */
export async function getFreshness(): Promise<Partial<Record<StoreCode, number>>> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("source_freshness")
    .select("source,last_updated_at");
  if (error) {
    throw new Error(`Supabase freshness lỗi: ${error.message}`);
  }
  const now = Date.now();
  const out: Partial<Record<StoreCode, number>> = {};
  for (const row of data as Array<{ source: string; last_updated_at: string }>) {
    const code = sourceToStoreCode(row.source);
    if (!code) continue;
    const ts = Date.parse(row.last_updated_at);
    if (!Number.isNaN(ts)) {
      out[code] = Math.max(0, Math.round((now - ts) / 3_600_000));
    }
  }
  return out;
}
