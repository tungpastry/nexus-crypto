import { NextResponse } from "next/server";
import packageJson from "../../../package.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function firstEnvValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }

  return "unknown";
}

export async function GET() {
  return NextResponse.json({
    app: packageJson.name,
    version: packageJson.version,
    commit: firstEnvValue([
      "NEXT_PUBLIC_GIT_COMMIT_SHA",
      "GIT_COMMIT_SHA",
      "VERCEL_GIT_COMMIT_SHA",
    ]),
    build_time: firstEnvValue(["NEXT_PUBLIC_BUILD_TIME", "BUILD_TIME"]),
    next: packageJson.dependencies.next,
    node: process.version,
    env: process.env.NODE_ENV || "unknown",
    updated_at: new Date().toISOString(),
  });
}
