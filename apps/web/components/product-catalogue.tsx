"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Content } from "@/lib/api";
import { value } from "@/lib/api";
import { ProductCard } from "@/components/product-card";

export function ProductCatalogue({ products }: { products: Content[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All products");
  const categories = ["All products", ...Array.from(new Set(products.map((item) => value(item, "category", "Enterprise software"))))];
  const filtered = useMemo(() => products.filter((item) => {
    const matchesCategory = category === "All products" || value(item, "category", "Enterprise software") === category;
    const matchesQuery = `${item.title} ${value(item, "description")} ${value(item, "tagline")}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, products, query]);
  if (!products.length) return <div className="empty-card catalogue-empty">
    <div>
      <span className="eyebrow">Product development</span>
      <h2>Built around how your team works.</h2>
      <p>We shape software around the people, processes and decisions behind the work. Tell us what your team wants to make simpler.</p>
      <Link className="text-link" href="/contact?category=custom-software">Talk through a workflow <span aria-hidden>→</span></Link>
    </div>
  </div>;
  return <>
    <div className="admin-toolbar" style={{ marginBottom: 24 }}><label style={{ position: "relative", maxWidth: 400, flex: 1 }}><Search size={15} style={{ position: "absolute", left: 12, top: 13, color: "#8291a7" }} /><input className="admin-input" style={{ paddingLeft: 36 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" aria-label="Search products" /></label><select className="admin-select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
    {filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-card"><div><strong>{products.length ? "No products match that search." : "A product catalogue shaped around real business needs."}</strong><p>{products.length ? "Try another name or category." : "Published PROCODIC products will appear here. In the meantime, explore the capabilities behind the portfolio."}</p></div></div>}
  </>;
}
