"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  return <>
    {!admin && <a className="public-skip-link" href="#main-content">Skip to content</a>}
    {!admin && <SiteHeader />}
    {admin ? children : <div className="route-transition" id="main-content" tabIndex={-1} key={pathname}>{children}</div>}
    {!admin && <SiteFooter />}
  </>;
}
