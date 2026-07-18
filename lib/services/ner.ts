// Client service for the NER endpoint + mapping NER output to catalog ingredient keys.
import type { NerResponse } from "@/lib/shared/types";
import { RECIPES } from "@/lib/shared/catalog";
import type { IngredientInput } from "./buildPlan";

/** Which extractor to use: self-trained model, or the disclosed external API. */
export type NerModel = "self" | "api";

export interface NerResult extends NerResponse {
  raw: NerResponse;
  source?: string; // "self" | "api" | "mock" — provenance label
  provider?: string; // e.g. gemini-2.0-flash, when source === "api"
  // Verification-gate fields forwarded from the Python NER service (disclosed
  // architecture): final backend + gate verdict for honest provenance labels.
  _backend?: string; // "hybrid" | "ckey-api" | ...
  _gate?: { score: number; verdict: "pass" | "fail"; reasons: string[] };
  _latency_ms?: { model?: number; api?: number };
}

/** Calls POST /api/v1/ner. Throws a human-readable Error on failure (NFR-08/25). */
export async function callNer(
  text: string,
  model?: NerModel,
  signal?: AbortSignal,
): Promise<NerResult> {
  let res: Response;
  try {
    res = await fetch("/api/v1/ner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(model ? { text, model } : { text }),
      signal,
    });
  } catch {
    throw new Error("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      (data && typeof data.error === "string" && data.error) ||
        "Dịch vụ phân tích tạm thời gặp sự cố. Vui lòng thử lại.",
    );
  }

  const data = (await res.json()) as NerResult;
  return { ...data, raw: data };
}

// Order matters: more specific first ("mắm tôm" before the generic "mắm").
// NOTE: JS \b is ASCII-only — it does NOT work next to Vietnamese diacritics
// ("cá" never matches /\bcá\b/). Plain substring is safe here because tones
// distinguish words ("cá" ≠ "cà chua", "cải").
const VI_KEYWORDS: Array<{ re: RegExp; key: string }> = [
  { re: /mắm tôm/i, key: "shrimp_paste" },
  { re: /mắm cá|mắm nêm|mắm ruốc|nước mắm/i, key: "fish_sauce" },
  { re: /diếp cá/i, key: "fresh_herbs" }, // herb, not fish
  { re: /cua/i, key: "crab" },
  { re: /tôm/i, key: "shrimp" },
  { re: /mực/i, key: "squid" },
  { re: /cá/i, key: "fish" },
  { re: /trứng/i, key: "egg" },
  { re: /nấm/i, key: "mushroom" },
  { re: /đậu phộng|lạc rang/i, key: "peanuts" },
  { re: /bò/i, key: "beef" },
  { re: /heo|lợn|ba chỉ|sườn/i, key: "pork" },
  { re: /gà/i, key: "chicken" },
  { re: /bún|phở|mì|miến/i, key: "rice_noodle" },
  { re: /sả/i, key: "lemongrass" },
  { re: /mắm|ruốc|nước mắm/i, key: "fish_sauce" },
  { re: /rau thơm|rau sống|húng|ngò|hành lá|thì là|rau cần|rau răm|tía tô|rau đắng/i, key: "fresh_herbs" },
  { re: /cà chua/i, key: "tomato" },
  { re: /rau|cải|cà rốt|giá đỗ|bắp chuối/i, key: "vegetables" },
  { re: /đậu hũ|đậu phụ|tàu hũ/i, key: "tofu" },
];

/** Best-effort: turn a Vietnamese ingredient name into a canonical catalog key. */
export function ingredientNameToKey(name: string): string | null {
  for (const { re, key } of VI_KEYWORDS) {
    if (re.test(name)) return key;
  }
  return null;
}

/**
 * Convert a NER response into ingredient inputs for buildPlan.
 * Prefers the dish recipe when recognisable; falls back to keyword mapping of
 * the extracted ingredient names.
 */
export function nerToIngredients(ner: NerResponse): IngredientInput[] {
  const exclusions = new Set(ner.exclusions.map((e) => e.toLowerCase().trim()));
  const inputs: IngredientInput[] = [];
  const seen = new Set<string>();

  for (const ing of ner.ingredients) {
    if (exclusions.has(ing.name.toLowerCase().trim())) continue;
    const key = ingredientNameToKey(ing.name) ?? slug(ing.name);
    if (seen.has(key)) continue;
    seen.add(key);
    inputs.push({ key, name: ing.name });
  }
  return inputs;
}

/** Diacritic-insensitive lowering so "bún riêu", "bun rieu", "Bún Rêu" all match. */
function normalizeViText(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Ordered: more specific dishes first (e.g. "bún bò" before generic "phở").
const DISH_PATTERNS: Array<{ re: RegExp; recipe: string }> = [
  { re: /bun bo/, recipe: "bun_bo_hue" },
  { re: /bun rieu|bun reu/, recipe: "bun_rieu" },
  { re: /bun cha/, recipe: "bun_cha" },
  { re: /bun thit nuong/, recipe: "bun_thit_nuong" },
  { re: /pho ga/, recipe: "pho_ga" },
  { re: /\bpho\b(?! mai)/, recipe: "pho_bo" }, // not "phô mai" (cheese)
  { re: /com ga/, recipe: "com_ga" },
  { re: /lau thai/, recipe: "lau_thai" },
  { re: /lau bo/, recipe: "lau_bo" },
  { re: /\blau\b/, recipe: "lau_thai" },
  { re: /canh chua/, recipe: "canh_chua" },
  { re: /thit kho/, recipe: "thit_kho" },
  { re: /mi quang/, recipe: "mi_quang" },
];

/** Detect a dish from free text and expand to recipe ingredients (display names). */
export function recipeFromText(text: string): IngredientInput[] | null {
  const t = normalizeViText(text);
  for (const { re, recipe } of DISH_PATTERNS) {
    if (re.test(t)) return expand(recipe);
  }
  return null;
}

const KEY_LABELS: Record<string, string> = {
  beef: "Thịt bò",
  pork: "Thịt heo",
  chicken: "Thịt gà",
  rice_noodle: "Bún/Phở",
  lemongrass: "Sả",
  fish_sauce: "Mắm ruốc",
  fresh_herbs: "Rau thơm",
  vegetables: "Rau củ",
  tofu: "Đậu hũ",
  crab: "Cua đồng",
  tomato: "Cà chua",
  shrimp_paste: "Mắm tôm",
  peanuts: "Đậu phộng",
  shrimp: "Tôm tươi",
  squid: "Mực",
  mushroom: "Nấm",
  fish: "Cá",
  egg: "Trứng",
};

function expand(recipeId: string): IngredientInput[] {
  const recipe = RECIPES[recipeId];
  if (!recipe) return [];
  return recipe.ingredients.map((key) => ({ key, name: KEY_LABELS[key] ?? key }));
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_");
}
