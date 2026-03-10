import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { clearSessionCookie, type SessionUser } from "@/lib/auth";

type AppShellProps = {
  children: ReactNode;
  eyebrow: string;
  locale: string;
  session: SessionUser;
  subtitle: string;
  title: string;
};

export function AppShell({ children, eyebrow, locale, session, subtitle, title }: AppShellProps) {
  async function logoutAction() {
    "use server";

    await clearSessionCookie();
    redirect(`/${locale}/login`);
  }

  return (
    <main className="min-h-screen bg-transparent px-6 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 rounded-[32px] border border-white/10 bg-[rgb(var(--color-surface-50)/0.60)] p-4 shadow-[var(--shadow-xl)] backdrop-blur lg:grid-cols-[260px_1fr] lg:p-6">
        <aside className="flex flex-col rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.85)] p-5">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brand-400">
              Aurelia Capital
            </div>
            <div className="mt-3 font-display text-3xl text-surface-950">Control room</div>
            <p className="mt-3 text-sm leading-6 text-surface-700">
              Signed in as {session.fullName} ({session.role.replace("_", " ")}).
            </p>
          </div>
          <nav className="mt-8 grid gap-2">
            <Link
              className="rounded-2xl px-4 py-3 text-sm text-surface-700 transition hover:bg-surface-50"
              href={`/${locale}`}
            >
              Public site
            </Link>
            <Link
              className="rounded-2xl px-4 py-3 text-sm text-surface-700 transition hover:bg-surface-50"
              href={`/${locale}/admin`}
            >
              Admin
            </Link>
            <Link
              className="rounded-2xl px-4 py-3 text-sm text-surface-700 transition hover:bg-surface-50"
              href={`/${locale}/portal`}
            >
              Client portal
            </Link>
            <Link
              className="rounded-2xl px-4 py-3 text-sm text-surface-700 transition hover:bg-surface-50"
              href={`/${locale}/login`}
            >
              Re-authenticate
            </Link>
          </nav>
          <div className="mt-auto rounded-[28px] border border-white/10 bg-gradient-to-br from-[rgb(var(--color-brand-500)/0.15)] to-transparent p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-brand-400">
              Security posture
            </div>
            <div className="mt-3 text-lg font-semibold text-surface-950">
              MFA ready, role guards, signed cookies
            </div>
            <p className="mt-2 text-sm leading-6 text-surface-700">
              This phase adds protected routes, role-aware APIs, and a hardened session foundation.
            </p>
          </div>
        </aside>

        <section className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.80)] p-6 lg:p-8">
          <header className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-brand-400">{eyebrow}</div>
              <h1 className="mt-3 font-display text-4xl text-surface-950">{title}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-surface-700">{subtitle}</p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="secondary">
                <Link href={`/${locale}`}>Back to marketing</Link>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="secondary">
                  Sign out
                </Button>
              </form>
            </div>
          </header>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
