"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Experience = dynamic(() => import("./experience"), { ssr: false });

/** Keep the character, Motion, and artwork out of the homepage's critical render. */
export function CompanionLoader({ pathname }: { pathname: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (loaded) return;
    try { if (sessionStorage.getItem("procodic-pip-introduced-v1")) { setLoaded(true); return; } } catch {}
    if (pathname !== "/") return;
    const anchor = document.querySelector(".ux-explorer-window");
    if (!anchor) return;
    if (!("IntersectionObserver" in window)) { setLoaded(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setLoaded(true); observer.disconnect(); }
    }, { rootMargin: "400px 0px" });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [pathname, loaded]);
  return loaded ? <Experience pathname={pathname} /> : null;
}
