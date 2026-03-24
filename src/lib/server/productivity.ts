import { getStore } from "@netlify/blobs";

const STORE_NAME = "agent-productivity";
const DEFAULT_NOTE = "Waiting for the agent to sync calendar and email data...";
const CALENDAR_NOTE = "Waiting for calendar data from the agent...";
const EMAILS_NOTE = "Waiting for unread emails from the agent...";

export type ProductivityCalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  date: string;
  description?: string;
  htmlLink?: string;
};

export type ProductivityEmail = {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  snippet?: string;
  receivedAt: string;
  htmlLink?: string;
  labels?: string[];
};

export type ProductivitySnapshot = {
  ts: number;
  source?: string;
  calendar?: {
    windowDays?: number;
    events?: ProductivityCalendarEvent[];
  };
  emails?: {
    unread?: ProductivityEmail[];
  };
};

export type ProductivitySnapshotResult =
  | { ok: true; snapshot: ProductivitySnapshot | null; note?: string }
  | { ok: false; error: string };

export type CalendarDataResult =
  | { ok: true; events: ProductivityCalendarEvent[]; syncedAt?: number; note?: string }
  | { ok: false; error: string; events: ProductivityCalendarEvent[] };

export type EmailsDataResult =
  | { ok: true; unread: ProductivityEmail[]; syncedAt?: number; note?: string }
  | { ok: false; error: string; unread: ProductivityEmail[] };

export async function getLatestProductivitySnapshot(): Promise<ProductivitySnapshotResult> {
  try {
    const store = getStore(STORE_NAME);
    const latest = await store.get("latest.json", { type: "json" });

    if (!latest || typeof latest !== "object") {
      return { ok: true, snapshot: null, note: DEFAULT_NOTE };
    }

    return { ok: true, snapshot: latest as ProductivitySnapshot };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to read productivity snapshot",
    };
  }
}

export async function getCalendarEventsData(): Promise<CalendarDataResult> {
  const snapshotResult = await getLatestProductivitySnapshot();
  if (!snapshotResult.ok) {
    return { ok: false, error: snapshotResult.error, events: [] };
  }

  const events = snapshotResult.snapshot?.calendar?.events;
  if (!events) {
    return {
      ok: true,
      events: [],
      syncedAt: snapshotResult.snapshot?.ts,
      note: snapshotResult.note ?? CALENDAR_NOTE,
    };
  }

  return {
    ok: true,
    events,
    syncedAt: snapshotResult.snapshot?.ts,
  };
}

export async function getUnreadEmailsData(): Promise<EmailsDataResult> {
  const snapshotResult = await getLatestProductivitySnapshot();
  if (!snapshotResult.ok) {
    return { ok: false, error: snapshotResult.error, unread: [] };
  }

  const unread = snapshotResult.snapshot?.emails?.unread;
  if (!unread) {
    return {
      ok: true,
      unread: [],
      syncedAt: snapshotResult.snapshot?.ts,
      note: snapshotResult.note ?? EMAILS_NOTE,
    };
  }

  return {
    ok: true,
    unread,
    syncedAt: snapshotResult.snapshot?.ts,
  };
}
