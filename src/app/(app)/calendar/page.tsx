import { Suspense } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  date: string;
};

async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const res = await fetch("/api/calendar", { cache: "no-store" });
    const data = await res.json();
    
    console.log("Calendar API response:", JSON.stringify(data));
    
    if (!data.ok || !data.events) {
      console.error("Calendar API error:", data.error, data.details);
      return [];
    }
    
    return data.events.map((event: any) => {
      // Handle both date and dateTime formats
      const startDateTime = event.startTime;
      const endDateTime = event.endTime;
      
      // Extract date and time
      let date = event.date;
      let startTime = "";
      let endTime = "";
      
      if (startDateTime?.includes('T')) {
        const startParts = startDateTime.split('T');
        date = startParts[0];
        startTime = startParts[1]?.replace(/\.\d{3}/, '') || "";
      } else if (startDateTime) {
        date = startDateTime;
        startTime = "All day";
      }
      
      if (endDateTime?.includes('T')) {
        const endParts = endDateTime.split('T');
        endTime = endParts[1]?.replace(/\.\d{3}/, '') || "";
      } else if (endDateTime) {
        endTime = "";
      }
      
      return {
        id: event.id,
        title: event.title,
        startTime: startTime,
        endTime: endTime,
        location: event.location,
        date
      };
    });
  } catch (e) {
    console.error("Failed to fetch calendar events:", e);
    return [];
  }
}

function CalendarPanel() {
  // This will be rendered on the server and fetch real data
  return <CalendarEvents />;
}

async function CalendarEvents() {
  const events = await getCalendarEvents();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Filter to only show upcoming events (today + next 7 days)
  const upcomingEvents = events.filter(e => e.date >= today).slice(0, 10);
  
  // Group by date
  const eventsByDate = upcomingEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const todayDate = new Date();
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === todayDate.toISOString().split('T')[0]) return "Today";
    if (dateStr === tomorrow.toISOString().split('T')[0]) return "Tomorrow";
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {Object.entries(eventsByDate).map(([date, dayEvents]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">{formatDate(date)}</h3>
          <div className="space-y-2">
            {dayEvents.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                <div className="text-xs text-zinc-400 w-16">
                  {event.startTime || "All day"} {event.endTime ? `- ${event.endTime}` : ""}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-zinc-200">{event.title}</div>
                  {event.location && (
                    <div className="text-xs text-zinc-500">{event.location}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {upcomingEvents.length === 0 && (
        <div className="text-zinc-400">No upcoming events</div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="mt-1 text-sm text-zinc-400">Upcoming events for the next 7 days</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <Suspense fallback={<div className="text-zinc-400">Loading calendar…</div>}>
          <CalendarPanel />
        </Suspense>
      </div>

      <div className="text-xs text-zinc-500">
        Events from Google Calendar (alexicoo@gmail.com) - next 7 days
      </div>
    </div>
  );
}