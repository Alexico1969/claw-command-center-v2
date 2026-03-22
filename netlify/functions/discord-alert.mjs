export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const token = process.env.ALERTS_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "ALERTS_TOKEN not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${token}`) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response(JSON.stringify({ ok: false, error: "Discord webhook not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const severity = typeof body?.severity === "string" ? body.severity : "info";

  if (!message) {
    return new Response(JSON.stringify({ ok: false, error: "message is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const colors = {
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
      return new Response(JSON.stringify({ ok: false, error: "Discord API error", details: errorText }), {
        status: res.status,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "fetch error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
