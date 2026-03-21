export default async function handler(request) {
  const baseUrl = process.env.CC_BRIDGE_BASE_URL;
  const token = process.env.CC_BRIDGE_TOKEN;
  if (!baseUrl || !token) {
    return new Response(JSON.stringify({ ok: false, error: "Bridge not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/\.netlify\/functions\/bridge-proxy/, "");
  const target = new URL(baseUrl.replace(/\/$/, "") + path + url.search);

  const res = await fetch(target, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
};
