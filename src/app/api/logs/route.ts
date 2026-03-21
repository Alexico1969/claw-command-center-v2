import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // In Netlify prod, logs come from the private bridge via a Netlify function.
  // In local dev, you can still point CC_BRIDGE_BASE_URL at your bridge.
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") || "200";

  const res = await fetch(`${process.env.CC_PUBLIC_BRIDGE_PROXY ?? "/.netlify/functions/bridge-proxy"}/logs?limit=${encodeURIComponent(limit)}`,
    { cache: "no-store" },
  );

  const data = await res.json().catch(() => ({ ok: false, error: "bad json" }));
  return NextResponse.json(data, { status: res.status });
}
