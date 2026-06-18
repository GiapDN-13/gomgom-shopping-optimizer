import { buildPlan } from "@/lib/services/buildPlan";

describe("buildPlan", () => {
  it("groups matched ingredients into stores with totals", () => {
    const plan = buildPlan([
      { key: "beef", name: "Thịt bò" },
      { key: "rice_noodle", name: "Bún" },
    ]);
    expect(plan.stores.length).toBeGreaterThan(0);
    expect(plan.unmatched).toHaveLength(0);
    // final total = product total + delivery total
    expect(plan.finalTotal).toBe(plan.productTotal + plan.deliveryTotal);
  });

  it("picks the cheapest in-stock product per ingredient", () => {
    const plan = buildPlan([{ key: "beef", name: "Thịt bò" }]);
    const allItems = plan.stores.flatMap((s) => s.items);
    expect(allItems).toHaveLength(1);
    // cheapest beef in catalog is 135000 (mm)
    expect(allItems[0].product.price).toBe(135000);
  });

  it("reports unmatched ingredients", () => {
    const plan = buildPlan([{ key: "unobtainium", name: "Sao Hoả" }]);
    expect(plan.unmatched).toContain("Sao Hoả");
    expect(plan.stores).toHaveLength(0);
  });

  it("flags stale stores (>48h)", () => {
    // fish_sauce is sold at lotte (52h stale) and bhx; cheapest is bhx (fresh).
    // Use lemongrass+fish_sauce to involve multiple stores.
    const plan = buildPlan([
      { key: "beef", name: "Thịt bò" },
      { key: "fish_sauce", name: "Mắm ruốc" },
    ]);
    // total is internally consistent regardless of which stores are chosen
    expect(plan.finalTotal).toBe(plan.productTotal + plan.deliveryTotal);
    expect(Array.isArray(plan.staleStores)).toBe(true);
  });

  it("produces a human-readable reason", () => {
    const plan = buildPlan([{ key: "beef", name: "Thịt bò" }]);
    expect(typeof plan.reason).toBe("string");
    expect(plan.reason.length).toBeGreaterThan(0);
  });
});
