import { getStore } from "@netlify/blobs";

const STORE_NAME = "gateway-observability";
const LIMIT_DEFAULT = 50;

export default async (request) => {
  const store = getStore(STORE_NAME);
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || LIMIT_DEFAULT)));

  const listed = await store.list({ prefix: "snapshots/" });
  const keys = (listed?.blobs || []).map((b) => b.key).sort().reverse().slice(0, limit);

  const snaps = await Promise.all(keys.map((k) => store.get(k, { type: "json" })));
  return new Response(JSON.stringify({ ok: true, snapshots: snaps.filter(Boolean) }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
};
