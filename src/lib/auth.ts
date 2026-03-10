import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { env, requireEnv } from "@/lib/env";

export const authRoles = ["super_admin", "admin", "client"] as const;
export const sessionCookieName = "aurelia_session";
export const mfaChallengeCookieName = "aurelia_mfa_challenge";

const mfaChallengeMaxAgeMinutes = 10;

type AuthRoleTuple = typeof authRoles;
export type AuthRole = AuthRoleTuple[number];

export type SessionUser = {
  userId: string;
  email: string;
  fullName: string;
  role: AuthRole;
  clientProfileId?: string;
  mfaVerified: boolean;
};

export type MfaChallengePurpose = "verify" | "setup";

export type MfaChallenge = {
  userId: string;
  email: string;
  fullName: string;
  role: "super_admin" | "admin";
  clientProfileId?: string;
  purpose: MfaChallengePurpose;
  setupSecret?: string;
};

export const authPolicy = {
  adminMfaRequired: true,
  clientPasskeyOptional: true,
  sessionMaxAgeHours: 12,
} as const;

function getJwtSecret() {
  return new TextEncoder().encode(requireEnv("AUTH_SECRET"));
}

function isAdminRole(role: AuthRole) {
  return role === "admin" || role === "super_admin";
}

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function isAllowedRole(session: SessionUser | null, roles: AuthRole[]) {
  return Boolean(session && roles.includes(session.role));
}

export function getDefaultRouteForRole(locale: string, role: AuthRole) {
  if (role === "client") {
    return `/${locale}/portal`;
  }

  return `/${locale}/admin`;
}

export async function createSessionToken(session: SessionUser) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS512", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${authPolicy.sessionMaxAgeHours}h`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS512"],
    });

    if (
      typeof payload["userId"] !== "string" ||
      typeof payload["email"] !== "string" ||
      typeof payload["fullName"] !== "string" ||
      !authRoles.includes(payload["role"] as AuthRole) ||
      typeof payload["mfaVerified"] !== "boolean"
    ) {
      return null;
    }

    return {
      userId: payload["userId"],
      email: payload["email"],
      fullName: payload["fullName"],
      role: payload["role"] as AuthRole,
      ...(typeof payload["clientProfileId"] === "string"
        ? { clientProfileId: payload["clientProfileId"] }
        : {}),
      mfaVerified: payload["mfaVerified"],
    };
  } catch {
    return null;
  }
}

export async function createMfaChallengeToken(challenge: MfaChallenge) {
  return new SignJWT(challenge)
    .setProtectedHeader({ alg: "HS512", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${mfaChallengeMaxAgeMinutes}m`)
    .sign(getJwtSecret());
}

export async function verifyMfaChallengeToken(token: string): Promise<MfaChallenge | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS512"],
    });

    const role = payload["role"];
    const purpose = payload["purpose"];

    if (
      typeof payload["userId"] !== "string" ||
      typeof payload["email"] !== "string" ||
      typeof payload["fullName"] !== "string" ||
      (role !== "admin" && role !== "super_admin") ||
      (purpose !== "verify" && purpose !== "setup")
    ) {
      return null;
    }

    return {
      userId: payload["userId"],
      email: payload["email"],
      fullName: payload["fullName"],
      role,
      ...(typeof payload["clientProfileId"] === "string"
        ? { clientProfileId: payload["clientProfileId"] }
        : {}),
      purpose,
      ...(typeof payload["setupSecret"] === "string"
        ? { setupSecret: payload["setupSecret"] }
        : {}),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: SessionUser) {
  const token = await createSessionToken(session);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    maxAge: authPolicy.sessionMaxAgeHours * 60 * 60,
    path: "/",
    sameSite: "strict",
    secure: env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function setMfaChallengeCookie(challenge: MfaChallenge) {
  const token = await createMfaChallengeToken(challenge);
  const cookieStore = await cookies();

  cookieStore.set(mfaChallengeCookieName, token, {
    httpOnly: true,
    maxAge: mfaChallengeMaxAgeMinutes * 60,
    path: "/",
    sameSite: "strict",
    secure: env.NODE_ENV === "production",
  });
}

export async function clearMfaChallengeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(mfaChallengeCookieName);
}

export async function getSessionFromCookieStore() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getMfaChallengeFromCookieStore() {
  const cookieStore = await cookies();
  const token = cookieStore.get(mfaChallengeCookieName)?.value;

  if (!token) {
    return null;
  }

  return verifyMfaChallengeToken(token);
}

export async function getSessionFromRequest(request: Request | NextRequest) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`))
    ?.slice(sessionCookieName.length + 1);

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requirePageRole(locale: string, roles: AuthRole[]): Promise<SessionUser> {
  const session = await getSessionFromCookieStore();

  if (!session || !roles.includes(session.role)) {
    redirect(
      `/${locale}/login?redirect=${encodeURIComponent(`/${locale}${roles.includes("client") ? "/portal" : "/admin"}`)}`,
    );
  }

  if (isAdminRole(session.role) && !session.mfaVerified) {
    redirect(`/${locale}/login?error=mfa_required`);
  }

  return session;
}
