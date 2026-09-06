import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalEnv = { ...process.env };

describe("/api/version", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns injected release metadata with short commit", async () => {
    process.env.NEXT_PUBLIC_GIT_COMMIT_SHA =
      "565053c4ee67d50f897af063bc70a2cedd7878d4";
    process.env.NEXT_PUBLIC_BUILD_TIME = "2026-05-15T00:00:00Z";

    const response = await GET();
    const payload = await response.json();

    expect(payload.app).toBe("nexus-crypto");
    expect(payload.commit).toBe("565053c4ee67d50f897af063bc70a2cedd7878d4");
    expect(payload.short_commit).toBe("565053c");
    expect(payload.build_time).toBe("2026-05-15T00:00:00Z");
    expect(payload.next).toBe("16.3.4");
    expect(payload.node).toMatch(/^v/);
  });

  it("falls back to unknown when release metadata is absent", async () => {
    delete process.env.NEXT_PUBLIC_GIT_COMMIT_SHA;
    delete process.env.GIT_COMMIT_SHA;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.NEXT_PUBLIC_BUILD_TIME;
    delete process.env.BUILD_TIME;

    const response = await GET();
    const payload = await response.json();

    expect(payload.commit).toBe("unknown");
    expect(payload.short_commit).toBe("unknown");
    expect(payload.build_time).toBe("unknown");
  });
});
