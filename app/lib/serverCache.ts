export type CacheStatus = "hit" | "miss" | "stale";

export type CacheEnvelope<T extends object> = T & {
  cache: {
    status: CacheStatus;
    age_ms: number;
    ttl_ms: number;
  };
  status?: "degraded";
  error?: {
    code: string;
    message: string;
  };
};

type CacheEntry<T extends object> = {
  value: T;
  cachedAt: number;
};

type CachedFetchOptions<T extends object> = {
  key: string;
  ttlMs: number;
  fetcher: () => Promise<T>;
  staleErrorCode: string;
};

const valueCache = new Map<string, CacheEntry<object>>();
const inFlightCache = new Map<string, Promise<object>>();

export function clearServerCacheForTests() {
  valueCache.clear();
  inFlightCache.clear();
}

function withCacheMetadata<T extends object>(
  value: T,
  status: CacheStatus,
  ageMs: number,
  ttlMs: number
): CacheEnvelope<T> {
  return {
    ...value,
    cache: {
      status,
      age_ms: Math.max(0, ageMs),
      ttl_ms: ttlMs,
    },
  };
}

export async function getCachedOrFetch<T extends object>({
  key,
  ttlMs,
  fetcher,
  staleErrorCode,
}: CachedFetchOptions<T>): Promise<CacheEnvelope<T>> {
  const now = Date.now();
  const cached = valueCache.get(key) as CacheEntry<T> | undefined;

  if (cached && now - cached.cachedAt < ttlMs) {
    return withCacheMetadata(cached.value, "hit", now - cached.cachedAt, ttlMs);
  }

  try {
    let inFlight = inFlightCache.get(key) as Promise<T> | undefined;

    if (!inFlight) {
      inFlight = fetcher();
      inFlightCache.set(key, inFlight);
    }

    const value = await inFlight;
    const cachedAt = Date.now();
    valueCache.set(key, { value, cachedAt });

    return withCacheMetadata(value, "miss", 0, ttlMs);
  } catch (error) {
    if (cached) {
      const message =
        error instanceof Error ? error.message : "Provider request failed";

      return {
        ...withCacheMetadata(
          cached.value,
          "stale",
          Date.now() - cached.cachedAt,
          ttlMs
        ),
        status: "degraded",
        error: {
          code: staleErrorCode,
          message,
        },
      };
    }

    throw error;
  } finally {
    inFlightCache.delete(key);
  }
}
