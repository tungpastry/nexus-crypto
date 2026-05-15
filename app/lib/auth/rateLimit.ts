type RateLimitEntry = {
  attempts: number;
  windowStartedAt: number;
  lockedUntil: number;
};

type RateLimitConfig = {
  maxAttempts: number;
  windowSeconds: number;
  lockSeconds: number;
};

const attempts = new Map<string, RateLimitEntry>();

export function buildLoginRateLimitKey(ip: string, username: string) {
  return `${ip || "unknown"}:${username.trim().toLowerCase() || "unknown"}`;
}

export function checkLoginRateLimit(
  key: string,
  config: RateLimitConfig,
  now = Date.now()
) {
  const entry = attempts.get(key);
  if (!entry) {
    return { limited: false as const };
  }

  if (entry.lockedUntil > now) {
    return {
      limited: true as const,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1_000),
    };
  }

  if (now - entry.windowStartedAt > config.windowSeconds * 1_000) {
    attempts.delete(key);
  }

  return { limited: false as const };
}

export function recordLoginFailure(
  key: string,
  config: RateLimitConfig,
  now = Date.now()
) {
  const existing = attempts.get(key);
  const expired =
    existing && now - existing.windowStartedAt > config.windowSeconds * 1_000;
  const entry =
    !existing || expired
      ? { attempts: 0, windowStartedAt: now, lockedUntil: 0 }
      : existing;

  entry.attempts += 1;
  if (entry.attempts >= config.maxAttempts) {
    entry.lockedUntil = now + config.lockSeconds * 1_000;
  }

  attempts.set(key, entry);
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}

export function clearLoginRateLimitForTests() {
  attempts.clear();
}
