import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/portal/", "/dashboard/"],
    },
    sitemap: "https://private-equity-portal.vercel.app/sitemap.xml",
  };
}
