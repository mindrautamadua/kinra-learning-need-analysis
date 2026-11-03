"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, ClipboardList, Layers, LayoutDashboard, Library, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { keluar } from "@/app/login/actions";
import { ThemeToggle } from "./theme-toggle";
import { NamaPengisi } from "./pengisi";

const NAV = [
  { href: "/", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/matriks", label: "Matriks LNA", icon: ClipboardList },
  { href: "/rekap", label: "Rekap Learning Needs", icon: Layers },
  { href: "/referensi", label: "Kamus & Jabatan", icon: Library },
  { href: "/pedoman", label: "Pedoman Pengisian", icon: BookOpen },
];

export function AppShell({ children, ciutAwal = false }: { children: React.ReactNode; ciutAwal?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ciut, setCiut] = useState(ciutAwal);

  const toggleCiut = useCallback(() => {
    setCiut((v) => {
      const next = !v;
      document.cookie = `kinra_sidebar=${next ? "ciut" : "lebar"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  // Ctrl+B / ⌘B untuk melebarkan atau menciutkan sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCiut();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCiut]);
  const aktif = NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)));

  return (
    <div className={ciut ? "shell ciut" : "shell"}>
      <aside className={open ? "sidebar open" : "sidebar"} aria-label="Navigasi utama">
        <div className="brand-block">
          <div className="brand-logo">
            <Image src="/brand/kinra-logo-tosca.png" alt="KINRA" width={168} height={72} priority />
          </div>
          <div className="sub">Learning Need Analysis 2027</div>
        </div>
        <nav className="nav">
          <div className="grp">Workshop 3</div>
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={aktif?.href === n.href ? "page" : undefined}
              onClick={() => setOpen(false)}
              title={ciut ? n.label : undefined}
              aria-label={ciut ? n.label : undefined}
            >
              <span className="no">{String(i + 1).padStart(2, "0")}</span>
              <n.icon size={16} aria-hidden="true" />
              <span className="lbl">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-card">
          <div className="eyebrow" style={{ fontSize: 10 }}>Tahap 3 ALNA</div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>Identifikasi Learning Needs</div>
          <div className="muted small">Workshop 3–4 November 2026. Output: daftar learning needs PT KINRA.</div>
        </div>
      </aside>
      {open && <div className="backdrop only-mobile" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="main">
        <div className="topbar">
          <button className="btn icon-btn only-mobile" onClick={() => setOpen((v) => !v)} aria-label={open ? "Tutup menu" : "Buka menu"}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <button
            className="btn icon-btn only-desktop"
            onClick={toggleCiut}
            aria-label={ciut ? "Lebarkan sidebar" : "Ciutkan sidebar"}
            aria-expanded={!ciut}
            title={`${ciut ? "Lebarkan" : "Ciutkan"} sidebar (Ctrl+B)`}
          >
            {ciut ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
          <div className="eyebrow" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            PT KINRA <span className="muted">/</span> {aktif?.label ?? "LNA"}
          </div>
          <NamaPengisi />
          <ThemeToggle />
          <form action={keluar}>
            <button className="btn" type="submit" aria-label="Keluar">
              <LogOut aria-hidden="true" />
              <span className="hide-sm">Keluar</span>
            </button>
          </form>
        </div>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
