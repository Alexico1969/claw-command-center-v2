import { Suspense } from "react";
import {
  getLogsData,
  getProcessesData,
  getStatusData,
  type LogLine,
} from "@/lib/server/openclaw";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="mt-3 text-sm text-zinc-200">{children}</div>
    </div>
  );
}

async function StatusPanel() {
  const data = await getStatusData();

  if (!data.ok) {
    return <div className="text-amber-300">Snapshot error: {data.error}</div>;
  }

  if (!data.snapshot) {
    return <div className="text-zinc-400">{data.note || "Waiting for first snapshot from KiloClaw..."}</div>;
  }

  return (
    <pre className="max-h-[220px] overflow-auto rounded-lg border border-zinc-800 bg-black/30 p-3 text-xs text-zinc-300">
      {JSON.stringify(data.snapshot, null, 2)}
    </pre>
  );
}

async function LogsPanel() {
  const data = await getLogsData(200);

  if (!data.ok) {
    return <div className="text-amber-300">Logs error: {data.error}</div>;
  }

  if (data.lines.length === 0) {
    return <div className="text-zinc-400">{data.note || "Waiting for logs from KiloClaw..."}</div>;
  }

  const lines = data.lines
    .map((line: LogLine) => {
      if (line.raw) return String(line.raw);
      const msg = line.msg ?? line.message ?? JSON.stringify(line);
      const time = line.time ?? line.timestamp ?? "";
      const level = line.level ?? line.logLevelName ?? "";
      return `${time} ${level} ${msg}`.trim();
    })
    .slice(-200);

  return (
    <pre className="max-h-[420px] overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-200">
      {lines.join("\n")}
    </pre>
  );
}

async function ProcessesPanel() {
  const data = await getProcessesData();

  if (!data.ok) {
    return <div className="text-amber-300">Processes error: {data.error}</div>;
  }

  const hasEntries = data.sessions.length > 0 || data.cron.length > 0 || data.subagents.length > 0;
  if (!hasEntries) {
    return <div className="text-zinc-400">{data.note || "Waiting for data from KiloClaw..."}</div>;
  }

  return (
    <div className="space-y-4 text-xs">
      {data.sessions.length ? (
        <div>
          <div className="mb-1 font-semibold text-zinc-300">Sessions ({data.sessions.length})</div>
          <pre className="max-h-[80px] overflow-auto rounded border border-zinc-800 bg-black/30 p-2 text-zinc-400">
            {JSON.stringify(data.sessions, null, 2)}
          </pre>
        </div>
      ) : null}

      {data.cron.length ? (
        <div>
          <div className="mb-1 font-semibold text-zinc-300">Cron Jobs ({data.cron.length})</div>
          <pre className="max-h-[80px] overflow-auto rounded border border-zinc-800 bg-black/30 p-2 text-zinc-400">
            {JSON.stringify(data.cron, null, 2)}
          </pre>
        </div>
      ) : null}

      {data.subagents.length ? (
        <div>
          <div className="mb-1 font-semibold text-zinc-300">Subagents ({data.subagents.length})</div>
          <pre className="max-h-[80px] overflow-auto rounded border border-zinc-800 bg-black/30 p-2 text-zinc-400">
            {JSON.stringify(data.subagents, null, 2)}
          </pre>
        </div>
      ) : null}
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
          <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
            <StatusPanel />
          </Suspense>
        </Card>

        <Card title="Background sessions">
          <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
            <ProcessesPanel />
          </Suspense>
        </Card>
      </div>

      <Card title="Gateway logs (tail)">
        <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
          <LogsPanel />
        </Suspense>
      </Card>

      <div className="text-xs text-zinc-500">
        Extend by adding new endpoints under <span className="font-mono">src/app/api/*</span> and new panels here.
      </div>
    </div>
  );
}
