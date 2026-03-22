export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
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

  const { message, severity = "info" } = body;
  
  // Discord embed colors by severity
  const colors = {
    info: 3447003,    // Blue
    warning: 16776960, // Yellow
    error: 15158332,   // Red
    success: 3066993  // Green
  };

  const embed = {
    embeds: [{
      title: `🚨 OpenClaw Alert: ${severity.toUpperCase()}`,
      description: message || "No message provided",
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
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}