import {
  ingredientNameToKey,
  nerToIngredients,
  recipeFromText,
} from "@/lib/services/ner";
import type { NerResponse } from "@/lib/shared/types";

describe("ingredientNameToKey", () => {
  it("maps Vietnamese ingredient names to canonical keys", () => {
    expect(ingredientNameToKey("Thịt bò bắp")).toBe("beef");
    expect(ingredientNameToKey("Bún tươi")).toBe("rice_noodle");
    expect(ingredientNameToKey("Sả cây")).toBe("lemongrass");
    expect(ingredientNameToKey("Mắm ruốc")).toBe("fish_sauce");
  });

  it("returns null for unknown names", () => {
    expect(ingredientNameToKey("Kim cương")).toBeNull();
  });
});

describe("recipeFromText", () => {
  it("expands a recognised dish into ingredients", () => {
    const ings = recipeFromText("Tôi muốn nấu bún bò Huế cho 4 người");
    expect(ings).not.toBeNull();
    expect(ings!.map((i) => i.key)).toContain("beef");
    expect(ings!.map((i) => i.key)).toContain("rice_noodle");
  });

  it("returns null for unknown dishes", () => {
    expect(recipeFromText("mua nước ngọt")).toBeNull();
  });

  it("recognises bún riêu (with typo + no diacritics)", () => {
    for (const q of ["nấu bún riêu cua cho 4 người", "Bún rêu", "bun rieu"]) {
      const ings = recipeFromText(q);
      expect(ings).not.toBeNull();
      expect(ings!.map((i) => i.key)).toContain("crab");
      expect(ings!.map((i) => i.key)).toContain("tomato");
    }
  });

  it("recognises the newly added dishes", () => {
    expect(recipeFromText("lẩu thái cho 6 người")!.map((i) => i.key)).toContain("shrimp");
    expect(recipeFromText("canh chua cá lóc")!.map((i) => i.key)).toContain("fish");
    expect(recipeFromText("thịt kho trứng")!.map((i) => i.key)).toContain("egg");
    expect(recipeFromText("mì quảng")!.map((i) => i.key)).toContain("peanuts");
  });

  it("does not mistake phô mai (cheese) for phở", () => {
    expect(recipeFromText("mua phô mai con bò cười")).toBeNull();
  });
});

describe("nerToIngredients", () => {
  it("maps ner ingredients and drops exclusions", () => {
    const ner: NerResponse = {
      ingredients: [
        { name: "Thịt bò" },
        { name: "Hành tây" },
      ],
      exclusions: ["Hành tây"],
      serving_size: 4,
      city: "Da Nang",
    };
    const result = nerToIngredients(ner);
    const names = result.map((r) => r.name);
    expect(names).toContain("Thịt bò");
    expect(names).not.toContain("Hành tây");
  });
});
