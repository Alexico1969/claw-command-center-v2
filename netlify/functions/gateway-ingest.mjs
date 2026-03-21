import { getStore } from "@netlify/blobs";

const STORE_NAME = "gateway-observability";
const MAX_SNAPSHOTS = 50;

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const token = process.env.GATEWAY_INGEST_TOKEN || "";
  if (token) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${token}`) return unauthorized();
  }

  let snap;
  try {
    snap = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Minimal normalization
  const ts = Number(snap.ts || Math.floor(Date.now() / 1000));
  snap.ts = ts;

  const store = getStore(STORE_NAME);

  // Write latest + timeseries snapshot
  await store.set("latest.json", JSON.stringify(snap), {
    metadata: { ts: String(ts) },
  });

  const key = `snapshots/${ts}.json`;
  await store.set(key, JSON.stringify(snap), {
    metadata: { ts: String(ts) },
  });

  // Trim older snapshots (best effort)
  try {
    const listed = await store.list({ prefix: "snapshots/" });
    // listed.blobs: [{ key, ... }]
    const keys = (listed?.blobs || [])
      .map((b) => b.key)
      .sort(); // keys are timestamps -> lexicographic works if ts is numeric seconds

    const extra = keys.length - MAX_SNAPSHOTS;
    if (extra > 0) {
      const toDelete = keys.slice(0, extra);
      await Promise.all(toDelete.map((k) => store.delete(k)));
    }
  } catch {
    // ignore trimming failures (don’t fail ingest)
  }

  return new Response(JSON.stringify({ ok: true, stored: key }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
