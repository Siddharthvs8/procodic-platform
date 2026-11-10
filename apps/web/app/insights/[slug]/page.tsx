import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedBySlug, value } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const article = await getPublishedBySlug("articles", slug);
  return article ? { title: article.seoTitle || article.title, description: article.seoDescription || value(article, "excerpt", value(article, "description")) } : { title: "Insight not found" };
}
export default async function InsightPage({ params }: Props) {
  const { slug } = await params; const article = await getPublishedBySlug("articles", slug); if (!article) notFound();
  return <main><section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/insights">Insights</Link><span>/</span><span>{article.title}</span></nav><span className="eyebrow">{value(article,"category","Insight")}</span><h1>{article.title}</h1><p>{value(article,"excerpt",value(article,"description"))}</p></div></section><section className="page-body"><article className="container" style={{ maxWidth: 840 }}><div className="detail-copy" style={{ whiteSpace: "pre-wrap" }}>{value(article,"body",value(article,"content",value(article,"description")))}</div></article></section></main>;
}
