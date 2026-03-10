import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";

const baseUrl = process.env["APP_URL"] ?? "https://private-equity-portal.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedRoutes = locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}`])
      ),
    },
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...localizedRoutes,
  ];
}
