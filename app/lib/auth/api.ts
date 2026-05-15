import { NextRequest, NextResponse } from "next/server";
import { getAuthConfig } from "./config";
import { verifySessionToken } from "./session";

export type ApiAuthResult =
  | { ok: true; via: "disabled" | "session" | "bearer" }
  | { ok: false; response: NextResponse };

function constantTimeEqualString(a: string, b: string) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  if (aBytes.length !== bBytes.length) return false;

  let diff = 0;
  for (let index = 0; index < aBytes.length; index += 1) {
    diff |= aBytes[index] ^ bBytes[index];
  }

  return diff === 0;
}

function unauthorized() {
  return NextResponse.json(
    { error: { code: "AUTH_REQUIRED", message: "Authentication required" } },
    { status: 401 }
  );
}

export async function requireApiAuth(req: NextRequest): Promise<ApiAuthResult> {
  const config = getAuthConfig();

  if (!config.enabled) {
    return { ok: true, via: "disabled" };
  }

  if (config.configured && config.secret) {
    const token = req.cookies.get(config.cookieName)?.value;
    const session = await verifySessionToken(token, config.secret);
    if (session.ok) {
      return { ok: true, via: "session" };
    }
  }

  const expectedBearer = config.smokeAuthToken;
  const authHeader = req.headers.get("authorization") || "";
  const [scheme, providedBearer] = authHeader.split(" ");

  if (
    expectedBearer &&
    scheme === "Bearer" &&
    providedBearer &&
    constantTimeEqualString(providedBearer, expectedBearer)
  ) {
    return { ok: true, via: "bearer" };
  }

  return { ok: false, response: unauthorized() };
}
