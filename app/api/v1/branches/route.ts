import { NextResponse } from "next/server";
import { clearBranchCache, getBranches } from "@/lib/server/branches";

// GET /api/v1/branches — real store branches in Da Nang from OpenStreetMap.
// Lets the map route to the branch NEAREST the user instead of one hardcoded
// coordinate per chain. Logic + cache live in lib/server/branches.ts.

export const runtime = "nodejs";

export type { Branch } from "@/lib/server/branches";

export async function GET(request: Request) {
  // ?refresh=1 busts the in-memory cache (use after running the sync scripts).
  if (new URL(request.url).searchParams.get("refresh") === "1") {
    clearBranchCache();
  }
  const branches = await getBranches();
  if (branches.length === 0) {
    // Best-effort: the map falls back to the static per-chain coordinate.
    return NextResponse.json(
      { branches, error: "Không lấy được danh sách chi nhánh (OpenStreetMap)." },
      { status: 200 },
    );
  }
  return NextResponse.json({ branches });
}
