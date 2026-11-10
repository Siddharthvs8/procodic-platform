import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getPublished, mediaUrl, value, type Content } from "@/lib/api";
import { HeroGraphic } from "@/components/hero-graphic";
import { ScrollReveal } from "@/components/scroll-reveal";

const services = [
  {
    number: "01",
    title: "Software, made for your business",
    description: "Thoughtful digital products and business systems, shaped around the way your people actually work.",
    href: "/products",
    link: "Explore software",
  },
  {
    number: "02",
    title: "AI, applied with purpose",
    description: "Practical machine learning and automation that solve a real problem and earn a place in the workflow.",
    href: "/ai-research",
    link: "Explore applied AI",
  },
  {
    number: "03",
    title: "People, ready for what’s next",
    description: "Clear, hands-on learning that gives teams the skills and judgement to use new technology well.",
    href: "/training",
    link: "Explore learning",
  },
];

const approach = [
  ["Understand the work", "We start with the people, decisions and constraints behind the brief."],
  ["Choose what fits", "We bring research and engineering together around the outcome that matters."],
  ["Build for what changes", "We make systems that are useful now and ready to grow with the business."],
];

const industries = [
  "Healthcare", "Education", "Financial services", "Retail & commerce", "Manufacturing", "Professional services",
];

function Partner({ item }: { item: Content }) {
  const logo = mediaUrl(value(item, "logoUrl"));
  const url = value(item, "websiteUrl");
  const content = <>
    {logo && <img src={logo} alt="" loading="lazy" />}
    <span>{item.title}</span>
    {url.startsWith("https://") && <ArrowUpRight size={14} aria-hidden />}
  </>;
  return url.startsWith("https://")
    ? <a className="eh-partner" href={url} target="_blank" rel="noreferrer">{content}</a>
    : <span className="eh-partner">{content}</span>;
}

