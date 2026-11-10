import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { getPublished, value } from "@/lib/api";

export const metadata: Metadata = { title: "Testimonials", description: "Verified testimonials shared with permission by PROCODIC collaborators." };

export default async function TestimonialsPage() {
  const items = await getPublished("testimonials");
  return <main><section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>Testimonials</span></nav><span className="eyebrow">Voices from collaboration</span><h1>Good work comes from working well together.</h1><p>We share client and partner feedback only when it is verified and approved for publication.</p></div></section><section className="page-body"><div className="container">{items.length?<div className="testimonials-grid">{items.map(item=><figure className="testimonial-card" key={item.id}><Quote size={22} color="#57caff"/><blockquote>{value(item,"content",value(item,"quote"))}</blockquote><figcaption><strong>{value(item,"author","Verified collaborator")}</strong><span>{[value(item,"designation"),value(item,"company")].filter(Boolean).join(" · ")}</span></figcaption></figure>)}</div>:<div className="empty-card"><div><strong>No testimonials are published yet.</strong><p>Stories and feedback will appear here when they are confirmed and approved to share.</p></div><Link className="text-link" href="/contact">Start a conversation <ArrowRight size={15}/></Link></div>}</div></section></main>;
}
