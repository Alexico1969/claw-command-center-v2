import { Suspense } from "react";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

async function getJson<T = JsonValue>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="mt-3 text-sm text-zinc-200">{children}</div>
    </div>
  );
}

async function StatusPanel() {
  const data = await getJson<{ ok: boolean; snapshot?: unknown; note?: string }>("/api/status");
  
  if (!data.snapshot) {
    return <div className="text-zinc-400">Waiting for first snapshot from KiloClaw…</div>;
  }
  
  return (
    <pre className="max-h-[220px] overflow-auto rounded-lg bg-black/30 border border-zinc-800 p-3 text-xs text-zinc-300">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

type LogLine = { raw?: string; msg?: string; message?: string; time?: string; timestamp?: string; level?: string; logLevelName?: string };

async function LogsPanel() {
  const data = await getJson<{ ok: boolean; lines?: LogLine[]; note?: string }>("/api/logs?limit=200");
  
  if (!data.lines || data.lines.length === 0) {
    return <div className="text-zinc-400">{data.note || "Waiting for logs from KiloClaw…"}</div>;
  }

  const lines = data.lines
    .map((l) => {
      if (l?.raw) return String(l.raw);
      const msg = l?.msg ?? l?.message ?? JSON.stringify(l);
      const time = l?.time ?? l?.timestamp ?? "";
      const level = l?.level ?? l?.logLevelName ?? "";
      return `${time} ${level} ${msg}`.trim();
    })
    .slice(-200);

  return (
    <pre className="max-h-[420px] overflow-auto rounded-lg bg-black/40 border border-zinc-800 p-3 text-xs text-zinc-200">
      {lines.join("\n")}
    </pre>
  );
}

async function ProcessesPanel() {
  const data = await getJson("/api/processes");

  return (
    <div className="space-y-2">
      <div className="text-zinc-400">
        Coming next: show OpenClaw sessions/cron/subagents from the bridge.
      </div>
      <pre className="max-h-[220px] overflow-auto rounded-lg bg-black/30 border border-zinc-800 p-3 text-xs text-zinc-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Logs + running background processes. Designed to be extended.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Status">
          <Suspense fallback={<div className="text-zinc-400">Loading…</div>}>
            <StatusPanel />
          </Suspense>
        </Card>

        <Card title="Background sessions">
          <Suspense fallback={<div className="text-zinc-400">Loading…</div>}>
            <ProcessesPanel />
          </Suspense>
        </Card>
      </div>

      <Card title="Gateway logs (tail)">
        <Suspense fallback={<div className="text-zinc-400">Loading…</div>}>
          <LogsPanel />
        </Suspense>
      </Card>

      <div className="text-xs text-zinc-500">
        Extend by adding new endpoints under <span className="font-mono">src/app/api/*</span> and new panels here.
      </div>
    </div>
  );
}
