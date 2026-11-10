import type { MetadataRoute } from "next";
import { getPublished } from "@/lib/api";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://procodic.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/products", "/ai-research", "/training", "/about", "/case-studies", "/testimonials", "/collaborations", "/insights", "/contact"];
  const dynamic = await Promise.all([["products", "/products/"], ["research", "/ai-research/"], ["training", "/training/"], ["case-studies", "/case-studies/"], ["articles", "/insights/"]].map(async ([type, path]) => (await getPublished(type)).map((item) => ({ url: `${base}${path}${item.slug}`, lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date() }))));
  return [...fixed.map((path) => ({ url: `${base}${path}`, lastModified: new Date() })), ...dynamic.flat()];
}
