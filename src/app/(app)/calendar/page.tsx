import { getCalendarEventsData, type ProductivityCalendarEvent } from "@/lib/server/productivity";

export const dynamic = "force-dynamic";

function formatEventTimes(event: ProductivityCalendarEvent) {
  const startDate = new Date(event.startTime);
  const endDate = event.endTime ? new Date(event.endTime) : null;

  if (Number.isNaN(startDate.getTime())) return event.startTime || "All day";

  const isAllDay = !event.startTime.includes("T");
  if (isAllDay) return "All day";

  const start = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!endDate || Number.isNaN(endDate.getTime())) return start;

  const end = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${start} - ${end}`;
}

function formatDateLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today.toISOString().split("T")[0]) return "Today";
  if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tomorrow";

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function CalendarPage() {
  const data = await getCalendarEventsData();
  const events = data.ok ? data.events : [];
  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter((event) => event.date >= today).slice(0, 20);
  const eventsByDate = upcomingEvents.reduce(
    (acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    },
    {} as Record<string, ProductivityCalendarEvent[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="mt-1 text-sm text-zinc-400">Upcoming events for the next 7 days, synced by the OpenClaw agent</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        {!data.ok ? <div className="text-amber-300">Calendar error: {data.error}</div> : null}
        {data.ok && data.note ? <div className="text-zinc-400">{data.note}</div> : null}
        {data.ok && !data.note ? (
          <div className="space-y-6">
            {Object.entries(eventsByDate).map(([date, dayEvents]) => (
              <div key={date}>
                <h3 className="mb-2 text-sm font-semibold text-zinc-300">{formatDateLabel(date)}</h3>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
                    >
                      <div className="w-28 text-xs text-zinc-400">{formatEventTimes(event)}</div>
                      <div className="flex-1">
                        <div className="text-sm text-zinc-200">{event.title}</div>
                        {event.location ? <div className="text-xs text-zinc-500">{event.location}</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {upcomingEvents.length === 0 ? <div className="text-zinc-400">No upcoming events</div> : null}
          </div>
        ) : null}
      </div>

      <div className="text-xs text-zinc-500">
        {data.ok && data.syncedAt
          ? `Last synced ${new Date(data.syncedAt * 1000).toLocaleString("en-US")}`
          : "Awaiting the next 7-day calendar snapshot from the agent"}
      </div>
    </div>
  );
}
