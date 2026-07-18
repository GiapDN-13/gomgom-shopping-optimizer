// Honest-substitution notices: the NER model generalizes specific varieties
// ("cá dọn bể" -> "cá"), and product matching then picks any fish. If the user
// named a variety we couldn't actually match, SAY SO instead of silently
// reporting "0 món thiếu" with a different fish.
import type { PlanItem, ShoppingPlan } from "./buildPlan";

const PROTEIN_TOKENS = [
  "cá", "gà", "bò", "heo", "tôm", "mực", "cua", "ốc", "lươn", "vịt",
  "hến", "nghêu", "sò", "ếch",
];

// Words after a protein that do NOT name a variety: cooking methods, dish
// qualifiers, function words, quantities.
const MODIFIER_STOPWORDS = new Set([
  // cooking methods
  "kho", "chiên", "rán", "nướng", "hấp", "luộc", "xào", "rim", "om", "hầm",
  "quay", "chấy", "chua", "cay", "sốt", "xốt", "viên", "xay",
  // dish/style qualifiers (bún bò huế, lẩu thái...)
  "huế", "thái", "hàn", "nhật", "quảng",
  // function words / misc
  "cho", "và", "với", "nhưng", "không", "thêm", "bớt", "ăn", "người", "nhà",
  "tươi", "ngon", "sạch", "để", "là", "ở", "tại", "cả",
]);

function stripDiacritics(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Variety phrases from the query: protein token + up to 2 non-stopword tokens. */
export function varietyPhrases(query: string): Array<{ protein: string; variety: string }> {
  const tokens = query.toLowerCase().split(/\s+/);
  const out: Array<{ protein: string; variety: string }> = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!PROTEIN_TOKENS.includes(tokens[i])) continue;
    const mods: string[] = [];
    for (let j = i + 1; j < tokens.length && mods.length < 2; j++) {
      const t = tokens[j].replace(/[.,!?]/g, "");
      if (!t || /\d/.test(t) || MODIFIER_STOPWORDS.has(t) || PROTEIN_TOKENS.includes(t)) break;
      mods.push(t);
    }
    if (mods.length > 0) {
      out.push({ protein: tokens[i], variety: `${tokens[i]} ${mods.join(" ")}` });
    }
  }
  return out;
}

export interface Substitution {
  /** what the user actually asked for, e.g. "cá dọn bể" */
  variety: string;
  /** the plan item standing in for it */
  item: PlanItem;
}

/**
 * Varieties the user asked for that no matched product reflects, with the
 * substitute item actually planned. Empty when everything matches. Drives the
 * summary notice, the stat chip AND the per-product badge — one source, so
 * the UI never contradicts itself ("0 món thiếu" next to a swapped fish).
 */
export function findSubstitutions(query: string, plan: ShoppingPlan): Substitution[] {
  const phrases = varietyPhrases(query);
  if (phrases.length === 0) return [];

  const items = plan.stores.flatMap((s) => s.items);
  const out: Substitution[] = [];
  for (const { protein, variety } of phrases) {
    const varietyNorm = stripDiacritics(variety);
    const proteinNorm = stripDiacritics(protein);
    // products standing in for this protein
    const related = items.filter(
      (it) =>
        stripDiacritics(it.requestedName).includes(proteinNorm) ||
        stripDiacritics(it.product.name).split(/[^a-z0-9]+/).includes(proteinNorm),
    );
    if (related.length === 0) continue; // protein itself unmatched -> already in "món thiếu"
    const exact = related.some((it) => stripDiacritics(it.product.name).includes(varietyNorm));
    if (!exact) {
      out.push({ variety, item: related[0] });
    }
  }
  return out;
}

/** Human-readable notice per substitution (for the summary card). */
export function substitutionNotices(query: string, plan: ShoppingPlan): string[] {
  return findSubstitutions(query, plan).map(
    ({ variety, item }) =>
      `Không tìm thấy đúng "${variety}" trong dữ liệu sản phẩm — kế hoạch dùng "${item.product.name}" thay thế.`,
  );
}
