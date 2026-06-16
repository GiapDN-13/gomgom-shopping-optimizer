import { NextResponse } from "next/server";

// POST /api/v1/optimize — store filtering + ACO route optimization.
// Scaffold only; full implementation lands in Sprint 4 (FR-11..FR-15, NFR-02).

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Bộ tối ưu sẽ được triển khai ở Sprint 4." },
    { status: 501 },
  );
}
