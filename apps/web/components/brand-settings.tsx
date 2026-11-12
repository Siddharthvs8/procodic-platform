"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BRAND_API, BRAND_EVENT, DEFAULT_LOGO } from "./brand-logo";

export function BrandSettings({ role }: { role: string }) {
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  const [saved, setSaved] = useState(DEFAULT_LOGO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`${BRAND_API}/settings/brand`, { cache: "no-store" }).then(async r => {
      if (!r.ok) throw new Error("Could not load logo settings. Please reload the page.");
      const result = await r.json();
      if (active) { setLogo(result.data.logoUrl); setSaved(result.data.logoUrl); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function choose(file?: File) {
    if (!file) return;
    setError(""); setNotice("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 256 * 1024) {
      setError("Choose a PNG, JPEG or WebP image smaller than 256 KB."); return;
    }
    setReading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read this image."));
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const image = new Image(); image.onload = () => resolve();
        image.onerror = () => reject(new Error("This file could not be opened as an image.")); image.src = data;
      });
      setLogo(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load this image."); }
    finally { setReading(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${BRAND_API}/admin/settings/brand`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logoUrl: logo }) });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Could not save the logo.");
      setSaved(result.data.logoUrl); setLogo(result.data.logoUrl);
      window.dispatchEvent(new Event(BRAND_EVENT));
      setNotice("Logo saved. The website and admin branding have been updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the logo."); }
    finally { setSaving(false); }
  }

  if (role !== "SUPER_ADMIN") return <section><h1>General settings</h1><div className="admin-panel admin-empty">Only a Super Admin can change the website logo.</div></section>;
  return <section><div className="admin-title-row"><div><h1>General settings</h1><p>Manage your website branding.</p></div></div><form className="admin-panel admin-form" onSubmit={save} style={{ maxWidth: 700 }}><h2>Website logo</h2><p style={{ color: "#8290a5", fontSize: 12 }}>Appears in the website header, footer, admin sidebar and sign-in page. Use a wide image with a transparent background for best results.</p>{error && <div className="form-error-box" role="alert">{error}</div>}{notice && <div className="admin-toast" role="status">{notice}</div>}<div style={{ background: "#111416", border: "1px solid var(--line)", padding: 24, display: "grid", placeItems: "center", minHeight: 120 }}><img src={logo} alt="Website logo preview" style={{ width: "100%", maxWidth: 320, height: 90, objectFit: "contain" }} /></div><div className="field"><label htmlFor="website-logo">Choose a logo</label><input id="website-logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={loading || saving || reading} onChange={e => { void choose(e.target.files?.[0]); e.currentTarget.value = ""; }} /><small style={{ color: "#8290a5" }}>PNG, JPEG or WebP, up to 256 KB. Changes apply after saving.</small></div><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button className="button small" disabled={loading || saving || reading || logo === saved}>{saving ? "Saving…" : reading ? "Reading image…" : "Save logo"}</button><button type="button" className="button secondary small" disabled={loading || saving || reading || logo === DEFAULT_LOGO} onClick={() => { setLogo(DEFAULT_LOGO); setNotice(""); setError(""); }}>Restore default</button></div></form></section>;
}
