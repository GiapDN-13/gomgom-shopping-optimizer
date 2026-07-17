import { NextResponse } from "next/server";
import { sanitizeUserText } from "@/lib/shared/sanitize";
import { extractWithApi } from "@/lib/services/nerApi";
import type { NerResponse } from "@/lib/shared/types";

// POST /api/v1/ner — dual-provider NER (spec §2.3, FR-03, NFR-35).
//   model="self" → the team's self-trained GPT-2 (via GEMMA_NER_URL)  [TensorFlow course artifact]
//   model="api"  → an external LLM (Gemini), clearly labeled as such    [product quality]
// Every response carries a `source` so the UI can label provenance honestly.

export const runtime = "nodejs";

const MOCK_RESPONSE: NerResponse & { source: string } = {
  ingredients: [
    { name: "Xương bò", quantity: 1, unit: "kg", category: "thịt" },
    { name: "Bún tươi", quantity: 800, unit: "g", category: "tinh bột" },
    { name: "Sả", quantity: 3, unit: "cây", category: "gia vị" },
  ],
  exclusions: ["Hành tây"],
  serving_size: 4,
  city: "Da Nang",
  source: "mock",
};

type ModelChoice = "self" | "api";

function pickDefault(): ModelChoice {
  // Prefer the external API when configured; else the self-trained model.
  if (process.env.GEMINI_API_KEY) return "api";
  return "self";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const { text, model } = (body ?? {}) as { text?: unknown; model?: unknown };
  const sanitized = sanitizeUserText(text);
  if (!sanitized.ok) {
    return NextResponse.json({ error: sanitized.error }, { status: 400 });
  }

  const choice: ModelChoice = model === "self" || model === "api" ? model : pickDefault();

  // --- external API provider (disclosed) ---
  if (choice === "api") {
    try {
      const result = await extractWithApi(sanitized.value);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Lỗi provider API." },
        { status: 502 },
      );
    }
  }

  // --- self-trained model (via Python service) ---
  const endpoint = process.env.GEMMA_NER_URL;
  if (!endpoint) {
    return NextResponse.json(MOCK_RESPONSE, { status: 200 });
  }
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.GEMMA_NER_API_KEY
          ? { Authorization: `Bearer ${process.env.GEMMA_NER_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ text: sanitized.value }),
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Dịch vụ NER tự train tạm thời không khả dụng. Vui lòng thử lại." },
        { status: 502 },
      );
    }
    const data = (await upstream.json()) as NerResponse;
    return NextResponse.json({ ...data, source: "self" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối dịch vụ NER tự train. Vui lòng thử lại." },
      { status: 502 },
    );
  }
}
