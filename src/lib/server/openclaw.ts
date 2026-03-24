import { getStore } from "@netlify/blobs";

const STORE_NAME = "gateway-observability";
const DEFAULT_NOTE = "Waiting for first snapshot from KiloClaw...";
const LOGS_NOTE = "Waiting for logs from KiloClaw...";
const PROCESSES_NOTE = "Waiting for data from KiloClaw...";

type JsonObject = Record<string, unknown>;

export type OpenClawSnapshot = JsonObject & {
  openclaw?: {
    gatewayLogsText?: string;
    gatewayStatusText?: string;
    sessions?: unknown[] | string;
    cron?: unknown[] | string;
    subagents?: unknown[] | string;
  };
};

export type SnapshotResult =
  | { ok: true; snapshot: OpenClawSnapshot | null; note?: string }
  | { ok: false; error: string };

export type LogLine = {
  raw?: string;
  msg?: string;
  message?: string;
  time?: string;
  timestamp?: string;
  level?: string;
  logLevelName?: string;
  source?: string;
};

export type LogsData =
  | { ok: true; lines: LogLine[]; note?: string }
  | { ok: false; error: string; lines: LogLine[] };

export type ProcessesData =
  | { ok: true; sessions: unknown[]; cron: unknown[]; subagents: unknown[]; note?: string }
  | { ok: false; error: string; sessions: unknown[]; cron: unknown[]; subagents: unknown[] };

function coerceArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function getLatestSnapshot(): Promise<SnapshotResult> {
  try {
    const store = getStore(STORE_NAME);
    const latest = await store.get("latest.json", { type: "json" });

    if (!latest || typeof latest !== "object") {
      return { ok: true, snapshot: null, note: DEFAULT_NOTE };
    }

    return { ok: true, snapshot: latest as OpenClawSnapshot };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to read OpenClaw snapshot",
    };
  }
}

export async function getStatusData(): Promise<SnapshotResult> {
  return getLatestSnapshot();
}

export async function getLogsData(limit = 200): Promise<LogsData> {
  const snapshotResult = await getLatestSnapshot();
  if (!snapshotResult.ok) {
    return { ok: false, error: snapshotResult.error, lines: [] };
  }

  const logText = snapshotResult.snapshot?.openclaw?.gatewayLogsText;
  if (!logText) {
    return { ok: true, lines: [], note: snapshotResult.note ?? LOGS_NOTE };
  }

  const lines = logText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        const meta = (parsed._meta as Record<string, unknown> | undefined) ?? undefined;
        const numericMessageParts = Object.keys(parsed)
          .filter((key) => /^\d+$/.test(key))
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => parsed[key])
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean);

        const msg =
          numericMessageParts.join(" ") ||
          (typeof parsed.message === "string" ? parsed.message : undefined) ||
          (typeof parsed.msg === "string" ? parsed.msg : undefined) ||
          undefined;

        return {
          raw: line,
          msg,
          message: typeof parsed.message === "string" ? parsed.message : undefined,
          time:
            typeof parsed.time === "string"
              ? parsed.time
              : typeof parsed.timestamp === "string"
                ? parsed.timestamp
                : typeof meta?.date === "string"
                  ? meta.date
                  : undefined,
          timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : undefined,
          level:
            typeof parsed.level === "string"
              ? parsed.level
              : typeof meta?.logLevelName === "string"
                ? meta.logLevelName
                : undefined,
          logLevelName: typeof meta?.logLevelName === "string" ? meta.logLevelName : undefined,
          source:
            typeof meta?.name === "string"
              ? meta.name
              : typeof meta?.runtime === "string"
                ? meta.runtime
                : undefined,
        } satisfies LogLine;
      } catch {
        return { raw: line } satisfies LogLine;
      }
    })
    .filter((line) => {
      const msg = line.msg ?? line.message ?? line.raw ?? "";
      return String(msg).trim().length > 0;
    })
    .slice(-Math.max(1, limit));

  return { ok: true, lines };
}

export async function getProcessesData(): Promise<ProcessesData> {
  const snapshotResult = await getLatestSnapshot();
  if (!snapshotResult.ok) {
    return { ok: false, error: snapshotResult.error, sessions: [], cron: [], subagents: [] };
  }

  const openclaw = snapshotResult.snapshot?.openclaw;
  if (!openclaw) {
    return {
      ok: true,
      sessions: [],
      cron: [],
      subagents: [],
      note: snapshotResult.note ?? PROCESSES_NOTE,
    };
  }

  return {
    ok: true,
    sessions: coerceArray(openclaw.sessions),
    cron: coerceArray(openclaw.cron),
    subagents: coerceArray(openclaw.subagents),
  };
}
