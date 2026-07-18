import { NextResponse } from "next/server";

// GET /api/v1/monitoring — proxies the NER service's gate-decision log so the
// dashboard can show honestly which backend (self-trained model vs Ckey API)
// answered each request. The internal service URL never reaches the client.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const endpoint = process.env.GEMMA_NER_URL;
  if (!endpoint) {
    return NextResponse.json(
      { error: "Chưa cấu hình dịch vụ NER (GEMMA_NER_URL)." },
      { status: 503 },
    );
  }

  let origin: string;
  try {
    origin = new URL(endpoint).origin; // GEMMA_NER_URL points at .../extract
  } catch {
    return NextResponse.json({ error: "GEMMA_NER_URL không hợp lệ." }, { status: 503 });
  }

  try {
    const [statsRes, recentRes, healthRes] = await Promise.all([
      fetch(`${origin}/monitor/stats`, { cache: "no-store" }),
      fetch(`${origin}/monitor/recent?n=50`, { cache: "no-store" }),
      fetch(`${origin}/health`, { cache: "no-store" }),
    ]);
    if (!statsRes.ok || !recentRes.ok) {
      return NextResponse.json(
        { error: "Dịch vụ NER không trả được dữ liệu monitoring." },
        { status: 502 },
      );
    }
    const [stats, recent, health] = await Promise.all([
      statsRes.json(),
      recentRes.json(),
      healthRes.ok ? healthRes.json() : Promise.resolve(null),
    ]);
    return NextResponse.json({ stats, recent: recent.entries ?? [], health }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối dịch vụ NER. Hãy chắc chắn service đang chạy." },
      { status: 502 },
    );
  }
}
