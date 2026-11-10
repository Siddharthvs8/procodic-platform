"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

type ScrollRevealProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "style"> & {
  children: ReactNode;
  className: string;
  delay?: number;
  stagger?: boolean;
  from?: "up" | "right";
  style?: CSSProperties;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  stagger = false,
  from = "up",
  style,
  ...attributes
}: ScrollRevealProps) {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = revealRef.current;
    if (!element) return;

    const items = stagger ? Array.from(element.children) as HTMLElement[] : [];
    items.forEach((item, index) => item.style.setProperty("--motion-index", String(index)));

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      element.classList.add("motion-visible");
      return;
    }

    element.classList.add("motion-ready");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.classList.add("motion-visible");
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, [stagger]);

  return (
    <div
      {...attributes}
      ref={revealRef}
      className={`motion-reveal${stagger ? " motion-reveal-stagger" : ""} ${className}`}
      data-motion-from={from}
      style={{ ...style, "--motion-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
