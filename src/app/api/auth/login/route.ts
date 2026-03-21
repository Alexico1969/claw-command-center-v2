import { NextResponse } from "next/server";
import { authCookieName } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password ?? "");

  const secret = process.env.CC_PASSWORD;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Server not configured (CC_PASSWORD missing)." },
      { status: 500 },
    );
  }

  if (password !== secret) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // Cookie-based auth (simple, stateless).
  // Note: with just one password, this is effectively a shared session.
  res.cookies.set(authCookieName, secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
