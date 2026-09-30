import type { MetadataRoute } from "next";
import { allListedCars, brands } from "@/lib/cars";
import { SITE_URL } from "@/lib/seo";
import { BODY_TYPES } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const toDate = (s: string) => new Date(s.replace(" ", "T") + "Z");
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/mobil`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/cari-cocok`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/jual-mobil`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/kontak`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/kebijakan-privasi`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/syarat-ketentuan`, changeFrequency: "yearly", priority: 0.2 },
    ...BODY_TYPES.map((b) => ({ url: `${SITE_URL}/mobil?body=${b}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...brands().map((b) => ({ url: `${SITE_URL}/mobil?brand=${encodeURIComponent(b.brand)}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...allListedCars().map((c) => ({
      url: `${SITE_URL}/mobil/${c.slug}`,
      lastModified: toDate(c.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
