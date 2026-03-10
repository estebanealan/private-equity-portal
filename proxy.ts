import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionFromRequest, isAllowedRole } from "@/lib/auth";

const adminRoles = ["admin", "super_admin"] as const;
const clientRoles = ["client", "admin", "super_admin"] as const;

function extractLocale(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] ?? "es";
}

function isAdminRole(role: string) {
  return role === "admin" || role === "super_admin";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = extractLocale(pathname);
  const session = await getSessionFromRequest(request);

  if (pathname.includes("/admin") && !isAllowedRole(session, [...adminRoles])) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.includes("/portal") && !isAllowedRole(session, [...clientRoles])) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAdminRole(session.role) && !session.mfaVerified) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("error", "mfa_required");
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:locale/admin/:path*", "/:locale/portal/:path*"],
};
