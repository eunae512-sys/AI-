import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://briq.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const publicPaths = ["", "/pricing", "/login", "/onboarding"];
  return publicPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
}
