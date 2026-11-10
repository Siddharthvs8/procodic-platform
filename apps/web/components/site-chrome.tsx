"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  return <>
    {!admin && <SiteHeader />}
    {admin ? children : <div className="route-transition" key={pathname}>{children}</div>}
    {!admin && <SiteFooter />}
  </>;
}
