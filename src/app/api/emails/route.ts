import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getUnreadEmailsData } from "@/lib/server/productivity";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const data = await getUnreadEmailsData();
  return NextResponse.json(data, { status: data.ok ? 200 : 500 });
}
