import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Use gateway-latest to get the snapshot from KiloClaw
  try {
    const res = await fetch("/.netlify/functions/gateway-latest", { cache: "no-store" });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid json from gateway-latest", raw: text.slice(0, 200) }, { status: 500 });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "fetch error" }, { status: 500 });
  }
}
