import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";
import { z } from "zod";

const STORE_NAME = "agent-productivity";
const MAX_SNAPSHOTS = 50;

export const dynamic = "force-dynamic";

const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  date: z.string(),
  description: z.string().optional(),
  htmlLink: z.string().optional(),
});

const emailSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  subject: z.string(),
  from: z.string(),
  snippet: z.string().optional(),
  receivedAt: z.string(),
  htmlLink: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

const snapshotSchema = z.object({
  ts: z.number().int().positive().optional(),
  source: z.string().optional(),
  calendar: z
    .object({
      windowDays: z.number().int().positive().optional(),
      events: z.array(calendarEventSchema).default([]),
    })
    .optional(),
  emails: z
    .object({
      unread: z.array(emailSchema).default([]),
    })
    .optional(),
});

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const token = process.env.PRODUCTIVITY_INGEST_TOKEN;
  if (token && token.length > 0) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${token}`) return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = snapshotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const ts = parsed.data.ts ?? Math.floor(Date.now() / 1000);
  const snapshot = {
    ...parsed.data,
    ts,
    calendar: parsed.data.calendar ?? { windowDays: 7, events: [] },
    emails: parsed.data.emails ?? { unread: [] },
  };

  const store = getStore(STORE_NAME);
  await store.set("latest.json", JSON.stringify(snapshot), {
    metadata: { ts: String(ts) },
  });

  const key = `snapshots/${ts}.json`;
  await store.set(key, JSON.stringify(snapshot), {
    metadata: { ts: String(ts) },
  });

  try {
    const listed = await store.list({ prefix: "snapshots/" });
    const keys = (listed?.blobs || []).map((blob) => blob.key).sort();
    const extra = keys.length - MAX_SNAPSHOTS;

    if (extra > 0) {
      await Promise.all(keys.slice(0, extra).map((oldKey) => store.delete(oldKey)));
    }
  } catch {
    // Best-effort trimming only.
  }

  return NextResponse.json({ ok: true, stored: key });
}
