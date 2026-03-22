import { NextResponse } from "next/server";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const token = process.env.ALERTS_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "ALERTS_TOKEN not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${token}`) {
    return unauthorized();
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ ok: false, error: "Discord webhook not configured" }, { status: 500 });
  }

  let body: { message?: unknown; severity?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const severity = typeof body.severity === "string" ? body.severity : "info";

  if (!message) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }

  const colors: Record<string, number> = {
    info: 3447003,
    warning: 16776960,
    error: 15158332,
    success: 3066993,
  };

  const embed = {
    embeds: [
      {
        title: `OpenClaw Alert: ${severity.toUpperCase()}`,
        description: message,
        color: colors[severity] || colors.info,
        timestamp: new Date().toISOString(),
        fields: [
          { name: "Source", value: "Command Center", inline: true },
          { name: "Severity", value: severity, inline: true },
        ],
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(embed),
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
