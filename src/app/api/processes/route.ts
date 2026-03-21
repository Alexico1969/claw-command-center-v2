import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

// This is a minimal placeholder.
// In production, you should back this with a real process registry (DB/Sheet)
// or a server-side integration that queries OpenClaw (gateway RPC) safely.

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  return NextResponse.json({ ok: true, sessions: [] });
}
