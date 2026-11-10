export type Content = {
  id: string; type: string; title: string; slug: string; status: string;
  featured: boolean; displayOrder: number; data: Record<string, unknown>;
  seoTitle?: string | null; seoDescription?: string | null; publishedAt?: string | null;
  updatedAt?: string;
};

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function isSafeMediaUrl(input: string): boolean {
  if (input.startsWith("/")) {
    try { return new URL(input, "https://procodic.invalid").origin === "https://procodic.invalid"; }
    catch { return false; }
  }
  try {
    const url = new URL(input);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch { return false; }
}

export function mediaUrl(input: string): string {
  return isSafeMediaUrl(input) ? input : "";
}

export async function getPublished(type: string): Promise<Content[]> {
  try {
    const response = await fetch(`${apiBase()}/content/${encodeURIComponent(type)}`, { cache: "no-store" });
    if (!response.ok) return [];
    const result = await response.json() as { data?: Content[] };
    return Array.isArray(result.data) ? result.data : [];
  } catch { return []; }
}

export async function getPublishedBySlug(type: string, slug: string): Promise<Content | null> {
  try {
    const response = await fetch(`${apiBase()}/content/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const result = await response.json() as { data?: Content };
    return result.data ?? null;
  } catch { return null; }
}

export function value(record: Content, key: string, fallback = ""): string {
  const item = record.data?.[key];
  return typeof item === "string" ? item : fallback;
}

export function stringList(record: Content, key: string): string[] {
  const item = record.data?.[key];
  return Array.isArray(item) ? item.filter((value): value is string => typeof value === "string") : [];
}
