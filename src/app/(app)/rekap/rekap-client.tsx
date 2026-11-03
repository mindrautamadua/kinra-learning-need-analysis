"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { DataLNA } from "@/lib/data";
import { angka, namaJabatan, statusLN, strategiPendek } from "@/lib/domain";
import { eksporExcel } from "@/lib/export";
import { SectionHead } from "@/components/ui";

type Mode = "rjpp" | "kompetensi" | "strategi" | "nonpelatihan";

export function RekapClient({ data }: { data: Pick<DataLNA, "capabilities" | "learningNeeds" | "jabatan" | "prioritas"> }) {
  const [mode, setMode] = useState<Mode>("rjpp");
  const [hanyaLengkap, setHanyaLengkap] = useState(true);
  const cmap = useMemo(() => new Map(data.capabilities.map((c) => [c.id, c])), [data.capabilities]);
  const jmap = useMemo(() => new Map(data.jabatan.map((j) => [j.id, j])), [data.jabatan]);

  const baris = useMemo(
    () =>
      data.learningNeeds
        .map((l) => ({ l, c: cmap.get(l.capability_id)!, s: statusLN(l, cmap.get(l.capability_id)) }))
        .filter((x) => x.s !== "tidak_relevan" && (!hanyaLengkap || x.s === "lengkap"))
        .sort((a, b) => a.c.no - b.c.no || a.l.urutan - b.l.urutan),
    [data.learningNeeds, cmap, hanyaLengkap],
  );
  const pelatihan = baris.filter((x) => x.l.sebab_gap !== "non_kompetensi" && x.l.learning_need);
  const non = baris.filter((x) => x.l.sebab_gap === "non_kompetensi");

  const pmap = useMemo(() => new Map(data.prioritas.map((x) => [x.kode, x])), [data.prioritas]);

  // Klaster: gabungkan learning need dengan prioritas RJPP, kompetensi, atau strategi yang sama (tahap Cluster ALNA)
  const klaster = useMemo(() => {
    const m = new Map<string, typeof pelatihan>();
    const tambah = (k: string, x: (typeof pelatihan)[number]) => m.set(k, [...(m.get(k) ?? []), x]);
    for (const x of pelatihan) {
      if (mode === "rjpp") {
        if (x.c.prioritas_rjpp.length === 0) tambah("(belum ditautkan ke RJPP)", x);
        x.c.prioritas_rjpp.forEach((k) => tambah(k, x));
      } else tambah(mode === "strategi" ? x.c.strategi : x.l.kompetensi ?? "(tanpa kompetensi)", x);
    }
    const ent = [...m.entries()];
    if (mode === "rjpp") return ent.sort((a, b) => (pmap.get(a[0])?.urutan ?? 999) - (pmap.get(b[0])?.urutan ?? 999));
    return ent.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  }, [pelatihan, mode, pmap]);

  return (
    <section className="section">
      <SectionHead no="03" eyebrow="Rekap & klaster" judul={`${angka(pelatihan.length)} learning need pelatihan dan ${angka(non.length)} intervensi non-pelatihan`}>
        <p className="muted">
          Bahan tahap Consolidate dan Cluster sebelum Learning Priorities. Learning need dikelompokkan per prioritas RJPP KINRA, kompetensi, atau strategi, lengkap dengan populasi target gabungan. Satu learning need bisa muncul di lebih dari satu prioritas RJPP.
        </p>
      </SectionHead>
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ alignItems: "center" }}>
          <div className="seg small" role="group" aria-label="Tampilan rekap">
            <button aria-pressed={mode === "rjpp"} onClick={() => setMode("rjpp")}>Per prioritas RJPP</button>
            <button aria-pressed={mode === "kompetensi"} onClick={() => setMode("kompetensi")}>Klaster per kompetensi</button>
            <button aria-pressed={mode === "strategi"} onClick={() => setMode("strategi")}>Per strategi</button>
            <button aria-pressed={mode === "nonpelatihan"} onClick={() => setMode("nonpelatihan")}>Non-pelatihan ({non.length})</button>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label className="check" style={{ alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={hanyaLengkap} onChange={(e) => setHanyaLengkap(e.target.checked)} /> Hanya baris lengkap
            </label>
            <button className="btn" onClick={() => eksporExcel(data.capabilities, data.learningNeeds, data.jabatan, data.prioritas, true)}><Download aria-hidden="true" /> Ekspor Excel</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {mode !== "nonpelatihan" && klaster.length === 0 && <div className="card muted">Belum ada learning need {hanyaLengkap ? "yang lengkap" : "yang terisi"}.</div>}
        {mode !== "nonpelatihan" &&
          klaster.map(([judul, list]) => {
            const posisi = [...new Set(list.flatMap((x) => namaJabatan(x.l.jabatan_ids, jmap)))];
            const strategi = [...new Set(list.map((x) => strategiPendek(x.c.strategi)))];
            return (
              <div key={judul} className="card">
                <div className="row">
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10 }}>
                      {mode === "kompetensi" ? "Kompetensi" : mode === "strategi" ? "Strategi PTPN" : pmap.get(judul) ? `${pmap.get(judul)!.kode} · ${pmap.get(judul)!.pilar}` : "Prioritas RJPP"}
                    </div>
                    <h3 style={{ fontSize: 17, marginTop: 4 }}>{mode === "rjpp" ? pmap.get(judul)?.nama ?? judul : judul}</h3>
                    {mode === "rjpp" && pmap.get(judul)?.uraian && <p className="muted small" style={{ margin: "4px 0 0", maxWidth: 760 }}>{pmap.get(judul)!.uraian}</p>}
                  </div>
                  <div className="mini-stats" style={{ display: "flex", gap: 16 }}>
                    <div><div className="muted small">Learning need</div><b className="tnum">{angka(list.length)}</b></div>
                    <div><div className="muted small">Posisi</div><b className="tnum">{angka(posisi.length)}</b></div>
                  </div>
                </div>
                <div className="small" style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {mode !== "strategi" && strategi.map((s) => <span key={s} className="chip brand">{s}</span>)}
                  {posisi.map((p) => <span key={p} className="chip na wrap">{p}</span>)}
                </div>
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table className="tbl">
                    <thead><tr><th style={{ width: 50 }}>No</th><th style={{ width: 240 }}>Capability</th><th>Learning Need</th></tr></thead>
                    <tbody>
                      {list.map((x) => (
                        <tr key={x.l.id}>
                          <td className="num">{x.c.no}{x.l.urutan > 1 ? `.${x.l.urutan}` : ""}</td>
                          <td><Link href={`/matriks?buka=${x.l.id}`}>{x.c.capability}</Link></td>
                          <td className="small">{x.l.learning_need}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        {mode === "nonpelatihan" && (
          <div className="card">
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>No</th><th>Capability</th><th>Gap</th><th>Intervensi yang disarankan</th></tr></thead>
                <tbody>
                  {non.length === 0 && <tr><td colSpan={4} className="muted">Belum ada gap bersebab non-kompetensi.</td></tr>}
                  {non.map((x) => (
                    <tr key={x.l.id}>
                      <td className="num">{x.c.no}</td>
                      <td><Link href={`/matriks?buka=${x.l.id}`}>{x.c.capability}</Link></td>
                      <td className="small">{x.l.gap}</td>
                      <td className="small">{x.l.intervensi_non_pelatihan ?? <span className="kosong">belum diisi</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
