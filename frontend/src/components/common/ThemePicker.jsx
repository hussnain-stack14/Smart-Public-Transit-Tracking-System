"use client";

import { useEffect, useState } from "react";

export const THEME_KEY = "smart-safar-theme-v1";
const options = [
  { id: "blue", name: "Blue", detail: "Default", description: "Clear, calm transit blue" },
  { id: "orange", name: "Orange", detail: "Classic", description: "Original Smart Safar warmth" },
];

export function applyTheme(theme, persist = true) {
  if (typeof window === "undefined") return;
  const selected = theme === "orange" ? "orange" : "blue";
  document.documentElement.dataset.theme = selected;
  if (persist) {
    try { window.localStorage.setItem(THEME_KEY, selected); } catch { /* Theme still applies for this visit. */ }
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", selected === "orange" ? "#c4510d" : "#0F5797");
  if (persist) window.dispatchEvent(new CustomEvent("smart-safar-theme-change", { detail: selected }));
}

export function ThemeOptions({ selected, onSelect }) {
  return <div className="theme-choice-grid" aria-label="Colour theme">
    {options.map((option) => <button key={option.id} type="button" className="theme-choice" aria-pressed={selected === option.id} onClick={() => onSelect(option.id)}>
      <span className={`theme-choice-preview theme-choice-preview--${option.id}`} aria-hidden="true"><span /><span /><span /></span>
      <strong>{option.name} <small className="inline">- {option.detail}</small></strong>
      <small>{option.description}</small>
    </button>)}
  </div>;
}

export function ThemeOnboarding() {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState("blue");
  useEffect(() => {
    let saved = null;
    try { saved = window.localStorage.getItem(THEME_KEY); } catch { /* Storage may be disabled. */ }
    if (saved !== "blue" && saved !== "orange") queueMicrotask(() => setVisible(true));
    else applyTheme(saved, false);
    const changed = () => setVisible(false);
    const storageChanged = (event) => {
      if (event.key !== THEME_KEY) return;
      const theme = event.newValue === "orange" ? "orange" : "blue";
      applyTheme(theme, false);
      setSelected(theme);
      setVisible(event.newValue !== "blue" && event.newValue !== "orange");
    };
    window.addEventListener("storage", storageChanged);
    window.addEventListener("smart-safar-theme-change", changed);
    return () => { window.removeEventListener("storage", storageChanged); window.removeEventListener("smart-safar-theme-change", changed); };
  }, []);
  if (!visible) return null;
  function choose(theme) { setSelected(theme); applyTheme(theme, false); }
  function finish(theme) { applyTheme(theme); setVisible(false); }
  return <section className="theme-onboarding" aria-labelledby="theme-onboarding-title">
    <h2 id="theme-onboarding-title">Choose your Smart Safar theme</h2>
    <p>Make the app feel like yours. You can switch later in Settings.</p>
    <ThemeOptions selected={selected} onSelect={choose} />
    <div className="theme-onboarding-actions">
      <button type="button" className={selected === "blue" ? "is-selected" : undefined} onClick={() => finish("blue")}>Continue with Blue</button>
      <button type="button" className={selected === "orange" ? "is-selected" : undefined} onClick={() => finish("orange")}>Continue with Orange</button>
    </div>
  </section>;
}
