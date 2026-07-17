// Server-only: NER extraction via an external LLM (Google Gemini by default).
// This is the DISCLOSED "api" provider — the UI/Inspector label results as
// coming from an external API, distinct from the self-trained "self" model.
import type { NerResponse } from "@/lib/shared/types";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SYSTEM_PROMPT = `Bạn là bộ trích xuất thông tin mua sắm cho ứng dụng Gomgom (tiếng Việt).
Cho một câu yêu cầu, trả về DUY NHẤT một JSON object (không giải thích) theo schema:
{
  "ingredients": [{"name": string, "quantity": number|null, "unit": string|null, "category": string|null}],
  "exclusions": [string],
  "serving_size": number,
  "city": string
}
Quy tắc:
- Nếu là món ăn, liệt kê các NGUYÊN LIỆU cần mua (không liệt kê dụng cụ nấu).
- exclusions: nguyên liệu người dùng nói KHÔNG dùng.
- serving_size: số người, mặc định 1 nếu không nói.
- city: thành phố nếu có, mặc định "Đà Nẵng".
- category ví dụ: "thịt", "tinh bột", "rau", "gia vị".`;

interface ApiResult extends NerResponse {
  _raw: unknown;
  source: "api";
  provider: string;
}

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Call Gemini to extract the shopping schema. Throws on config/HTTP errors. */
export async function extractWithApi(text: string): Promise<ApiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY cho provider API.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    throw new Error("Dịch vụ API ngoài tạm thời gặp sự cố. Vui lòng thử lại.");
  }

  const data = await res.json();
  const raw: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = extractJson(raw);
  if (!parsed) {
    throw new Error("API ngoài trả về dữ liệu không hợp lệ.");
  }

  return {
    ingredients: Array.isArray(parsed.ingredients) ? (parsed.ingredients as NerResponse["ingredients"]) : [],
    exclusions: Array.isArray(parsed.exclusions) ? (parsed.exclusions as string[]) : [],
    serving_size: typeof parsed.serving_size === "number" ? parsed.serving_size : 1,
    city: typeof parsed.city === "string" ? parsed.city : "Đà Nẵng",
    _raw: parsed,
    source: "api",
    provider: GEMINI_MODEL,
  };
}
