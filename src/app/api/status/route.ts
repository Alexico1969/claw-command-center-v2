import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const proxy = process.env.CC_PUBLIC_BRIDGE_PROXY ?? "/.netlify/functions/bridge-proxy";
  const res = await fetch(`${proxy}/health`, { cache: "no-store" });
  const data = await res.json().catch(() => ({ ok: false, error: "bad json" }));
  return NextResponse.json(data, { status: res.status });
}
