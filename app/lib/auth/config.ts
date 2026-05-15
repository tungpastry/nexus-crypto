const DEFAULT_COOKIE_NAME = "nexus_session";
const DEFAULT_SESSION_TTL_SECONDS = 86_400;

export type AuthConfig = {
  enabled: boolean;
  configured: boolean;
  username?: string;
  passwordHash?: string;
  secret?: string;
  cookieName: string;
  ttlSeconds: number;
  cookieSecure: boolean;
};

function readPositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isAuthEnabled() {
  return process.env.NEXUS_AUTH_ENABLED === "1";
}

export function getAuthConfig(): AuthConfig {
  const enabled = isAuthEnabled();
  const username = process.env.NEXUS_AUTH_USERNAME;
  const passwordHash = process.env.NEXUS_AUTH_PASSWORD_HASH;
  const secret = process.env.NEXUS_AUTH_SECRET;
  const cookieName = process.env.NEXUS_AUTH_COOKIE_NAME || DEFAULT_COOKIE_NAME;
  const ttlSeconds = readPositiveInt(
    process.env.NEXUS_AUTH_SESSION_TTL_SECONDS,
    DEFAULT_SESSION_TTL_SECONDS
  );
  const cookieSecure = process.env.NEXUS_AUTH_COOKIE_SECURE === "1";

  return {
    enabled,
    configured: Boolean(username && passwordHash && secret),
    username,
    passwordHash,
    secret,
    cookieName,
    ttlSeconds,
    cookieSecure,
  };
}
