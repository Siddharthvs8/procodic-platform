import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import type { Content } from "./api";

const apiBase = () => process.env.API_INTERNAL_URL
  ? `${process.env.API_INTERNAL_URL.replace(/\/$/, "")}/api`
  : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Cache only validated, successful responses. Failures must not replace good
// content with an empty list during background revalidation.
const readPublished = unstable_cache(async (base: string, type: string, slug?: string): Promise<Content[] | Content | null> => {
  const path = `/content/${encodeURIComponent(type)}${slug === undefined ? "" : `/${encodeURIComponent(slug)}`}`;
  const response = await fetch(`${base}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  // A missing detail is authoritative: publishing/archiving must replace a
  // previously cached page rather than preserve it as an origin failure.
  if (slug !== undefined && response.status === 404) return null;
  if (!response.ok) throw new Error(`Public content request failed (${response.status}).`);
  const result = await response.json() as { data?: unknown };
  const data = result.data;
  if (slug === undefined) {
    if (!Array.isArray(data)) throw new Error("Public content list response is invalid.");
    return data as Content[];
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Public content detail response is invalid.");
  }
  return data as Content;
}, ["published-content-v1"], { revalidate: 60 });

export const getPublished = cache(async (type: string): Promise<Content[]> => {
  // Keep outage fallbacks out of prerendered HTML while sharing successful data
  // between requests. Admin queries and writes never use this cache.
  await connection();
  try {
    return await readPublished(apiBase(), type) as Content[];
  } catch { return []; }
});

export const getPublishedBySlug = cache(async (type: string, slug: string): Promise<Content | null> => {
  await connection();
  try {
    return await readPublished(apiBase(), type, slug) as Content | null;
  } catch { return null; }
});
