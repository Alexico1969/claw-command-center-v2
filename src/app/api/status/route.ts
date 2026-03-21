import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Use gateway-latest to get the snapshot from KiloClaw
  const res = await fetch("/.netlify/functions/gateway-latest", { cache: "no-store" });
  const data = await res.json().catch(() => ({ ok: false, error: "bad json" }));
  return NextResponse.json(data, { status: res.status });
}
