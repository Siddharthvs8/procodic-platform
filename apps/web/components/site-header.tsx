"use client";

import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  ["Products", "/products", "Software for the way you work"],
  ["Applied AI", "/ai-research", "Research with a practical purpose"],
  ["Learning", "/training", "Build your team's capabilities"],
  ["Company", "/about", "Meet PROCODIC"],
  ["Insights", "/insights", "Ideas from our work"],
];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); }
    };
    const onResize = () => { if (window.innerWidth > 1020) setOpen(false); };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!mobileMenu.current?.contains(target) && !menuButton.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); window.removeEventListener("resize", onResize); };
  }, [open]);
  const active = (href: string) => path === href || path.startsWith(`${href}/`);
  return <header className="site-header premium-header"><div className="container header-inner">
    <Link className="brand" href="/" aria-label="PROCODIC home"><BrandLogo priority /></Link>
    <nav className="nav-links" aria-label="Main navigation">{links.map(([label, href]) => <Link key={href} className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined} href={href}>{label}</Link>)}</nav>
    <div className="header-controls"><ThemeToggle /><Link className="button header-cta" href="/contact">Let’s build together <ArrowUpRight size={15} aria-hidden="true" /></Link><button ref={menuButton} type="button" className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(value => !value)}>{open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}</button></div>
    {open && <nav ref={mobileMenu} id="mobile-navigation" className="mobile-menu" aria-label="Mobile navigation"><p className="mobile-nav-label">Explore PROCODIC</p>{links.map(([label, href, description], index) => <Link key={href} aria-current={active(href) ? "page" : undefined} href={href} onClick={() => setOpen(false)}><span className="mobile-nav-index">0{index + 1}</span><span><strong>{label}</strong><small>{description}</small></span><ArrowUpRight size={18} aria-hidden="true" /></Link>)}<Link className="button mobile-nav-cta" href="/contact" onClick={() => setOpen(false)}>Tell us what you’re building <ArrowUpRight size={17} aria-hidden="true" /></Link></nav>}
  </div></header>;
}
