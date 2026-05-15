import { NextRequest, NextResponse } from "next/server";
import { getAuthConfig } from "../../../lib/auth/config";
import { verifyPassword } from "../../../lib/auth/password";
import {
  buildLoginRateLimitKey,
  checkLoginRateLimit,
  clearLoginFailures,
  recordLoginFailure,
} from "../../../lib/auth/rateLimit";
import { buildSessionCookieOptions, createSessionToken } from "../../../lib/auth/session";

export const runtime = "nodejs";

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.headers.get("x-real-ip") || "unknown";
}

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
  const rateLimitKey = buildLoginRateLimitKey(getClientIp(req), username);
  const rateLimitConfig = {
    maxAttempts: config.loginMaxAttempts,
    windowSeconds: config.loginWindowSeconds,
    lockSeconds: config.loginLockSeconds,
  };
  const rateLimit = checkLoginRateLimit(rateLimitKey, rateLimitConfig);

  if (rateLimit.limited) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many login attempts. Try again later.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const validPassword = await verifyPassword(password, config.passwordHash);

  if (username !== config.username || !validPassword) {
    recordLoginFailure(rateLimitKey, rateLimitConfig);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      },
      { status: 401 }
    );
  }

  clearLoginFailures(rateLimitKey);
  const token = await createSessionToken(config.username, config.secret, config.ttlSeconds);
  const res = NextResponse.json({ ok: true, user: { name: config.username } });
  res.cookies.set(config.cookieName, token, buildSessionCookieOptions(config.ttlSeconds));
  return res;
}
