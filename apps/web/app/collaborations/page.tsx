import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Handshake } from "lucide-react";
import { getPublished, mediaUrl, value } from "@/lib/api";

export const metadata: Metadata = { title: "Collaborations", description: "Verified technology and strategic collaborations with PROCODIC." };

export default async function CollaborationsPage() {
  const partners = await getPublished("collaborations");
  return <main><section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>Collaborations</span></nav><span className="eyebrow">Working together</span><h1>Strong partnerships create better outcomes.</h1><p>We value collaborations that bring useful expertise, thoughtful technology and shared commitment to the work.</p></div></section><section className="page-body"><div className="container">{partners.length?<div className="partner-grid">{partners.map(partner=>{const url=value(partner,"websiteUrl");const logo=mediaUrl(value(partner,"logoUrl"));const body=<><div className="partner-mark">{logo?<img src={logo} alt={`${partner.title} logo`} loading="lazy"/>:<Handshake size={22}/>}</div><strong>{partner.title}</strong><span>{value(partner,"category","Collaboration")}</span><p>{value(partner,"description")}</p>{url.startsWith("https://")&&<small>Visit partner <ArrowUpRight size={12}/></small>}</>;return url.startsWith("https://")?<a className="partner-card" href={url} target="_blank" rel="noreferrer" key={partner.id}>{body}</a>:<article className="partner-card" key={partner.id}>{body}</article>})}</div>:<div className="empty-card"><div><strong>Partnership details are being prepared.</strong><p>We’ll share collaborations here when the relationship and details are confirmed for publication.</p></div><Link className="text-link" href="/contact?category=partnership">Explore a partnership <ArrowUpRight size={15}/></Link></div>}</div></section></main>;
}
