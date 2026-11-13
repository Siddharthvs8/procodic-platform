import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return <footer className="site-footer premium-footer"><div className="container">
    <div className="footer-grid">
      <div className="footer-brand"><Link className="footer-brand-link" href="/" aria-label="PROCODIC home"><BrandLogo /></Link><p>Good technology makes<br />better work possible.</p><span className="footer-signature"><span aria-hidden="true" /> Code. Create. Elevate.</span></div>
      <div className="footer-column"><h3>What we do</h3><Link href="/products">Software products</Link><Link href="/ai-research">Applied AI</Link><Link href="/training">Learning & training</Link><Link href="/case-studies">Our work</Link></div>
      <div className="footer-column"><h3>Get to know us</h3><Link href="/about">About PROCODIC</Link><Link href="/insights">Insights</Link><Link href="/collaborations">Collaborations</Link><Link href="/testimonials">Client stories</Link></div>
      <div className="footer-column footer-contact"><h3>Make your next move</h3><p>A business challenge.<br />A new idea. A better way to work.</p><Link href="/contact" className="footer-contact-link">Start a conversation <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} PROCODIC</span><span className="footer-note">Built with purpose. Designed to last.</span><div className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/admin/login">Admin</Link></div></div>
  </div></footer>;
}
