import { NextRequest, NextResponse } from "next/server";
import { getAuthConfig } from "../../../lib/auth/config";
import { verifyPassword } from "../../../lib/auth/password";
import { buildSessionCookieOptions, createSessionToken } from "../../../lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const config = getAuthConfig();

  if (!config.enabled) {
    return NextResponse.json(
      { ok: false, error: { code: "AUTH_DISABLED", message: "Auth is disabled" } },
      { status: 400 }
    );
  }

  if (!config.configured || !config.username || !config.passwordHash || !config.secret) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "AUTH_CONFIG_ERROR",
          message: "Auth is enabled but not fully configured",
        },
      },
      { status: 500 }
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const validPassword = await verifyPassword(password, config.passwordHash);

  if (username !== config.username || !validPassword) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      },
      { status: 401 }
    );
  }

  const token = await createSessionToken(config.username, config.secret, config.ttlSeconds);
  const res = NextResponse.json({ ok: true, user: { name: config.username } });
  res.cookies.set(config.cookieName, token, buildSessionCookieOptions(config.ttlSeconds));
  return res;
}
