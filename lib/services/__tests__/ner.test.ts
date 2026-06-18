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
