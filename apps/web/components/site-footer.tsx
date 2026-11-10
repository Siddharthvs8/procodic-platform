import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-grid">
      <div className="footer-brand"><Link href="/" aria-label="PROCODIC home"><Image src="/brand/procodic-logo.png" alt="PROCODIC" width={1313} height={265} /></Link><p>We engineer intelligent software and practical AI for businesses ready to move forward.</p><span className="eyebrow">Code. Create. Elevate.</span></div>
      <div className="footer-column"><h3>Explore</h3><Link href="/products">Products</Link><Link href="/case-studies">Case studies</Link><Link href="/testimonials">Testimonials</Link><Link href="/collaborations">Collaborations</Link><Link href="/ai-research">AI research</Link><Link href="/training">Training</Link></div>
      <div className="footer-column"><h3>Company</h3><Link href="/about">About PROCODIC</Link><Link href="/insights">Insights</Link><Link href="/contact">Contact</Link><Link href="/admin/login">Admin sign in</Link></div>
      <div className="footer-column"><h3>Start a conversation</h3><Link href="/contact">Discuss a project ↗</Link><p style={{ color: "var(--muted)", fontSize: 12, marginTop: 14 }}>Have a business challenge or an ambitious idea? Tell us what you are working on.</p></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} PROCODIC. All rights reserved.</span><div className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
  </div></footer>;
}
