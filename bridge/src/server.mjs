import http from "node:http";
import { spawn } from "node:child_process";

const PORT = Number(process.env.CC_BRIDGE_PORT || 8787);
const BIND = process.env.CC_BRIDGE_BIND || "127.0.0.1";
const TOKEN = process.env.CC_BRIDGE_TOKEN || "";

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(body);
}

function unauthorized(res) {
  return json(res, 401, { ok: false, error: "unauthorized" });
}

function run(cmd, args, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));

    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ code: code ?? -1, out, err });
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (TOKEN) {
      const auth = String(req.headers.authorization || "");
      if (auth !== `Bearer ${TOKEN}`) return unauthorized(res);
    }

    if (req.method !== "GET") {
      return json(res, 405, { ok: false, error: "method not allowed" });
    }

    if (url.pathname === "/health") {
      const r = await run("openclaw", ["health", "--json"], 10000);
      if (r.code !== 0) return json(res, 500, { ok: false, error: r.err || r.out });
      return json(res, 200, { ok: true, health: JSON.parse(r.out) });
    }

    if (url.pathname === "/sessions") {
      const r = await run("openclaw", ["sessions", "--json"], 10000);
      if (r.code !== 0) return json(res, 500, { ok: false, error: r.err || r.out });
      return json(res, 200, { ok: true, sessions: JSON.parse(r.out) });
    }

    if (url.pathname === "/logs") {
      const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") || 200)));
      const r = await run("openclaw", ["logs", "--json", "--limit", String(limit)], 15000);
      if (r.code !== 0) return json(res, 500, { ok: false, error: r.err || r.out });
      const lines = r.out
        .split(/\r?\n/)
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return { raw: l };
          }
        });
      return json(res, 200, { ok: true, lines });
    }

    return json(res, 404, { ok: false, error: "not found" });
  } catch (e) {
    return json(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

server.listen(PORT, BIND, () => {
  console.log(`[cc-bridge] listening on http://${BIND}:${PORT}`);
});
