"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Tema = "dark" | "light";

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema | null>(null);
  useEffect(() => {
    const attr = document.documentElement.dataset.theme as Tema | undefined;
    setTema(attr ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  }, []);
  function toggle() {
    const next: Tema = tema === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.cookie = `kinra_tema=${next}; path=/; max-age=31536000; samesite=lax`;
    setTema(next);
  }
  const label = tema === "light" ? "Ganti ke tema gelap" : "Ganti ke tema terang";
  return (
    <button type="button" className="btn icon-btn" onClick={toggle} aria-label={label} title={label}>
      {tema === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
}
