import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    // Try to get logs from gateway-latest snapshot (pushed from KiloClaw)
    const snapshotRes = await fetch("/.netlify/functions/gateway-latest", { cache: "no-store" });
    const snapshotText = await snapshotRes.text();
    let snapshot;
    try {
      snapshot = JSON.parse(snapshotText);
    } catch {
      return NextResponse.json({ ok: true, lines: [], note: "no snapshot data yet" });
    }

    if (snapshot?.ok && snapshot?.snapshot?.openclaw?.gatewayLogsText) {
      // Parse the log text into lines
      const logText = snapshot.snapshot.openclaw.gatewayLogsText;
      const lines = logText
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-200)
        .map((line: string) => ({ raw: line }));
      return NextResponse.json({ ok: true, lines });
    }

    // Fallback: no logs available yet
    return NextResponse.json({ ok: true, lines: [], note: "waiting for first snapshot from KiloClaw" });
  } catch (e) {
    return NextResponse.json({ ok: true, lines: [], error: e instanceof Error ? e.message : "unknown error" });
  }
}
