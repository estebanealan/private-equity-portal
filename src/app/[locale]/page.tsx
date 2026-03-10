import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/i18n/dictionaries";
import { buildLocalizedPath } from "@/lib/navigation";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-between rounded-[32px] border border-white/10 bg-[rgb(var(--color-surface-50)/0.60)] p-6 shadow-[var(--shadow-xl)] backdrop-blur md:p-10">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-[rgb(var(--color-brand-500)/0.25)] bg-[rgb(var(--color-brand-500)/0.10)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-brand-500">
              {dict.home.badge}
            </div>
            <h1 className="max-w-4xl text-balance font-display text-4xl text-surface-950 sm:text-5xl lg:text-6xl">
              {dict.home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-surface-700">
              {dict.home.description}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href={buildLocalizedPath(locale, "/portal")}>{dict.home.primaryCta}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={buildLocalizedPath(locale, "/admin")}>{dict.home.secondaryCta}</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.75)] p-5 shadow-[var(--shadow-lg)] lg:w-[360px]">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[rgb(var(--color-brand-500)/0.18)] to-transparent p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-brand-400">
                {dict.home.panelLabel}
              </div>
              <div className="mt-4 text-3xl font-semibold text-surface-950">$248.4M</div>
              <div className="mt-2 text-sm text-surface-600">{dict.home.panelCaption}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dict.home.metrics.map((metric) => (
                <section
                  className="rounded-3xl border border-white/10 bg-surface-50 p-4"
                  key={metric.label}
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-surface-500">
                    {metric.label}
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-surface-950">{metric.value}</div>
                </section>
              ))}
            </div>
          </div>
        </header>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          {dict.home.cards.map((card) => (
            <article
              className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.65)] p-6 shadow-[var(--shadow-md)]"
              key={card.title}
            >
              <div className="text-sm uppercase tracking-[0.18em] text-brand-400">
                {card.eyebrow}
              </div>
              <h2 className="mt-4 font-display text-2xl text-surface-950">{card.title}</h2>
              <p className="mt-3 text-base leading-7 text-surface-700">{card.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
