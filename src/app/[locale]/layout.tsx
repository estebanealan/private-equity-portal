import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

import "../globals.css";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }, { locale: "de" }];
}

export async function generateMetadata({ params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);

  return {
    title: {
      default: dict.meta.title,
      template: `%s | ${dict.meta.brand}`,
    },
    description: dict.meta.description,
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return (
    <html className="dark" lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
