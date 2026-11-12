"use client";

import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  ["Products", "/products"], ["AI Research", "/ai-research"], ["Training", "/training"],
  ["Company", "/about"], ["Insights", "/insights"],
];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" href="/" aria-label="PROCODIC home"><BrandLogo priority /></Link>
    <nav className="nav-links" aria-label="Main navigation">{links.map(([label, href]) => <Link key={href} className={path === href || path.startsWith(`${href}/`) ? "active" : ""} href={href}>{label}</Link>)}</nav>
    <ThemeToggle />
    <Link className="button header-cta" href="/contact">Start a conversation <span aria-hidden>↗</span></Link>
    <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    {open && <nav className="mobile-menu" aria-label="Mobile navigation">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link className="button" href="/contact" onClick={() => setOpen(false)}>Start a conversation <span aria-hidden>↗</span></Link></nav>}
  </div></header>;
}
