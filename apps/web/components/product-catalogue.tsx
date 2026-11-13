"use client";

import { ArrowUpRight, Layers3, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Content } from "@/lib/api";
import { value } from "@/lib/api";
import { ProductCard } from "@/components/product-card";

export function ProductCatalogue({ products }: { products: Content[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const categories = Array.from(new Set(products.map(item => value(item, "category", "Enterprise software"))));
  const filtered = useMemo(() => products.filter(item => {
    const matchesCategory = !category || value(item, "category", "Enterprise software") === category;
    const matchesQuery = `${item.title} ${value(item, "category")} ${value(item, "description")} ${value(item, "tagline")}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, products, query]);
  function clearFilters() { setQuery(""); setCategory(""); }

  if (!products.length) return <div className="catalogue-intro-panel">
    <div className="catalogue-intro-icon" aria-hidden="true"><Layers3 size={30} strokeWidth={1.5} /></div>
    <div><span className="journey-eyebrow">Your workflow. Your software.</span><h2>Good software starts with a real problem.</h2><p>We build around your team’s processes, decisions and goals. Let’s explore what you could make simpler.</p><Link className="button" href="/contact?category=custom-software">Discuss your project <ArrowUpRight size={17} /></Link></div>
  </div>;

  return <div className="catalogue">
    <div className="catalogue-toolbar"><div><span className="journey-eyebrow">Explore the portfolio</span><h2>Find your next advantage.</h2></div><div className="catalogue-search"><Search size={18} aria-hidden="true" /><label className="journey-sr-only" htmlFor="catalogue-search">Search products</label><input id="catalogue-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products…" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</div></div>
    <div className="catalogue-filters" aria-label="Filter products by category"><button type="button" aria-pressed={!category} onClick={() => setCategory("")}>All products <span>{products.length}</span></button>{categories.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="catalogue-results"><p role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? "product" : "products"}{query.trim() ? ` matching “${query.trim()}”` : category ? ` in ${category}` : " to explore"}</p>{(query || category) && <button type="button" onClick={clearFilters}>Reset filters <X size={13} aria-hidden="true" /></button>}</div>
    {filtered.length ? <div className="product-grid journey-product-grid">{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="catalogue-no-results"><Search size={26} aria-hidden="true" /><h3>No products found.</h3><p>Try a different keyword or explore the full portfolio.</p><button className="button secondary" type="button" onClick={clearFilters}>Clear all filters</button></div>}
  </div>;
}
