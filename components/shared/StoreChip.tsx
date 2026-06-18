import { STORES } from "@/lib/shared/catalog";
import type { StoreCode } from "@/lib/shared/types";

const SHORT: Record<StoreCode, string> = {
  bhx: "BHX",
  mm: "MM",
  lotte: "Lotte",
  gobigc: "GO!",
  winmart: "WIN",
};

// Brand-colored chip for instant retailer recognition (DESIGN.md).
export function StoreChip({ code, showName = false }: { code: StoreCode; showName?: boolean }) {
  const store = STORES[code];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: store.color }}
    >
      {SHORT[code]}
      {showName && <span className="font-normal opacity-90">{store.name}</span>}
    </span>
  );
}
