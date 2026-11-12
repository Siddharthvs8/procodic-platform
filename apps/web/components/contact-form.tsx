"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.email("Enter a valid business email.").max(254),
  phone: z.string().max(40).optional(),
  company: z.string().max(160).optional(),
  designation: z.string().max(120).optional(),
  category: z.string().min(2),
  productSlug: z.string().max(100).optional(),
  message: z.string().trim().min(15, "Share a little more about what you need.").max(4000),
  website: z.string().max(160).optional(),
});
type FormValues = z.infer<typeof schema>;

export function ContactForm({ category, productSlug }: { category: string; productSlug?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { category, productSlug, website: "" } });
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  async function submit(values: FormValues) {
    setMessage(""); setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4000/api")}/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!response.ok) throw new Error("We couldn’t send your enquiry. Please try again in a moment.");
      setMessage("Thanks for reaching out. Your enquiry is with the PROCODIC team.");
      reset({ category, productSlug, website: "" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again."); }
  }

  return <form className="form-shell" onSubmit={handleSubmit(submit)} noValidate>
    {message && <div className="form-success" role="status">{message}</div>}{error && <div className="form-error-box" role="alert">{error}</div>}
    <div className="form-grid">
      <div className="field"><label htmlFor="name">Name *</label><input id="name" autoComplete="name" placeholder="Your name" {...register("name")} />{errors.name && <span className="form-error">{errors.name.message}</span>}</div>
      <div className="field"><label htmlFor="email">Business email *</label><input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />{errors.email && <span className="form-error">{errors.email.message}</span>}</div>
      <div className="field"><label htmlFor="company">Company</label><input id="company" autoComplete="organization" placeholder="Company name" {...register("company")} /></div>
      <div className="field"><label htmlFor="phone">Phone</label><input id="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" {...register("phone")} /></div>
      <div className="field"><label htmlFor="designation">Designation</label><input id="designation" autoComplete="organization-title" placeholder="Your role" {...register("designation")} /></div>
      <div className="field"><label htmlFor="category">How can we help? *</label><select id="category" {...register("category")}><option value="general">General enquiry</option><option value="product-demo">Product demo</option><option value="consultation">Enterprise consultation</option><option value="custom-software">Custom software</option><option value="ai-collaboration">AI research collaboration</option><option value="corporate-training">Corporate AI training</option><option value="partnership">Partnership</option></select></div>
      <div className="field full"><label htmlFor="message">Tell us what you’re working on *</label><textarea id="message" placeholder="A little context helps us route your enquiry to the right person." {...register("message")} />{errors.message && <span className="form-error">{errors.message.message}</span>}</div>
      <div className="field full" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" {...register("website")} /></div>
    </div>
    <button className="button form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send enquiry"} <span aria-hidden>↗</span></button>
  </form>;
}

import React from "react";
