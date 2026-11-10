import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getPublished, value } from "@/lib/api";

export const metadata: Metadata = { title: "Insights", description: "Perspectives on enterprise software, applied AI and business automation from PROCODIC." };

export default async function InsightsPage() {
  const articles = await getPublished("articles");
  return <main><section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>Insights</span></nav><span className="eyebrow">Notes from PROCODIC</span><h1>Ideas for building what’s next.</h1><p>Thoughtful perspectives on enterprise products, AI innovation and the systems that help businesses do better work.</p></div></section><section className="page-body"><div className="container">{articles.length ? <div className="content-grid">{articles.map((article)=><article className="case-card" key={article.id}><span className="tag">{value(article,"category","Insight")}</span><h3>{article.title}</h3><p>{value(article,"excerpt",value(article,"description"))}</p><Link className="text-link" href={`/insights/${article.slug}`}>Read insight <ArrowRight size={14} /></Link></article>)}</div> : <div className="empty-card"><div><strong>Good ideas are worth getting right.</strong><p>New notes on enterprise software, CRM technology, applied AI and digital work will be published here.</p></div><BookOpen size={23} color="#4faeff" /></div>}</div></section></main>;
}
