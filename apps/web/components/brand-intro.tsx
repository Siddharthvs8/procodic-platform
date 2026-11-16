"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { BrandLogo, useBrandLogo } from "./brand-logo";
import { BRAND_INTRO } from "@/lib/brand-intro";

export function BrandIntro() {
  const intro = useRef<HTMLDivElement>(null);
  const logo = useBrandLogo();
  function finish(moveFocus = false) {
    const skipHadFocus = document.activeElement === intro.current?.querySelector("button");
    delete document.documentElement.dataset.brandIntro;
    delete document.documentElement.dataset.brandIntroExit;
    delete document.documentElement.dataset.brandIntroStarted;
    const content = document.getElementById("site-content");
    if (content) { content.inert = false; content.removeAttribute("aria-hidden"); }
    try { sessionStorage.setItem(BRAND_INTRO.storageKey, "seen"); } catch { /* Private browsing. */ }
    if (moveFocus || skipHadFocus) {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
  }
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.brandIntro !== "on") return;
    const content = document.getElementById("site-content");
    if (content) { content.inert = true; content.setAttribute("aria-hidden", "true"); }
    const started = Number(root.dataset.brandIntroStarted ?? performance.now());
    const elapsed = () => performance.now() - started;
    let cancelled = false;
    let revealTimer = 0, completionTimer = 0, firstFrame = 0, secondFrame = 0;
    let readinessObserver: MutationObserver | undefined;
    const reveal = () => {
      if (cancelled || root.dataset.brandIntro !== "on" || root.dataset.brandIntroExit) return;
      // Keep the primary attribute until the crossfade ends; Pip observes it too.
      root.dataset.brandIntroExit = "on";
      completionTimer = window.setTimeout(() => finish(), BRAND_INTRO.exitMs + 80);
    };
    // Only the first screen matters here. Streamed below-fold data never gates the reveal.
    const prepareFirstScreen = () => {
      if (!content?.querySelector("main")) return;
      readinessObserver?.disconnect();
      const images = Array.from(content.querySelectorAll<HTMLImageElement>("img"))
        .filter(image => { const bounds = image.getBoundingClientRect(); return bounds.top < window.innerHeight && bounds.bottom > 0; });
      Promise.allSettled(images.map(image => typeof image.decode === "function" ? image.decode() : Promise.resolve())).then(() => {
        if (cancelled || root.dataset.brandIntro !== "on") return;
        firstFrame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(() => {
            revealTimer = window.setTimeout(reveal, Math.max(0, BRAND_INTRO.holdMs - elapsed()));
          });
        });
      });
    };
    readinessObserver = new MutationObserver(prepareFirstScreen);
    if (content) readinessObserver.observe(content, { childList:true, subtree:true });
    prepareFirstScreen();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.documentElement.dataset.brandIntro === "on") finish(true);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPreference = () => { if (reduced.matches) finish(); };
    if (reduced.matches) finish();
    // Deadlines are measured from the bootstrap, not from delayed hydration.
    const deadline = window.setTimeout(reveal, Math.max(0, BRAND_INTRO.deadlineMs - elapsed()));
    const failsafe = window.setTimeout(() => finish(), Math.max(0, BRAND_INTRO.failsafeMs - elapsed()));
    document.addEventListener("keydown", onKey);
    reduced.addEventListener("change", onPreference);
    return () => {
      cancelled = true;
      readinessObserver?.disconnect();
      [revealTimer, completionTimer, deadline, failsafe].forEach(clearTimeout);
      cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame);
      document.removeEventListener("keydown", onKey); reduced.removeEventListener("change", onPreference);
      if (content) { content.inert = false; content.removeAttribute("aria-hidden"); }
    };
  }, []);
  return <div ref={intro} className="brand-intro" style={{ "--intro-exit": `${BRAND_INTRO.exitMs}ms`, "--intro-deadline": `${BRAND_INTRO.deadlineMs}ms` } as CSSProperties} onAnimationEnd={event => { if (event.target === intro.current && ["brand-intro-exit", "brand-intro-fallback"].includes(event.animationName)) finish(); }}>
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
