import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import type { Content } from "@/lib/api";
import { mediaUrl, value } from "@/lib/api";

export function ProductCard({ product }: { product: Content }) {
  const logo = mediaUrl(value(product, "logoUrl"));
  return <article className="product-card journey-product-card"><div className="product-top"><span className="product-mark">{logo ? <img src={logo} alt="" width={40} height={40} loading="lazy" /> : <Layers3 size={24} strokeWidth={1.6} aria-hidden="true" />}</span><span className="product-tag">{value(product, "category", "Enterprise software")}</span></div><h3><Link href={`/products/${product.slug}`}>{product.title}</Link></h3><p>{value(product, "tagline", value(product, "description", "Software designed around your business."))}</p><span className="product-explore" aria-hidden="true">Explore product <ArrowUpRight size={18} /></span></article>;
}
