"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown, LoaderCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120, "Use 120 characters or fewer."),
  email: z.email("Enter a valid email address.").max(254),
  phone: z.string().max(40, "Use 40 characters or fewer.").optional(),
  company: z.string().max(160, "Use 160 characters or fewer.").optional(),
  designation: z.string().max(120, "Use 120 characters or fewer.").optional(),
  category: z.string().min(2),
  productSlug: z.string().max(100).optional(),
  message: z.string().trim().min(15, "Share a little more about your project (at least 15 characters).").max(4000, "Keep your message under 4,000 characters."),
  website: z.string().max(160).optional(),
});
type FormValues = z.infer<typeof schema>;

export function ContactForm({ category, productSlug }: { category: string; productSlug?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { category, productSlug, website: "" } });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (sent) successRef.current?.focus(); }, [sent]);

  async function submit(values: FormValues) {
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4000/api")}/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!response.ok) throw new Error(response.status === 429 ? "You’ve sent a few requests recently. Please wait a moment and try again." : "Your enquiry wasn’t sent. Your details are still here; please try again.");
      setSent(true);
      reset({ category, productSlug, website: "" });
    } catch (cause) { setError(cause instanceof Error && !(cause instanceof TypeError) ? cause.message : "We couldn’t connect. Your details are still here; please check your connection and try again."); }
  }

  if (sent) return <div ref={successRef} tabIndex={-1} className="form-shell journey-contact-form contact-complete" role="status"><span className="contact-success-icon"><Check size={27} strokeWidth={1.8} aria-hidden="true" /></span><span className="journey-eyebrow">Message received</span><h2>You’re in good hands.</h2><p>Your enquiry is with the PROCODIC team. We’ll review your goals and get back to you using the email you provided.</p><button type="button" className="button secondary" onClick={() => setSent(false)}>Send another enquiry</button><Link className="contact-home-link" href="/">Back to the website <ArrowUpRight size={15} /></Link></div>;

  return <form className="form-shell journey-contact-form" onSubmit={handleSubmit(submit)} noValidate aria-busy={isSubmitting}>
    <div className="contact-form-heading"><h2>Let’s build something useful.</h2><p>A little context is all we need to get started.</p></div>
    {error && <div className="form-error-box" role="alert">{error}</div>}
    <fieldset disabled={isSubmitting}><legend className="journey-sr-only">Your project enquiry</legend><div className="form-grid">
      <div className="field"><label htmlFor="name">Full name <span aria-hidden="true">*</span></label><input id="name" autoComplete="name" required maxLength={120} placeholder="Your name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} {...register("name")} />{errors.name && <span id="name-error" className="form-error">{errors.name.message}</span>}</div>
      <div className="field"><label htmlFor="email">Email address <span aria-hidden="true">*</span></label><input id="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />{errors.email && <span id="email-error" className="form-error">{errors.email.message}</span>}</div>
      <div className="field full"><label htmlFor="category">I’m interested in</label><select id="category" {...register("category")}><option value="general">Let’s explore the possibilities</option><option value="product-demo">A product demo</option><option value="consultation">Enterprise consultation</option><option value="custom-software">Custom software</option><option value="ai-collaboration">Applied AI & research</option><option value="corporate-training">Training for my team</option><option value="partnership">A partnership</option></select></div>
      <div className="field full"><label htmlFor="message">What would you like to make possible? <span aria-hidden="true">*</span></label><textarea id="message" required maxLength={4000} placeholder="Tell us about your goals, your team, or a challenge you’re working through." aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : "message-hint"} {...register("message")} />{errors.message ? <span id="message-error" className="form-error">{errors.message.message}</span> : <span id="message-hint" className="contact-field-hint">A few sentences are a great start.</span>}</div>
      <details className="contact-extra full"><summary>Add company details <span>Optional</span><ChevronDown size={16} aria-hidden="true" /></summary><div className="form-grid"><div className="field"><label htmlFor="company">Company</label><input id="company" autoComplete="organization" maxLength={160} placeholder="Company name" {...register("company")} /></div><div className="field"><label htmlFor="phone">Phone</label><input id="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Include country code" {...register("phone")} /></div><div className="field full"><label htmlFor="designation">Your role</label><input id="designation" autoComplete="organization-title" maxLength={120} placeholder="What do you do?" {...register("designation")} /></div></div></details>
      <div className="journey-honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" {...register("website")} /></div>
    </div></fieldset>
    <div className="contact-form-footer"><button className="button form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? <><LoaderCircle className="contact-spinner" size={17} aria-hidden="true" />Sending your enquiry…</> : <>Send enquiry <ArrowUpRight size={17} aria-hidden="true" /></>}</button><p>We’ll use your details to respond to your enquiry. <Link href="/privacy">Privacy policy</Link></p></div>
  </form>;
}
