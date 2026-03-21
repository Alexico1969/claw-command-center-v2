import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // For now, return placeholder until KiloClaw pushes snapshots
  return NextResponse.json({ 
    ok: true, 
    lines: [],
    note: "Waiting for first snapshot from KiloClaw"
  });
}
