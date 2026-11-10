import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublished, value } from "@/lib/api";

export const metadata: Metadata = { title: "Case Studies", description: "Selected software and innovation work from PROCODIC." };

export default async function CaseStudiesPage() {
  const cases = await getPublished("case-studies");
  return <main><section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>Case studies</span></nav><span className="eyebrow">Selected work</span><h1>Real challenges. Thoughtful engineering.</h1><p>We share case studies when client permission, context and outcomes are verified. No invented metrics or borrowed logos.</p></div></section><section className="page-body"><div className="container">{cases.length ? <div className="case-grid">{cases.map((item)=><article className="case-card" key={item.id}><span className="tag">{value(item,"industry","Project")}</span><h3>{item.title}</h3><p>{value(item,"overview",value(item,"challenge",value(item,"description")))}</p><Link className="text-link" href={`/case-studies/${item.slug}`}>View project <ArrowRight size={14} /></Link></article>)}</div> : <div className="empty-card"><div><strong>Case studies are being prepared.</strong><p>Published stories will include the challenge, the work delivered and verified outcomes. For now, let’s talk about the problem you are solving.</p></div><Link className="text-link" href="/contact">Discuss a project <ArrowRight size={15} /></Link></div>}</div></section></main>;
}
