import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Layers3 } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublishedBySlug, isSafeMediaUrl, stringList, value } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedBySlug("products", slug);
  if (!product) return { title: "Product not found" };
  return { title: product.seoTitle || product.title, description: product.seoDescription || value(product, "description", value(product, "tagline")) };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublishedBySlug("products", slug);
  if (!product) notFound();
  const features = stringList(product, "features");
  const industries = stringList(product, "industries");
  const screenshots = stringList(product, "screenshots").filter(isSafeMediaUrl);
  return <main>
    <section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/products">Products</Link><span>/</span><span>{product.title}</span></nav><span className="eyebrow">{value(product, "category", "Enterprise software")}</span><h1>{product.title}</h1><p>{value(product, "tagline", value(product, "description"))}</p><div className="hero-actions" style={{ marginTop: 26 }}><Link className="button" href={`/contact?category=product-demo&product=${encodeURIComponent(product.slug)}`}>Request a conversation <ArrowRight size={15} /></Link><Link className="button secondary" href="/contact">Contact sales</Link></div></div></section>
    <section className="page-body"><div className="container">
      <div className="detail-grid"><div className="detail-copy"><h2>Built for business as it works.</h2><p>{value(product, "overview", value(product, "description", "A focused software experience designed to make complex work clearer, connected and easier to manage."))}</p>{value(product, "problems") && <><h2 style={{ marginTop: 38 }}>The challenge it addresses</h2><p>{value(product, "problems")}</p></>}</div><aside className="detail-panel"><h3><Layers3 size={17} style={{ verticalAlign: "-3px", marginRight: 8, color: "var(--cyan)" }} />Product capabilities</h3>{features.length ? <ul>{features.map((item)=><li key={item}><Check size={14} style={{ color: "var(--cyan)", marginRight: 7, verticalAlign: "-2px" }} />{item}</li>)}</ul> : <p style={{ color: "var(--muted)", fontSize: 13 }}>Capabilities are being prepared. Contact us to discuss the product.</p>}{industries.length > 0 && <><h3 style={{ marginTop: 28 }}>Designed for</h3><p style={{ color: "var(--muted)", fontSize: 13 }}>{industries.join(" · ")}</p></>}</aside></div>
      {screenshots.length > 0 && <section style={{ marginTop: 70 }}><div className="section-head"><div><span className="eyebrow">Product tour</span><h2>A closer look.</h2></div></div><div className="content-grid">{screenshots.map((src,index)=><figure key={`${src}-${index}`} style={{ margin:0, border:"1px solid var(--line)", background:"var(--panel)", padding:8 }}><img src={src} alt={`${product.title} screenshot ${index+1}`} loading="lazy" decoding="async" style={{ display:"block", width:"100%", height:"auto", aspectRatio:"16 / 10", objectFit:"cover" }} /></figure>)}</div></section>}
    </div></section><section className="section" style={{ paddingTop: 0 }}><div className="container"><div className="cta-panel"><div><span className="eyebrow">Let’s talk about {product.title}</span><h2>See how it fits your business.</h2><p>Share your priorities and we’ll help you plan a useful next step.</p></div><Link className="button" href={`/contact?category=product-demo&product=${encodeURIComponent(product.slug)}`}>Request a demo <ArrowRight size={15} /></Link></div></div></section>
  </main>;
}
