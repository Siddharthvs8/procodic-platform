import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCatalogue } from "@/components/product-catalogue";
import { getPublished } from "@/lib/api";

export const metadata: Metadata = { title: "Products", description: "Explore PROCODIC enterprise software products and business applications." };

export default async function ProductsPage() {
  const products = await getPublished("products");
  return <main><section className="page-hero"><div className="container"><nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>Products</span></nav><span className="eyebrow">Software portfolio</span><h1>Tools for the work that matters.</h1><p>{products.length ? "Focused enterprise products and business applications that bring clarity to complex work. Search the catalogue or explore the thinking behind our software." : "We design business software around the people, processes and decisions that make work move."}</p></div></section><section className="page-body"><div className="container"><ProductCatalogue products={products} />{products.length > 0 && <div style={{ marginTop: 55, paddingTop: 28, borderTop: "1px solid var(--line)" }}><span className="eyebrow">Looking for something specific?</span><p style={{ color: "var(--muted)", margin: "10px 0 18px" }}>Tell us about your workflow, systems or product idea. We’ll help you find the right next step.</p><Link className="text-link" href="/contact">Talk to our team <ArrowRight size={15} /></Link></div>}</div></section></main>;
}
