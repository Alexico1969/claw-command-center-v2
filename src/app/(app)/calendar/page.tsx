import { Suspense } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  date: string;
};

// Sample events for the next 7 days (safe defaults)
function getSampleEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();
  
  // Generate some sample events for the next 7 days
  const sampleTitles = [
    "Team Standup",
    "Sprint Planning",
    "Code Review",
    "One-on-One",
    "Product Demo",
    "Architecture Review",
    "Bug Triage"
  ];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Add 1-2 events per day
    const numEvents = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < numEvents; j++) {
      const hour = 9 + Math.floor(Math.random() * 8); // 9am - 5pm
      const title = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
      events.push({
        id: `${dateStr}-${j}`,
        title,
        startTime: `${hour}:00`,
        endTime: `${hour + 1}:00`,
        location: Math.random() > 0.5 ? "Conference Room A" : "Zoom",
        date: dateStr
      });
    }
  }
  
  return events.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });
}

function CalendarPanel() {
  const events = getSampleEvents();
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return "Today";
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
                  {event.startTime} - {event.endTime}
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
        Safe defaults shown. Connect to Notion or another calendar source for real events.
      </div>
    </div>
  );
}