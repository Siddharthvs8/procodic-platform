import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact", description: "Talk to PROCODIC about enterprise software, applied AI, training and partnerships." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ category?: string; product?: string }> }) {
  const params = await searchParams;
  const allowed = ["general", "product-demo", "consultation", "custom-software", "ai-collaboration", "corporate-training", "partnership"];
  const category = allowed.includes(params.category ?? "") ? params.category! : "general";
  return <main><section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>Contact</span></nav><span className="eyebrow">Let’s get into it</span><h1>Tell us what you’re working on.</h1><p>Share the opportunity, the challenge or the idea. We’ll route your note to the right PROCODIC team.</p></div></section><section className="page-body"><div className="container detail-grid"><div className="detail-copy"><h2>Start with the problem.</h2><p>Whether you’re exploring a new enterprise platform, looking at practical AI adoption, or planning a training program, we’ll begin with your context and goals.</p><div className="principle-list" style={{ marginTop: 30 }}><article className="principle"><span className="n">01</span><div><h3>Enterprise software</h3><p>Product enquiries, custom applications and business automation.</p></div></article><article className="principle"><span className="n">02</span><div><h3>AI research & innovation</h3><p>Applied AI exploration, integrations and research collaborations.</p></div></article><article className="principle"><span className="n">03</span><div><h3>Training & development</h3><p>Corporate programs, practical workshops and professional learning.</p></div></article></div></div><div><ContactForm category={category} productSlug={params.product} /></div></div></section></main>;
}
