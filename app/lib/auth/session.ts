import { getAuthConfig } from "./config";

export type SessionVerifyResult =
  | { ok: true; username: string; exp: number }
  | { ok: false; reason: string };

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64url"));
  }

  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlEncodeJson(value: unknown) {
  return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

function base64UrlDecodeJson<T>(value: string): T {
  const bytes = base64UrlToBytes(value);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return new Uint8Array(signature);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}

export async function createSessionToken(
  username: string,
  secret: string,
  ttlSeconds: number
) {
  const now = Math.floor(Date.now() / 1_000);
  const payload: SessionPayload = {
    sub: username,
    iat: now,
    exp: now + ttlSeconds,
  };
  const encodedPayload = base64UrlEncodeJson(payload);
  const signature = await sign(encodedPayload, secret);
  return `${encodedPayload}.${bytesToBase64Url(signature)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string
): Promise<SessionVerifyResult> {
  try {
    if (!token) return { ok: false, reason: "missing" };

    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra) {
      return { ok: false, reason: "malformed" };
    }

    const payload = base64UrlDecodeJson<SessionPayload>(encodedPayload);
    if (!payload.sub || typeof payload.exp !== "number") {
      return { ok: false, reason: "invalid_payload" };
    }

    const expectedSignature = await sign(encodedPayload, secret);
    const actualSignature = base64UrlToBytes(encodedSignature);
    if (!constantTimeEqual(actualSignature, expectedSignature)) {
      return { ok: false, reason: "bad_signature" };
    }

    if (payload.exp <= Math.floor(Date.now() / 1_000)) {
      return { ok: false, reason: "expired" };
    }

    return { ok: true, username: payload.sub, exp: payload.exp };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

export function getAuthCookieName() {
  return getAuthConfig().cookieName;
}

export function getSessionTtlSeconds() {
  return getAuthConfig().ttlSeconds;
}

export function shouldRotateSession(
  exp: number,
  ttlSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1_000)
) {
  const remainingSeconds = exp - nowSeconds;
  return remainingSeconds > 0 && remainingSeconds < ttlSeconds / 2;
}

export function buildSessionCookieOptions(maxAge = getSessionTtlSeconds()) {
  const config = getAuthConfig();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config.cookieSecure,
    path: "/",
    maxAge,
  };
}
