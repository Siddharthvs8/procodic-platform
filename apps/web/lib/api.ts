export type Content = {
  id: string; type: string; title: string; slug: string; status: string;
  featured: boolean; displayOrder: number; data: Record<string, unknown>;
  seoTitle?: string | null; seoDescription?: string | null; publishedAt?: string | null;
  updatedAt?: string;
};

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

export function value(record: Content, key: string, fallback = ""): string {
  const item = record.data?.[key];
  return typeof item === "string" ? item : fallback;
}

export function stringList(record: Content, key: string): string[] {
  const item = record.data?.[key];
  return Array.isArray(item) ? item.filter((value): value is string => typeof value === "string") : [];
}
