"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Popover posisi tetap yang menempel pada elemen pemicu; tidak terpotong oleh kontainer scroll tabel. */
export function Popover({
  anchor, judul, lebar = 460, onClose, children,
}: { anchor: HTMLElement; judul: string; lebar?: number; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxH: number } | null>(null);

  useLayoutEffect(() => {
    const hitung = () => {
      const r = anchor.getBoundingClientRect();
      const w = Math.min(lebar, window.innerWidth - 24);
      const left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
      const bawah = window.innerHeight - r.bottom - 12;
      const atas = r.top - 12;
      const keAtas = bawah < 320 && atas > bawah;
      const maxH = Math.min(520, keAtas ? atas : bawah);
      setPos({ top: keAtas ? r.top - maxH - 4 : r.bottom + 4, left, maxH });
    };
    hitung();
    window.addEventListener("resize", hitung);
    window.addEventListener("scroll", hitung, true);
    return () => { window.removeEventListener("resize", hitung); window.removeEventListener("scroll", hitung, true); };
  }, [anchor, lebar]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [anchor, onClose]);

  if (!pos) return null;
  return createPortal(
    <div ref={ref} className="popover" role="dialog" aria-label={judul} style={{ top: pos.top, left: pos.left, width: Math.min(lebar, window.innerWidth - 24), maxHeight: pos.maxH }}>
      <div className="popover-head">
        <b>{judul}</b>
        <button type="button" className="btn icon-btn ghost" onClick={onClose} aria-label="Tutup"><X aria-hidden="true" /></button>
      </div>
      <div className="popover-body">{children}</div>
    </div>,
    document.body,
  );
}
