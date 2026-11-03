"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Jabatan, KamusHard, KamusLeadership, PrioritasRjpp } from "@/lib/types";
import { angka, JENIS_PRIORITAS_LABEL } from "@/lib/domain";
import { SectionHead } from "@/components/ui";

type Tab = "rjpp" | "hard" | "leadership" | "jabatan";

export function ReferensiClient({ kamusHard, kamusLeadership, jabatan, prioritas }: { kamusHard: KamusHard[]; kamusLeadership: KamusLeadership[]; jabatan: Jabatan[]; prioritas: PrioritasRjpp[] }) {
  const [tab, setTab] = useState<Tab>("rjpp");
  const [q, setQ] = useState("");
  const [area, setArea] = useState("semua");
  const areas = useMemo(() => [...new Set(kamusHard.map((k) => k.area))].sort(), [kamusHard]);
  const kata = q.trim().toLowerCase();

  const hard = useMemo(
    () => kamusHard.filter((k) => (area === "semua" || k.area === area) && (!kata || `${k.nama} ${k.job_function} ${k.area}`.toLowerCase().includes(kata))),
    [kamusHard, area, kata],
  );
  const jab = useMemo(() => jabatan.filter((j) => !kata || `${j.nama} ${j.level} ${j.divisi} ${j.kode}`.toLowerCase().includes(kata)), [jabatan, kata]);
  const perLevel = useMemo(() => {
    const m: Record<string, number> = {};
    jabatan.forEach((j) => (m[j.level] = (m[j.level] ?? 0) + 1));
    return Object.entries(m).sort();
  }, [jabatan]);

  return (
    <section className="section">
      <SectionHead no="04" eyebrow="Tab referensi" judul={`${angka(prioritas.length)} prioritas RJPP, ${angka(kamusHard.length)} kompetensi teknis, ${angka(jabatan.length)} jabatan KINRA`}>
        <p className="muted">Acuan pengisian prioritas RJPP serta kolom F dan G. Sumber: RJPP PT KINRA 2026–2030 (draft), Kamus Kompetensi Teknis PTPN Group, dan nomenklatur jabatan Head Office PT KINRA.</p>
      </SectionHead>
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ alignItems: "center" }}>
          <div className="seg small" role="tablist">
            <button role="tab" aria-selected={tab === "rjpp"} onClick={() => setTab("rjpp")}>Prioritas RJPP KINRA</button>
            <button role="tab" aria-selected={tab === "hard"} onClick={() => setTab("hard")}>Kamus Hard Competency</button>
            <button role="tab" aria-selected={tab === "leadership"} onClick={() => setTab("leadership")}>Kamus Leadership</button>
            <button role="tab" aria-selected={tab === "jabatan"} onClick={() => setTab("jabatan")}>Nomenklatur Jabatan</button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {tab === "hard" && (
              <select className="sel" style={{ width: 240 }} value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filter area kompetensi">
                <option value="semua">Semua area ({areas.length})</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            {(tab === "hard" || tab === "jabatan") && (
              <label className="search" style={{ width: 260 }}>
                <Search aria-hidden="true" />
                <input className="inp" placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari referensi" />
              </label>
            )}
          </div>
        </div>

        {tab === "hard" && (
          <>
            <div className="table-wrap" style={{ marginTop: 14, maxHeight: "calc(100vh - 320px)" }}>
              <table className="tbl">
                <thead><tr><th style={{ width: 60 }}>No</th><th>Area Kompetensi</th><th>Job Function</th><th>Nama Kompetensi</th></tr></thead>
                <tbody>
                  {hard.length === 0 && <tr><td colSpan={4} className="muted">Tidak ada kompetensi yang cocok.</td></tr>}
                  {hard.map((k) => (
                    <tr key={k.id}><td className="num">{k.id}</td><td className="small">{k.area}</td><td className="small">{k.job_function}</td><td style={{ fontWeight: 600 }}>{k.nama}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small" style={{ margin: "12px 0 0" }}>{angka(hard.length)} dari {angka(kamusHard.length)} baris · Sumber: Kamus Kompetensi Teknis PTPN Group</p>
          </>
        )}
        {tab === "rjpp" && (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="tbl">
              <thead><tr><th style={{ width: 70 }}>Kode</th><th>Pilar</th><th>Jenis</th><th>Prioritas</th><th>Uraian</th></tr></thead>
              <tbody>
                {prioritas.map((x) => (
                  <tr key={x.kode}>
                    <td className="mono small">{x.kode}</td>
                    <td className="small" style={{ whiteSpace: "nowrap" }}>{x.pilar}</td>
                    <td className="small" style={{ whiteSpace: "nowrap" }}>{JENIS_PRIORITAS_LABEL[x.jenis]}</td>
                    <td style={{ fontWeight: 600, minWidth: 180 }}>{x.nama}</td>
                    <td className="small">{x.uraian}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small" style={{ margin: "12px 0 0" }}>Sumber: RJPP PT KINRA 2026–2030 (draft), Bab III Strategi Utama dan Sasaran Perusahaan serta Bab V Strategic Journey 2027.</p>
          </div>
        )}
        {tab === "leadership" && (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="tbl">
              <thead><tr><th style={{ width: 60 }}>No</th><th>Kompetensi Leadership</th></tr></thead>
              <tbody>{kamusLeadership.map((k) => <tr key={k.id}><td className="num">{k.id}</td><td style={{ fontWeight: 600 }}>{k.nama}</td></tr>)}</tbody>
            </table>
            <p className="muted small" style={{ margin: "12px 0 0" }}>Dipakai bila capability menuntut perilaku kepemimpinan, bukan keahlian teknis.</p>
          </div>
        )}
        {tab === "jabatan" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {perLevel.map(([l, n]) => <span key={l} className="chip na"><span className="mono">{l}</span> {n}</span>)}
            </div>
            <div className="table-wrap" style={{ marginTop: 12, maxHeight: "calc(100vh - 340px)" }}>
              <table className="tbl">
                <thead><tr><th>Jabatan</th><th>Level</th><th>Kode</th><th>Divisi</th><th>Direktorat</th></tr></thead>
                <tbody>
                  {jab.length === 0 && <tr><td colSpan={5} className="muted">Tidak ada jabatan yang cocok.</td></tr>}
                  {jab.map((j) => (
                    <tr key={j.id}><td style={{ fontWeight: 600 }}>{j.nama}</td><td className="mono small">{j.level}</td><td className="mono small muted">{j.kode ?? "–"}</td><td className="small">{j.divisi}</td><td className="small muted">{j.direktorat}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