export default async function HomePage() {
  const [publishedProducts, articles, publishedIndustries, testimonials, collaborations] = await Promise.all([
    getPublished("products"),
    getPublished("articles"),
    getPublished("industries"),
    getPublished("testimonials"),
    getPublished("collaborations"),
  ]);
  const featuredProducts = publishedProducts.filter((item) => item.featured).slice(0, 3);
  const products = featuredProducts.length ? featuredProducts : publishedProducts.slice(0, 3);

  return <main className="editorial-home">
    <section className="eh-hero">
      <div className="eh-shell eh-hero-layout">
        <ScrollReveal className="eh-hero-copy" delay={70}>
          <p className="eh-kicker">Software <span>·</span> Applied AI <span>·</span> Learning</p>
          <h1>Make room for <em>better work.</em></h1>
          <p className="eh-intro">We build useful software, bring AI into the right workflows, and help people put it to work.</p>
          <div className="eh-actions">
            <Link className="eh-button eh-button-dark" href="/contact">Talk with our team <ArrowUpRight size={16} /></Link>
            <Link className="eh-text-link" href="/products">See what we do <ArrowRight size={15} /></Link>
          </div>
        </ScrollReveal>
        <ScrollReveal className="eh-visual" delay={150} from="right" aria-hidden="true">
          <HeroGraphic />
        </ScrollReveal>
      </div>
      <div className="eh-shell eh-hero-foot"><span>Technology with the business in mind.</span><span>PROCODIC&nbsp; / &nbsp;CODE. CREATE. ELEVATE.</span></div>
    </section>

    <section className="eh-services eh-section">
      <div className="eh-shell">
        <ScrollReveal className="eh-section-heading" delay={40}>
          <div><p className="eh-overline">What we do</p><h2>Thoughtful technology.<br /><em>Practical outcomes.</em></h2></div>
          <p>From a first conversation to a working system, we bring the right people and disciplines around the problem.</p>
        </ScrollReveal>
        <ScrollReveal className="eh-service-list" delay={100} stagger>{services.map((service) => <article className="eh-service" key={service.number}>
          <span className="eh-number">{service.number}</span>
          <div><h3>{service.title}</h3><p>{service.description}</p></div>
          <Link href={service.href} className="eh-service-link">{service.link}<ArrowUpRight size={15} /></Link>
        </article>)}</ScrollReveal>
      </div>
    </section>

    <section className="eh-approach eh-section">
      <div className="eh-shell">
        <ScrollReveal className="eh-approach-heading" delay={40}><p className="eh-overline">How we work</p><h2>Start with the work.<br /><em>Make the path clearer.</em></h2><p>Good technology should fit the business, help people do their best work and keep making sense as things change.</p></ScrollReveal>
        <ScrollReveal className="eh-approach-list" delay={100} stagger>{approach.map(([title, description], index) => <article className="eh-approach-item" key={title}>
          <span>0{index + 1}</span><h3>{title}</h3><p>{description}</p>
        </article>)}</ScrollReveal>
      </div>
    </section>

    {products.length > 0 && <section className="eh-products eh-section">
      <div className="eh-shell">
        <ScrollReveal className="eh-section-heading" delay={40}><div><p className="eh-overline">Selected products</p><h2>Made for the work<br /><em>ahead.</em></h2></div><Link className="eh-text-link" href="/products">View all products <ArrowRight size={15} /></Link></ScrollReveal>
        <ScrollReveal className="eh-product-list" delay={100} stagger>{products.map((product) => <Link className="eh-product" href={"/products/" + product.slug} key={product.id}>
          <div>{value(product, "category", "Product")}</div><h3>{product.title}</h3><p>{value(product, "excerpt", value(product, "description", "Explore this PROCODIC product."))}</p><ArrowUpRight size={18} />
        </Link>)}</ScrollReveal>
      </div>
    </section>}

    <section className="eh-industries eh-section">
      <ScrollReveal className="eh-shell eh-industries-layout" delay={70}>
        <div><p className="eh-overline">Across industries</p><h2>Context changes<br /><em>the answer.</em></h2></div>
        <div><p className="eh-industries-copy">We work with teams facing different rules, rhythms and responsibilities.</p><p className="eh-industry-list">{(publishedIndustries.length ? publishedIndustries.map((item) => item.title) : industries).join("  ·  ")}</p></div>
      </ScrollReveal>
    </section>

    {testimonials.length > 0 && <section className="eh-testimonials eh-section">
      <div className="eh-shell"><p className="eh-overline">In good company</p><ScrollReveal className="eh-testimonial-grid" stagger>{testimonials.slice(0, 2).map((item) => <figure key={item.id}>
        <blockquote>“{value(item, "content", value(item, "quote"))}”</blockquote>
        <figcaption><strong>{value(item, "author", "A PROCODIC collaborator")}</strong><span>{[value(item, "designation"), value(item, "company")].filter(Boolean).join(" · ")}</span></figcaption>
      </figure>)}</ScrollReveal></div>
    </section>}

    {collaborations.length > 0 && <section className="eh-partners eh-section"><div className="eh-shell"><p className="eh-overline">People we work with</p><ScrollReveal className="eh-partner-list" stagger>{collaborations.slice(0, 5).map((item) => <Partner key={item.id} item={item} />)}</ScrollReveal></div></section>}

    {articles.length > 0 && <section className="eh-journal eh-section">
      <div className="eh-shell"><ScrollReveal className="eh-section-heading" delay={40}><div><p className="eh-overline">Notes from the work</p><h2>Ideas worth<br /><em>taking further.</em></h2></div><Link className="eh-text-link" href="/insights">Visit insights <ArrowRight size={15} /></Link></ScrollReveal>
        <ScrollReveal className="eh-article-list" delay={100} stagger>{articles.slice(0, 3).map((article) => <Link href={"/insights/" + article.slug} className="eh-article" key={article.id}><span>{value(article, "category", "Insight")}</span><h3>{article.title}</h3><ArrowUpRight size={17} /></Link>)}</ScrollReveal>
      </div>
    </section>}

    <section className="eh-contact">
      <ScrollReveal className="eh-shell eh-contact-layout" delay={70}><div><p className="eh-overline">Start a conversation</p><h2>What would better<br /><em>work look like?</em></h2><p>Tell us what you’re trying to move forward. We’ll help you find a useful next step.</p></div><Link className="eh-button eh-button-light" href="/contact">Let’s talk <ArrowUpRight size={16} /></Link></ScrollReveal>
    </section>
  </main>;
}
