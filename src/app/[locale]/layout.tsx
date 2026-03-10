import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isSupportedLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

import "../globals.css";

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>;

export async function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }, { locale: "de" }];
}

export async function generateMetadata({ params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);
  const baseUrl = process.env["APP_URL"] ?? "https://private-equity-portal.vercel.app";

  const ogLocales: Record<string, string> = {
    es: "es_ES",
    en: "en_US",
    de: "de_DE",
  };

  return {
    title: {
      default: dict.meta.title,
      template: `%s | ${dict.meta.brand}`,
    },
    description: dict.meta.description,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}`])
      ),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: `${baseUrl}/${locale}`,
      siteName: dict.meta.brand,
      locale: ogLocales[locale] ?? "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const baseUrl = process.env["APP_URL"] ?? "https://private-equity-portal.vercel.app";

  return (
    <html className="dark" lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: dict.meta.brand,
              url: baseUrl,
              logo: `${baseUrl}/logo.png`,
              sameAs: [
                "https://twitter.com/privateequity",
                "https://linkedin.com/company/private-equity",
              ],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
