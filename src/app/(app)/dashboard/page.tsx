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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function StatusPanel() {
  const data = await getStatusData();

  if (!data.ok) {
    return <div className="text-amber-300">Snapshot error: {data.error}</div>;
  }

  if (!data.snapshot) {
    return <div className="text-zinc-400">{data.note || "Waiting for first snapshot from KiloClaw..."}</div>;
  }

  const snap = data.snapshot;
  const ts = Number(snap.ts) || 0;
  const host = String(snap.host || "unknown");
  const hostStats = snap.hostStats as Record<string, unknown> | undefined;
  const uptime = hostStats?.uptimeSec as number | undefined;
  const load1 = hostStats?.load1 as number | undefined;
  const memAvailMb = hostStats?.memAvailMb as number | undefined;
  const memTotalMb = hostStats?.memTotalMb as number | undefined;
  const gatewayStatus = snap.openclaw?.gatewayStatusText as string | undefined;

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-zinc-400">Host</span>
        <span className="font-mono text-zinc-200">{host}</span>
      </div>
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-zinc-400">Uptime</span>
        <span className="font-mono text-zinc-200">{uptime ? formatUptime(uptime) : "—"}</span>
      </div>
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-zinc-400">Load</span>
        <span className="font-mono text-zinc-200">
          {load1 !== undefined ? load1.toFixed(2) : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-zinc-400">Memory</span>
        <span className="font-mono text-zinc-200">
          {memAvailMb !== undefined && memTotalMb !== undefined 
            ? `${(((memTotalMb - memAvailMb) / memTotalMb) * 100).toFixed(1)}%`
            : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-zinc-400">Gateway</span>
        <span className="font-mono text-green-400">{gatewayStatus || "connected"}</span>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-zinc-400">Last snapshot</span>
        <span className="font-mono text-zinc-300">{ts ? formatTimestamp(ts) : "—"}</span>
      </div>
    </div>
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

  // Check if snapshot exists at all
  const hasSnapshot = data.sessions !== undefined || data.cron !== undefined || data.subagents !== undefined;
  
  // Check if there's actual data
  const hasEntries = data.sessions.length > 0 || data.cron.length > 0 || data.subagents.length > 0;
  
  // No snapshot at all - show "snapshot unavailable"
  if (!hasSnapshot) {
    return <div className="text-zinc-400">Snapshot unavailable</div>;
  }
  
  // Snapshot exists but no sessions/cron/subagents data - show "no sessions in current snapshot"
  if (!hasEntries) {
    return <div className="text-zinc-400">No sessions in current snapshot</div>;
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
