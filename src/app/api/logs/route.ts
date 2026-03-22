import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getLogsData } from "@/lib/server/openclaw";

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit") ?? "200");
  const data = await getLogsData(Number.isFinite(limitParam) ? limitParam : 200);
  return NextResponse.json(data, { status: data.ok ? 200 : 500 });
}
