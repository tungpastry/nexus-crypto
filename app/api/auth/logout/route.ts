import { NextResponse } from "next/server";
import { getAuthConfig } from "../../../lib/auth/config";
import { buildSessionCookieOptions } from "../../../lib/auth/session";

export async function POST() {
  const config = getAuthConfig();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(config.cookieName, "", buildSessionCookieOptions(0));
  return res;
}
