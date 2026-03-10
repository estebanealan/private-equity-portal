import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import {
  getDefaultRouteForRole,
  getMfaChallengeFromCookieStore,
  getSessionFromCookieStore,
} from "@/lib/auth";
import { env } from "@/lib/env";
import { buildOtpAuthUrl } from "@/lib/mfa";
import { loginAction, resetMfaAction, verifyMfaAction } from "./actions";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; redirect?: string }>;
};

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const { error, redirect: redirectTo } = await searchParams;
  const activeSession = await getSessionFromCookieStore();
  const mfaChallenge = await getMfaChallengeFromCookieStore();

  if (activeSession) {
    redirect(getDefaultRouteForRole(locale, activeSession.role));
  }

  const isMfaStep = Boolean(mfaChallenge);
  const isSetupStep = mfaChallenge?.purpose === "setup";
  const setupUri =
    isSetupStep && mfaChallenge?.setupSecret
      ? buildOtpAuthUrl(mfaChallenge.email, mfaChallenge.setupSecret)
      : null;

  const boundLoginAction = loginAction.bind(null, locale, redirectTo ?? "");
  const boundVerifyMfaAction = verifyMfaAction.bind(null, locale, redirectTo ?? "");
  const boundResetMfaAction = resetMfaAction.bind(null, locale);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-6 rounded-[32px] border border-white/10 bg-[rgb(var(--color-surface-50)/0.60)] p-6 shadow-[var(--shadow-xl)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <section className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.80)] p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-brand-400">Secure access</div>
          <h1 className="mt-4 font-display text-4xl text-surface-950">
            Institutional login for teams and clients.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-surface-700">
            Admin and super-admin accounts now require a true time-based one-time password step
            before any protected route is unlocked.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-surface-50 p-5">
              <div className="text-sm font-semibold text-surface-950">Admin area</div>
              <p className="mt-2 text-sm leading-6 text-surface-700">
                Movement capture, operational control, and audit-aware workflows.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-surface-50 p-5">
              <div className="text-sm font-semibold text-surface-950">Client portal</div>
              <p className="mt-2 text-sm leading-6 text-surface-700">
                Snapshot metrics, allocations, and recent activity by investor account.
              </p>
            </div>
          </div>
          {env.NODE_ENV !== "production" ? (
            <div className="mt-8 rounded-3xl border border-[rgb(var(--color-brand-500)/0.30)] bg-[rgb(var(--color-brand-500)/0.10)] p-5 text-sm text-surface-700">
              <div className="font-semibold text-surface-950">Development credentials</div>
              <p className="mt-2">Admin: admin@aurelia.test / Admin123!</p>
              <p>Client: client@aurelia.test / Client123!</p>
              <p className="mt-2 text-xs">
                Use these only if your local database was seeded with the default records.
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.85)] p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-brand-400">
            {isMfaStep ? "MFA verification" : "Sign in"}
          </div>

          {error === "invalid" ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Invalid credentials. Please try again.
            </div>
          ) : null}

          {error === "mfa_required" ? (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              MFA verification is required for this account.
            </div>
          ) : null}

          {error === "mfa_invalid" ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Invalid MFA code. Please enter the 6-digit code from your authenticator app.
            </div>
          ) : null}

          {error === "mfa_expired" ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Your MFA challenge expired. Please sign in again.
            </div>
          ) : null}

          {isSetupStep && mfaChallenge?.setupSecret ? (
            <div className="mt-4 rounded-2xl border border-[rgb(var(--color-brand-500)/0.35)] bg-[rgb(var(--color-brand-500)/0.10)] px-4 py-3 text-sm text-surface-100">
              <p className="font-semibold text-surface-50">
                Scan this setup secret in your authenticator app.
              </p>
              <p className="mt-2 break-all font-mono text-xs text-brand-200">
                {mfaChallenge.setupSecret}
              </p>
              {setupUri ? (
                <p className="mt-2 break-all text-xs text-surface-200">{setupUri}</p>
              ) : null}
              <p className="mt-2 text-xs text-surface-200">
                After adding it, enter your first 6-digit code to finalize enrollment.
              </p>
            </div>
          ) : null}

          {!isMfaStep ? (
            <form action={boundLoginAction} className="mt-6 grid gap-4">
              <input name="redirectTo" type="hidden" value={redirectTo ?? ""} />
              <label className="grid gap-2 text-sm text-surface-700">
                Email
                <input
                  className="rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950 outline-none ring-0"
                  defaultValue=""
                  name="email"
                  placeholder="you@firm.com"
                  type="email"
                />
              </label>
              <label className="grid gap-2 text-sm text-surface-700">
                Password
                <input
                  className="rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950 outline-none ring-0"
                  defaultValue=""
                  name="password"
                  placeholder="********"
                  type="password"
                />
              </label>
              <Button size="lg" type="submit">
                Sign in securely
              </Button>
            </form>
          ) : (
            <form action={boundVerifyMfaAction} className="mt-6 grid gap-4">
              <input name="redirectTo" type="hidden" value={redirectTo ?? ""} />
              <label className="grid gap-2 text-sm text-surface-700">
                6-digit code
                <input
                  className="rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950 outline-none ring-0"
                  inputMode="numeric"
                  maxLength={6}
                  name="code"
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  type="text"
                />
              </label>
              <Button size="lg" type="submit">
                Verify and continue
              </Button>
            </form>
          )}

          {isMfaStep ? (
            <form action={boundResetMfaAction} className="mt-4">
              <Button size="lg" type="submit" variant="secondary">
                Use another account
              </Button>
            </form>
          ) : (
            <div className="mt-6">
              <Button asChild size="lg" variant="secondary">
                <Link href={`/${locale}`}>Back to website</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
