"use client";

import { useEffect, useRef } from "react";
import { BrandLogo, useBrandLogo } from "./brand-logo";

export function BrandIntro() {
  const intro = useRef<HTMLDivElement>(null);
  const logo = useBrandLogo();
  function finish(moveFocus = false) {
    const skipHadFocus = document.activeElement === intro.current?.querySelector("button");
    delete document.documentElement.dataset.brandIntro;
    try { sessionStorage.setItem("procodic-intro-v2", "seen"); } catch { /* Private browsing. */ }
    if (moveFocus || skipHadFocus) {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
  }
  useEffect(() => {
    if (document.documentElement.dataset.brandIntro !== "on") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.documentElement.dataset.brandIntro === "on") finish(true);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPreference = () => { if (reduced.matches) finish(); };
    // CSS also dismisses the veil independently if hydration is delayed.
    const timer = window.setTimeout(finish, 2300);
    document.addEventListener("keydown", onKey);
    reduced.addEventListener("change", onPreference);
    return () => { clearTimeout(timer); document.removeEventListener("keydown", onKey); reduced.removeEventListener("change", onPreference); };
  }, []);
  return <div ref={intro} className="brand-intro" onAnimationEnd={event => { if (event.target === intro.current && event.animationName === "brand-intro-exit") finish(); }}>
    <div className="brand-intro-atmosphere" aria-hidden="true" />
    <div className="brand-intro-orbit" aria-hidden="true"><i /><i /></div>
    <div className="brand-intro-particles" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
    <div className="brand-intro-stage">
      <div className="brand-intro-streaks" aria-hidden="true"><i /><i /><i /></div>
      <div className="brand-intro-logo"><BrandLogo priority /><span className="brand-intro-glint" style={{ maskImage: `url(${JSON.stringify(logo)})` }} aria-hidden="true"><i /></span></div>
      <p className="brand-intro-tagline" aria-hidden="true"><span>CODE.</span><span>CREATE.</span><span>ELEVATE.</span></p>
    </div>
    <button type="button" className="brand-intro-skip" onClick={() => finish(true)}>Skip intro <span aria-hidden="true">↗</span></button>
  </div>;
}
