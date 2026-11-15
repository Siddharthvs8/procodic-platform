import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./brand-experience.css";
import "./editorial-site.css";
import "./editorial-home.css";
import "./public-premium.css";
import "./navigation-premium.css";
import "./journey-premium.css";
import "./brand-intro.css";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://procodic.com"),
  title: { default: "PROCODIC — Code. Create. Elevate.", template: "%s — PROCODIC" },
  description: "We engineer enterprise software, intelligent automation and applied AI solutions for ambitious businesses.",
  openGraph: { type: "website", siteName: "PROCODIC", title: "PROCODIC — Code. Create. Elevate.", description: "Engineering intelligent business." },
  twitter: { card: "summary_large_image", title: "PROCODIC — Code. Create. Elevate.", description: "Engineering intelligent business." },
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f2ed" }, { media: "(prefers-color-scheme: dark)", color: "#111416" }], width: "device-width", initialScale: 1 };

const themeBootstrap = `try {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const saved = window.localStorage.getItem('procodic-theme');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = isAdmin ? 'dark' : (saved || preferred);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.content = theme === 'dark' ? '#111416' : '#f4f2ed';
} catch {
  document.documentElement.dataset.theme = 'light';
}`;

const introBootstrap = `try {
  if (!location.pathname.startsWith('/admin') && !sessionStorage.getItem('procodic-intro-v2') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.dataset.brandIntro = 'on';
    setTimeout(function () { delete document.documentElement.dataset.brandIntro; }, 2400);
    sessionStorage.setItem('procodic-intro-v2', 'seen');
  }
} catch {}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><link rel="preload" as="image" href="/brand/procodic-logo-refined.webp" /><script dangerouslySetInnerHTML={{ __html: themeBootstrap + introBootstrap }} /></head>
      <body><SiteChrome>{children}</SiteChrome></body>
    </html>
  );
}
