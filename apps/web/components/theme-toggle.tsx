"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === "light" || current === "dark") setTheme(current);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#111416" : "#f4f2ed");
    try { window.localStorage.setItem("procodic-theme", next); } catch { /* The selected mode still applies for this visit. */ }
    setTheme(next);
  }

  const nextMode = theme === "light" ? "dark" : "light";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextMode} mode`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${nextMode} mode`}
    >
      {theme === "light" ? <Moon size={16} strokeWidth={1.8} aria-hidden="true" /> : <Sun size={16} strokeWidth={1.8} aria-hidden="true" />}
      <span className="theme-toggle-label">{theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
