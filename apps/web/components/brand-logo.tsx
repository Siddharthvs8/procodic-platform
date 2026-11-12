"use client";

import { useEffect, useState } from "react";

export const DEFAULT_LOGO = "/brand/procodic-logo.png";
export const BRAND_EVENT = "procodic-brand-updated";
export const BRAND_API = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4000/api");

export function BrandLogo({ priority = false }: { priority?: boolean }) {
  const [src, setSrc] = useState(DEFAULT_LOGO);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch(`${BRAND_API}/settings/brand`, { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(result => { if (active && typeof result.data?.logoUrl === "string") setSrc(result.data.logoUrl); })
      .catch(() => {});
    void refresh();
    window.addEventListener(BRAND_EVENT, refresh);
    return () => { active = false; window.removeEventListener(BRAND_EVENT, refresh); };
  }, []);
  return <img src={src} width={1313} height={265} alt="PROCODIC" loading={priority ? "eager" : "lazy"} style={{ objectFit: "contain" }} onError={() => setSrc(DEFAULT_LOGO)} />;
}
