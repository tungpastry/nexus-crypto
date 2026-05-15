import { NextRequest, NextResponse } from "next/server";
import { getAuthConfig } from "../../../lib/auth/config";
import { verifySessionToken } from "../../../lib/auth/session";

export async function GET(req: NextRequest) {
  const config = getAuthConfig();

  if (!config.enabled) {
    return NextResponse.json({
      authenticated: true,
      auth_enabled: false,
      user: { name: "local" },
    });
  }

  if (!config.configured || !config.secret) {
    return NextResponse.json({
      authenticated: false,
      auth_enabled: true,
      configured: false,
    });
  }

  const token = req.cookies.get(config.cookieName)?.value;
  const session = await verifySessionToken(token, config.secret);

  if (!session.ok) {
    return NextResponse.json({
      authenticated: false,
      auth_enabled: true,
    });
  }

  return NextResponse.json({
    authenticated: true,
    auth_enabled: true,
    user: { name: session.username },
  });
}
