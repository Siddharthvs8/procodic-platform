"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch(`${API}/auth/login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error(response.status === 401 ? "Email or password is incorrect." : "Could not connect to the administration service.");
      router.push("/admin"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign-in failed."); }
    finally { setLoading(false); }
  }

  return <main className="admin-page"><div style={{ maxWidth: 1060, margin: "0 auto" }}><Link className="text-link" href="/"><ArrowLeft size={14} /> Back to website</Link><section className="admin-login"><Image src="/brand/procodic-logo.png" width={1313} height={265} alt="PROCODIC" /><h1>Welcome back.</h1><p>Sign in to manage the PROCODIC website.</p>{error && <div className="form-error-box" role="alert" style={{ marginBottom: 16 }}>{error}</div>}<form className="admin-form" onSubmit={submit}><div className="field"><label htmlFor="admin-email">Email address</label><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@company.com" /></div><div className="field"><label htmlFor="admin-password">Password</label><input id="admin-password" type="password" autoComplete="current-password" required minLength={12} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" /></div><button className="button" disabled={loading} style={{ marginTop: 6 }}><LockKeyhole size={15} />{loading ? "Signing in…" : "Sign in securely"}</button></form><p style={{ marginTop: 22, fontSize: 10, color: "#6d7b91" }}>Admin access is provisioned by your system administrator.</p></section></div></main>;
}
