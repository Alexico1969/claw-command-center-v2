import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Try to get logs from gateway-latest snapshot (pushed from KiloClaw)
  const snapshotRes = await fetch("/.netlify/functions/gateway-latest", { cache: "no-store" });
  const snapshot = await snapshotRes.json().catch(() => null);

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

  // Fallback: no logs available
  return NextResponse.json({ ok: true, lines: [] });
}
