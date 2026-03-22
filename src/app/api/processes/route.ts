import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

// Get sessions, cron, and subagents from the snapshot pushed by KiloClaw
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const url = baseUrl ? `${baseUrl}/.netlify/functions/gateway-latest` : "/.netlify/functions/gateway-latest";
    const snapshotRes = await fetch(url, { cache: "no-store" });
    const snapshotText = await snapshotRes.text();
    let snapshot;
    try {
      snapshot = JSON.parse(snapshotText);
    } catch {
      return NextResponse.json({ ok: true, sessions: [], cron: [], subagents: [], note: "no snapshot data yet" });
    }

    if (snapshot?.ok && snapshot?.snapshot?.openclaw) {
      const { sessions, cron, subagents } = snapshot.snapshot.openclaw;
      return NextResponse.json({ 
        ok: true, 
        sessions: typeof sessions === 'string' ? JSON.parse(sessions) : (sessions || []),
        cron: typeof cron === 'string' ? JSON.parse(cron) : (cron || []),
        subagents: typeof subagents === 'string' ? JSON.parse(subagents) : (subagents || [])
      });
    }

    return NextResponse.json({ ok: true, sessions: [], cron: [], subagents: [], note: "waiting for data from KiloClaw" });
  } catch (e) {
    return NextResponse.json({ ok: true, sessions: [], cron: [], subagents: [], error: e instanceof Error ? e.message : "unknown error" });
  }
}
