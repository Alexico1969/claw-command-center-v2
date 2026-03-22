import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getStatusData } from "@/lib/server/openclaw";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const data = await getStatusData();
  return NextResponse.json(data, { status: data.ok ? 200 : 500 });
}
