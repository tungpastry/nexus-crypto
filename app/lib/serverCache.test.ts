import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearServerCacheForTests, getCachedOrFetch } from "./serverCache";

type TestPayload = {
  provider: string;
  value: number;
};

function payload(value: number): TestPayload {
  return { provider: "test", value };
}

describe("getCachedOrFetch", () => {
  beforeEach(() => {
    clearServerCacheForTests();
    vi.restoreAllMocks();
  });

  it("returns miss for the first successful fetch", async () => {
    const fetcher = vi.fn(async () => payload(1));

    const result = await getCachedOrFetch({
      key: "price:BTCUSDT",
      ttlMs: 1_000,
      fetcher,
      staleErrorCode: "STALE_TEST",
    });

    expect(result.cache.status).toBe("miss");
    expect(result.cache.ttl_ms).toBe(1_000);
    expect(result.value).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns hit within TTL without calling the fetcher again", async () => {
    const fetcher = vi.fn(async () => payload(1));

    await getCachedOrFetch({
      key: "price:ETHUSDT",
      ttlMs: 1_000,
      fetcher,
      staleErrorCode: "STALE_TEST",
    });
    const result = await getCachedOrFetch({
      key: "price:ETHUSDT",
      ttlMs: 1_000,
      fetcher,
      staleErrorCode: "STALE_TEST",
    });

    expect(result.cache.status).toBe("hit");
    expect(result.value).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns stale degraded cached data when a refresh fails", async () => {
    const firstFetcher = vi.fn(async () => payload(7));
    const failingFetcher = vi.fn(async (): Promise<TestPayload> => {
      throw new Error("provider unavailable");
    });

    await getCachedOrFetch({
      key: "klines:BTCUSDT:4h",
      ttlMs: 1_000,
      fetcher: firstFetcher,
      staleErrorCode: "KLINES_STALE",
    });
    const result = await getCachedOrFetch({
      key: "klines:BTCUSDT:4h",
      ttlMs: 0,
      fetcher: failingFetcher,
      staleErrorCode: "KLINES_STALE",
    });

    expect(result.cache.status).toBe("stale");
    expect(result.status).toBe("degraded");
    expect(result.error?.code).toBe("KLINES_STALE");
    expect(result.error?.message).toBe("provider unavailable");
    expect(result.value).toBe(7);
    expect(firstFetcher).toHaveBeenCalledTimes(1);
    expect(failingFetcher).toHaveBeenCalledTimes(1);
  });

  it("throws when there is no cached value and the fetcher fails", async () => {
    await expect(
      getCachedOrFetch({
        key: "price:SOLUSDT",
        ttlMs: 1_000,
        fetcher: async (): Promise<TestPayload> => {
          throw new Error("cold miss failure");
        },
        staleErrorCode: "PRICE_STALE",
      })
    ).rejects.toThrow("cold miss failure");
  });

  it("dedupes concurrent in-flight requests for the same key", async () => {
    let resolveFetcher: (value: TestPayload) => void = () => undefined;
    const fetcher = vi.fn(
      () =>
        new Promise<TestPayload>((resolve) => {
          resolveFetcher = resolve;
        })
    );

    const first = getCachedOrFetch({
      key: "price:DOGEUSDT",
      ttlMs: 1_000,
      fetcher,
      staleErrorCode: "PRICE_STALE",
    });
    const second = getCachedOrFetch({
      key: "price:DOGEUSDT",
      ttlMs: 1_000,
      fetcher,
      staleErrorCode: "PRICE_STALE",
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    resolveFetcher(payload(42));

    const results = await Promise.all([first, second]);

    expect(results[0].cache.status).toBe("miss");
    expect(results[1].cache.status).toBe("miss");
    expect(results[0].value).toBe(42);
    expect(results[1].value).toBe(42);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
