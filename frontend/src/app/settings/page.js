"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/navigation/Navbar";
import { Footer } from "../../components/navigation/Footer";
import { ThemeOptions, THEME_KEY, applyTheme } from "../../components/common/ThemePicker";

export default function SettingsPage() {
  const [theme, setTheme] = useState("blue");
  useEffect(() => {
    let saved = document.documentElement.dataset.theme === "orange" ? "orange" : "blue";
    try { const stored = window.localStorage.getItem(THEME_KEY); if (stored === "blue" || stored === "orange") saved = stored; } catch { /* Use the active theme. */ }
    queueMicrotask(() => setTheme(saved));
    const changed = (event) => setTheme(event.detail === "orange" ? "orange" : "blue");
    const storageChanged = (event) => {
      if (event.key !== THEME_KEY) return;
      const selected = event.newValue === "orange" ? "orange" : "blue";
      applyTheme(selected, false);
      setTheme(selected);
    };
    window.addEventListener("smart-safar-theme-change", changed);
    window.addEventListener("storage", storageChanged);
    return () => { window.removeEventListener("smart-safar-theme-change", changed); window.removeEventListener("storage", storageChanged); };
  }, []);
  function select(value) { applyTheme(value); setTheme(value); }
  return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
    <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--primary-ink)]">Smart Safar</p>
    <h1 className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">Settings</h1>
    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Personalize your journey.</p>
    <section className="mt-7 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] sm:p-7" aria-labelledby="theme-heading">
      <h2 id="theme-heading" className="text-xl font-bold text-[var(--foreground)]">Theme</h2>
      <p className="mb-5 mt-1 text-sm leading-6 text-[var(--muted)]">Choose a colour scheme. Changes apply immediately and stay saved on this device, including in the installed app.</p>
      <ThemeOptions selected={theme} onSelect={select} />
    </section>
  </main><Footer /></div>;
}
