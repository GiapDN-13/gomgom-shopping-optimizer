import {
  normalizeVi,
  sourceToStoreCode,
  keywordsFor,
  matchesWholeWords,
  KEYWORDS,
} from "@/lib/server/productSearch";

describe("normalizeVi", () => {
  it("strips Vietnamese diacritics and lowercases", () => {
    expect(normalizeVi("Thịt Bò Bắp")).toBe("thit bo bap");
    expect(normalizeVi("Sả cây")).toBe("sa cay");
  });

  it("handles đ/Đ (not covered by NFD)", () => {
    expect(normalizeVi("Đậu hũ")).toBe("dau hu");
    expect(normalizeVi("đường")).toBe("duong");
  });

  it("matches the DB name_normalized convention", () => {
    expect(normalizeVi("Dầu Gội Nam Sạch Gàu")).toBe("dau goi nam sach gau");
  });
});

describe("sourceToStoreCode", () => {
  it("maps DB sources to app store codes", () => {
    expect(sourceToStoreCode("bhx")).toBe("bhx");
    expect(sourceToStoreCode("mm")).toBe("mm");
    expect(sourceToStoreCode("lotte")).toBe("lotte");
    expect(sourceToStoreCode("winmart")).toBe("winmart");
  });

  it("maps DB 'go' to app 'gobigc'", () => {
    expect(sourceToStoreCode("go")).toBe("gobigc");
  });

  it("returns null for unknown sources", () => {
    expect(sourceToStoreCode("nam_sai_gon")).toBeNull();
    expect(sourceToStoreCode("")).toBeNull();
  });
});

describe("matchesWholeWords", () => {
  it("matches the keyword at word boundaries", () => {
    expect(matchesWholeWords("bun tuoi soi nho", "bun")).toBe(true);
    expect(matchesWholeWords("thit bo vien khay", "thit bo")).toBe(true);
  });

  it("rejects mid-word substring hits (the Bunapi bug)", () => {
    expect(matchesWholeWords("nam bunapi biovegi hop", "bun")).toBe(false);
    expect(matchesWholeWords("sachet gia vi", "sa")).toBe(false);
  });

  it("handles null and start/end positions", () => {
    expect(matchesWholeWords(null, "bun")).toBe(false);
    expect(matchesWholeWords("bun bo hue", "bun")).toBe(true);
    expect(matchesWholeWords("mi kho tron bun", "bun")).toBe(true);
  });
});

describe("keywordsFor", () => {
  it("uses the curated keyword list for known ingredient keys", () => {
    expect(keywordsFor({ key: "beef", name: "Thịt bò" })).toEqual(KEYWORDS.beef);
  });

  it("falls back to the normalized display name for unknown keys", () => {
    expect(keywordsFor({ key: "sau_rieng", name: "Sầu riêng" })).toEqual(["sau rieng"]);
  });

  it("returns empty for blank names on unknown keys", () => {
    expect(keywordsFor({ key: "x", name: "   " })).toEqual([]);
  });
});
