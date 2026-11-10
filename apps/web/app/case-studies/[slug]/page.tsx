import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedBySlug, stringList, value } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const item = await getPublishedBySlug("case-studies", slug);
  return item ? { title: item.seoTitle || item.title, description: item.seoDescription || value(item,"overview",value(item,"description")) } : { title: "Case study not found" };
}
export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params; const item = await getPublishedBySlug("case-studies", slug); if (!item) notFound();
  const tech = stringList(item,"technologies");
  return <main><section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/case-studies">Case studies</Link><span>/</span><span>{item.title}</span></nav><span className="eyebrow">{value(item,"industry","Selected work")}</span><h1>{item.title}</h1><p>{value(item,"overview",value(item,"description"))}</p></div></section><section className="page-body"><div className="container detail-grid"><div className="detail-copy"><h2>The challenge</h2><p>{value(item,"problem",value(item,"challenge"))}</p><h2 style={{marginTop:35}}>The solution</h2><p>{value(item,"solution",value(item,"approach"))}</p>{value(item,"results")&&<><h2 style={{marginTop:35}}>Outcomes</h2><p>{value(item,"results")}</p></>}</div><aside className="detail-panel"><h3>Project details</h3><p style={{color:"var(--muted)",fontSize:13}}>{value(item,"client","Client details shared with permission")}</p>{tech.length>0&&<><h3 style={{marginTop:25}}>Technologies</h3><ul>{tech.map(t=><li key={t}>{t}</li>)}</ul></>}</aside></div></section></main>;
}
