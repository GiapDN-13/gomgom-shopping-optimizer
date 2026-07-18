import { substitutionNotices, varietyPhrases } from "../substitution";
import type { PlanItem, ShoppingPlan } from "../buildPlan";
import type { CatalogProduct } from "@/lib/shared/catalog";

function product(name: string): CatalogProduct {
  return {
    id: "p1",
    ingredientKey: "fish",
    name,
    storeCode: "mm",
    price: 75000,
    unit: "con",
    inStock: true,
    image: "",
    url: "",
  };
}

function planWith(items: Array<{ requestedName: string; productName: string }>): ShoppingPlan {
  const planItems: PlanItem[] = items.map((it) => ({
    ingredientKey: "x",
    requestedName: it.requestedName,
    product: product(it.productName),
  }));
  return {
    stores: [
      {
        code: "mm",
        name: "MM Mega Market",
        color: "#E2231A",
        address: "",
        lat: 16.06,
        lon: 108.21,
        items: planItems,
        productSubtotal: 0,
        deliveryFee: 0,
        lastUpdatedHoursAgo: 1,
      },
    ],
    unmatched: [],
    productTotal: 0,
    deliveryTotal: 0,
    finalTotal: 0,
    storeCount: 1,
    staleStores: [],
    reason: "",
  };
}

describe("varietyPhrases", () => {
  it("bắt được 'cá dọn bể'", () => {
    expect(varietyPhrases("Tôi muốn nấu lẩu cá dọn bể cho 10 người ăn")).toEqual([
      { protein: "cá", variety: "cá dọn bể" },
    ]);
  });

  it("không coi 'huế' (tên món) là loại thịt", () => {
    expect(varietyPhrases("nấu bún bò huế cho 4 người")).toEqual([]);
  });

  it("không coi phương pháp nấu là loại ('cá kho tộ')", () => {
    expect(varietyPhrases("nấu cá kho tộ")).toEqual([]);
  });

  it("bắt được 'tôm sú' và 'gà ta'", () => {
    expect(varietyPhrases("mua tôm sú và gà ta")).toEqual([
      { protein: "tôm", variety: "tôm sú" },
      { protein: "gà", variety: "gà ta" },
    ]);
  });
});

describe("substitutionNotices", () => {
  const query = "Tôi muốn nấu lẩu cá dọn bể cho 10 người ăn";

  it("báo thay thế khi sản phẩm không phải đúng loại đã hỏi", () => {
    const plan = planWith([{ requestedName: "cá", productName: "Cá diêu hồng làm sạch" }]);
    const notices = substitutionNotices(query, plan);
    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain("cá dọn bể");
    expect(notices[0]).toContain("Cá diêu hồng làm sạch");
  });

  it("im lặng khi sản phẩm đúng loại ('cá lóc')", () => {
    const plan = planWith([{ requestedName: "cá", productName: "Cá lóc làm sạch 500g" }]);
    expect(substitutionNotices("nấu canh chua cá lóc", plan)).toEqual([]);
  });

  it("im lặng khi protein đã nằm trong 'món thiếu' (không match gì)", () => {
    const plan = planWith([{ requestedName: "bún tươi", productName: "Bún tươi Safoco" }]);
    expect(substitutionNotices(query, plan)).toEqual([]);
  });

  it("không báo gì cho câu không có đặc tả", () => {
    const plan = planWith([{ requestedName: "cá", productName: "Cá diêu hồng" }]);
    expect(substitutionNotices("nấu lẩu cá", plan)).toEqual([]);
  });
});
