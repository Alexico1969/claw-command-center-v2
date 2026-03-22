import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ ok: false, error: "Discord webhook not configured" }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const { message, severity = "info" } = body;
  
  if (!message) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }

  // Discord embed colors by severity
  const colors: Record<string, number> = {
    info: 3447003,
    warning: 16776960,
    error: 15158332,
    success: 3066993
  };

  const embed = {
    embeds: [{
      title: `🚨 OpenClaw Alert: ${severity.toUpperCase()}`,
      description: message,
      color: colors[severity] || colors.info,
      timestamp: new Date().toISOString(),
      fields: [
        { name: "Source", value: "Command Center", inline: true },
        { name: "Severity", value: severity, inline: true }
      ]
    }]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(embed)
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ ok: false, error: "Discord API error", details: errorText }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "fetch error" }, { status: 500 });
  }
}