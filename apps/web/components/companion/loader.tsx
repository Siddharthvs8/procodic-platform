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
    // Leave initial bandwidth/CPU to the first screen while the logo veil is up.
    const check = () => {
      const bounds = anchor.getBoundingClientRect();
      if (!document.documentElement.dataset.brandIntro && bounds.top < window.innerHeight + 120 && bounds.bottom > 0) setLoaded(true);
    };
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(check, { rootMargin: "120px 0px" }) : null;
    observer?.observe(anchor);
    const introObserver = new MutationObserver(check);
    introObserver.observe(document.documentElement, { attributes:true, attributeFilter:["data-brand-intro"] });
    if (!observer) window.addEventListener("scroll",check,{passive:true});
    check();
    return () => { observer?.disconnect(); introObserver.disconnect(); window.removeEventListener("scroll",check); };
  }, [pathname, loaded]);
  return loaded ? <Experience pathname={pathname} /> : null;
}
