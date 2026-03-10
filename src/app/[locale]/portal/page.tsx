import { AppShell } from "@/components/layouts/AppShell";
import { requirePageRole } from "@/lib/auth";
import { getClientPortfolio } from "@/server/services/portfolio.service";

type PortalPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PortalPage({ params }: PortalPageProps) {
  const { locale } = await params;
  const session = await requirePageRole(locale, ["client", "admin", "super_admin"]);
  const clientProfileId = session.clientProfileId ?? "cli_001";
  const portfolio = await getClientPortfolio(clientProfileId);

  return (
    <AppShell
      eyebrow="Client portal"
      locale={locale}
      session={session}
      subtitle="Investors now read from the same movement layer as operations, with allocations and recent activity computed from shared data."
      title="Clear portfolio visibility for every client account."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-50)/0.80)] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-surface-500">Total NAV</div>
          <div className="mt-4 text-3xl font-semibold text-surface-950">
            ${portfolio.snapshot?.navUsd.toLocaleString("en-US") ?? "0"}
          </div>
          <p className="mt-3 text-sm leading-6 text-surface-700">
            Latest snapshot for the selected client profile.
          </p>
        </article>
        <article className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-50)/0.80)] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-surface-500">
            Committed capital
          </div>
          <div className="mt-4 text-3xl font-semibold text-surface-950">
            ${portfolio.snapshot?.committedUsd.toLocaleString("en-US") ?? "0"}
          </div>
          <p className="mt-3 text-sm leading-6 text-surface-700">
            Committed exposure visible to the investor portal.
          </p>
        </article>
        <article className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-50)/0.80)] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-surface-500">Net IRR</div>
          <div className="mt-4 text-3xl font-semibold text-surface-950">
            {portfolio.snapshot?.irrNet ? `${portfolio.snapshot.irrNet}%` : "N/A"}
          </div>
          <p className="mt-3 text-sm leading-6 text-surface-700">
            Current performance indicator from the latest available snapshot.
          </p>
        </article>
      </div>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.80)] p-6">
          <h2 className="text-xl font-semibold text-surface-950">Recent activity</h2>
          <div className="mt-5 space-y-4">
            {portfolio.recentActivity.map((item) => (
              <div className="rounded-3xl border border-white/10 bg-surface-50 p-4" key={item.id}>
                <div className="text-xs uppercase tracking-[0.18em] text-brand-400">
                  {new Date(item.effectiveAt).toLocaleDateString("en-US")}
                </div>
                <div className="mt-2 text-lg font-medium text-surface-950">{item.assetName}</div>
                <p className="mt-2 text-sm leading-6 text-surface-700">
                  {item.notes ?? "No note attached."}
                </p>
                <div className="mt-3 text-sm text-surface-500">
                  {item.direction} ? ${item.amountUsd.toLocaleString("en-US")}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.80)] p-6">
          <h2 className="text-xl font-semibold text-surface-950">Allocation by asset</h2>
          <div className="mt-5 space-y-4">
            {portfolio.allocations.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm text-surface-700">
                  <span>{item.name}</span>
                  <span>{item.share}</span>
                </div>
                <div className="h-3 rounded-full bg-surface-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400"
                    style={{ width: item.share }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
