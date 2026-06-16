import {
  htmlEncode,
  sanitizeUserText,
  MAX_INPUT_LENGTH,
} from "@/lib/shared/sanitize";

describe("htmlEncode", () => {
  it("encodes HTML-significant characters", () => {
    expect(htmlEncode('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("preserves Vietnamese diacritics", () => {
    expect(htmlEncode("Tôi ở Đà Nẵng")).toBe("Tôi ở Đà Nẵng");
  });
});

describe("sanitizeUserText", () => {
  it("rejects non-strings", () => {
    expect(sanitizeUserText(123).ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(sanitizeUserText("   ").ok).toBe(false);
  });

  it("rejects input over the max length", () => {
    const result = sanitizeUserText("a".repeat(MAX_INPUT_LENGTH + 1));
    expect(result.ok).toBe(false);
    expect(result.error).toContain(String(MAX_INPUT_LENGTH));
  });

  it("accepts and encodes valid input", () => {
    const result = sanitizeUserText("nấu bún bò <b>cho 4</b>");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("nấu bún bò &lt;b&gt;cho 4&lt;/b&gt;");
  });
});
