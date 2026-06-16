import { NextResponse } from "next/server";
import { sanitizeUserText } from "@/lib/shared/sanitize";
import type { NerResponse } from "@/lib/shared/types";

// POST /api/v1/ner — Sprint 1 stub (spec §2.3, FR-03, NFR-35).
// Proxies to the fine-tuned Gemma NER endpoint once GEMMA_NER_URL is configured;
// otherwise returns a deterministic mock so the frontend can develop in parallel.

export const runtime = "nodejs";

const MOCK_RESPONSE: NerResponse = {
  ingredients: [
    { name: "Xương bò", quantity: 1, unit: "kg", category: "thịt" },
    { name: "Bún tươi", quantity: 800, unit: "g", category: "tinh bột" },
    { name: "Sả", quantity: 3, unit: "cây", category: "gia vị" },
  ],
  exclusions: ["Hành tây"],
  serving_size: 4,
  city: "Da Nang",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body không phải JSON hợp lệ." },
      { status: 400 },
    );
  }

  const { text } = (body ?? {}) as { text?: unknown };
  const sanitized = sanitizeUserText(text);
  if (!sanitized.ok) {
    return NextResponse.json({ error: sanitized.error }, { status: 400 });
  }

  const endpoint = process.env.GEMMA_NER_URL;
  if (!endpoint) {
    // No model configured yet — return the mock (Sprint 1).
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
        { error: "Dịch vụ NER tạm thời không khả dụng. Vui lòng thử lại." },
        { status: 502 },
      );
    }

    const data = (await upstream.json()) as NerResponse;
    return NextResponse.json(data, { status: 200 });
  } catch {
    // NFR-08/NFR-25: human-readable error, no raw stack traces.
    return NextResponse.json(
      { error: "Không thể kết nối dịch vụ NER. Vui lòng thử lại." },
      { status: 502 },
    );
  }
}
