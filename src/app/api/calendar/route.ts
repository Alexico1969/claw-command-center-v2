import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_API;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Google API not configured" }, { status: 500 });
  }

  // Get current time and time 7 days from now
  const now = new Date().toISOString();
  const future = new Date();
  future.setDate(future.getDate() + 7);
  const timeMax = future.toISOString();

  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/alexicoo@gmail.com/events?key=${apiKey}&timeMin=${now}&timeMax=${timeMax}&maxResults=20&singleEvents=true&orderBy=startTime`;
    
    const res = await fetch(url, { cache: "no-store" });
    
    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ ok: false, error: `Google API error: ${res.status}`, details: error }, { status: res.status });
    }
    
    const data = await res.json();
    
    // Transform to our format
    const events = (data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || "Untitled",
      startTime: event.start?.dateTime || event.start?.date,
      endTime: event.end?.dateTime || event.end?.date,
      location: event.location || event.conferenceData?.entryPoints?.[0]?.uri,
      date: (event.start?.date || event.start?.dateTime?.split('T')[0])
    })).filter((e: any) => e.startTime); // Filter out events without start time

    return NextResponse.json({ ok: true, events });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "fetch error" }, { status: 500 });
  }
}