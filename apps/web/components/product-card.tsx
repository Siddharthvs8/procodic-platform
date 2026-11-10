import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import type { Content } from "@/lib/api";
import { mediaUrl, value } from "@/lib/api";

export function ProductCard({ product }: { product: Content }) {
  const logo = mediaUrl(value(product, "logoUrl"));
  return <article className="product-card"><div className="product-top">{logo ? <img src={logo} alt={`${product.title} logo`} width={42} height={42} style={{ objectFit:"contain", background:"rgba(255,255,255,.04)", border:"1px solid var(--line)", padding:5 }} /> : <span className="product-mark"><Layers3 size={18} /></span>}<span className="product-tag">{value(product, "category", "Enterprise software")}</span></div><h3>{product.title}</h3><p>{value(product, "tagline", value(product, "description", "A PROCODIC software product built for modern business."))}</p><Link href={`/products/${product.slug}`} className="text-link">Explore product <ArrowUpRight className="arrow" size={15} /></Link></article>;
}
