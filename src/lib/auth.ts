import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "cc_auth";

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME)?.value;
  // Stateless cookie check: value must match env secret.
  const secret = process.env.CC_PASSWORD;
  if (!secret) return false;
  return c === secret;
}

export async function requireAuth() {
  if (!(await isAuthed())) redirect("/login");
}

export const authCookieName = COOKIE_NAME;
