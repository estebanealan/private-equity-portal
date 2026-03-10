"use server";

import { redirect } from "next/navigation";
import {
  clearMfaChallengeCookie,
  getDefaultRouteForRole,
  getMfaChallengeFromCookieStore,
  setMfaChallengeCookie,
  setSessionCookie,
} from "@/lib/auth";
import { beginAuthentication, completeAdminMfa } from "@/server/services/auth.service";

function buildLoginUrl(locale: string, values: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/${locale}/login?${query}` : `/${locale}/login`;
}

export async function loginAction(locale: string, requestedRedirect: string, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await beginAuthentication({ email, password });

  if (result.status === "invalid_credentials") {
    redirect(
      buildLoginUrl(locale, {
        error: "invalid",
        ...(requestedRedirect ? { redirect: requestedRedirect } : {}),
      }),
    );
  }

  if (result.status === "authenticated") {
    await clearMfaChallengeCookie();
    await setSessionCookie(result.session);

    if (requestedRedirect.startsWith(`/${locale}/`)) {
      redirect(requestedRedirect);
    }

    redirect(getDefaultRouteForRole(locale, result.session.role));
  }

  await setMfaChallengeCookie(result.challenge);

  redirect(
    buildLoginUrl(locale, {
      ...(requestedRedirect ? { redirect: requestedRedirect } : {}),
    }),
  );
}

export async function verifyMfaAction(locale: string, requestedRedirect: string, formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const challenge = await getMfaChallengeFromCookieStore();

  if (!challenge) {
    redirect(
      buildLoginUrl(locale, {
        error: "mfa_expired",
        ...(requestedRedirect ? { redirect: requestedRedirect } : {}),
      }),
    );
  }

  try {
    const session = await completeAdminMfa(challenge, { code });

    if (!session) {
      redirect(
        buildLoginUrl(locale, {
          error: "mfa_invalid",
          ...(requestedRedirect ? { redirect: requestedRedirect } : {}),
        }),
      );
    }

    await clearMfaChallengeCookie();
    await setSessionCookie(session);

    if (requestedRedirect.startsWith(`/${locale}/`)) {
      redirect(requestedRedirect);
    }

    redirect(getDefaultRouteForRole(locale, session.role));
  } catch {
    redirect(
      buildLoginUrl(locale, {
        error: "mfa_invalid",
        ...(requestedRedirect ? { redirect: requestedRedirect } : {}),
      }),
    );
  }
}

export async function resetMfaAction(locale: string) {
  await clearMfaChallengeCookie();
  redirect(`/${locale}/login`);
}
