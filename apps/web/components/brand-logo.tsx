"use client";

import { useSyncExternalStore } from "react";

export const DEFAULT_LOGO = "/brand/procodic-logo.png";
export const OPTIMIZED_LOGO = "/brand/procodic-logo-refined.webp";
export const BRAND_EVENT = "procodic-brand-updated";
export const BRAND_API = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4000/api");

let logo = OPTIMIZED_LOGO;
let requested = false;
let requestVersion = 0;
const listeners = new Set<() => void>();
function publish(value: string) {
  logo = value === DEFAULT_LOGO ? OPTIMIZED_LOGO : value;
  listeners.forEach(listener => listener());
}
async function refresh() {
  const version = ++requestVersion;
  try {
    const response = await fetch(`${BRAND_API}/settings/brand`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return;
    const result = await response.json();
    if (version === requestVersion && typeof result.data?.logoUrl === "string") publish(result.data.logoUrl);
  } catch { /* The bundled logo is immediately usable even when the API is unavailable. */ }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener(BRAND_EVENT, refresh);
  if (!requested) { requested = true; void refresh(); }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener(BRAND_EVENT, refresh);
  };
}

export function useBrandLogo() {
  return useSyncExternalStore(subscribe, () => logo, () => OPTIMIZED_LOGO);
}

export function BrandLogo({ priority = false }: { priority?: boolean }) {
  const src = useBrandLogo();
  return <img src={src} width={1200} height={233} alt="PROCODIC" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" style={{ objectFit: "contain" }} onError={() => { if (logo !== OPTIMIZED_LOGO) publish(OPTIMIZED_LOGO); }} />;
}
