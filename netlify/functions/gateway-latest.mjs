import { getStore } from "@netlify/blobs";

const STORE_NAME = "gateway-observability";

export default async (request) => {
  const store = getStore(STORE_NAME);
  
  const latest = await store.get("latest.json", { type: "json" });
  
  if (!latest) {
    return new Response(JSON.stringify({ ok: false, error: "no snapshot found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  
  return new Response(JSON.stringify({ ok: true, snapshot: latest }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
};
