import { NextRequest, NextResponse } from "next/server";
import { getAuthConfig } from "./app/lib/auth/config";
import { verifySessionToken } from "./app/lib/auth/session";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  );
}

function isProtectedPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/asset/");
}

export async function middleware(req: NextRequest) {
  const config = getAuthConfig();
  const { pathname, search } = req.nextUrl;

  if (!config.enabled || isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (config.configured && config.secret) {
    const token = req.cookies.get(config.cookieName)?.value;
    const session = await verifySessionToken(token, config.secret);
    if (session.ok) return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
