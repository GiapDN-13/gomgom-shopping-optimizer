// Input sanitisation — NFR-18: max 500 chars, HTML-encoded before any rendered use.

export const MAX_INPUT_LENGTH = 500;

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** HTML-encode user text to neutralise injected markup. */
export function htmlEncode(input: string): string {
  return input.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c] ?? c);
}

export interface SanitizeResult {
  ok: boolean;
  value: string;
  error?: string;
}

/** Validate + sanitise free-text input before forwarding to external APIs. */
export function sanitizeUserText(raw: unknown): SanitizeResult {
  if (typeof raw !== "string") {
    return { ok: false, value: "", error: "Trường 'text' phải là chuỗi." };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, value: "", error: "Vui lòng nhập nội dung." };
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      value: "",
      error: `Nội dung vượt quá ${MAX_INPUT_LENGTH} ký tự.`,
    };
  }
  return { ok: true, value: htmlEncode(trimmed) };
}
