import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Fetch from gateway-latest to get the snapshot from KiloClaw
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const url = baseUrl ? `${baseUrl}/.netlify/functions/gateway-latest` : "/.netlify/functions/gateway-latest";
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({ ok: false, error: "invalid json" }));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "fetch error" }, { status: 500 });
  }
}
