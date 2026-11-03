"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Printer, Search } from "lucide-react";
import type { DataLNA } from "@/lib/data";
import type { Capability, LearningNeed } from "@/lib/types";
import { angka, namaJabatan, statusLN, STATUS_LABEL, strategiPendek, URUT_PILAR_RJPP, type Status } from "@/lib/domain";
import { eksporExcel } from "@/lib/export";
import { bacaPengisi } from "@/components/pengisi";
import { SectionHead, cx } from "@/components/ui";
import { hapusLearningNeed, simpanCapability, simpanLearningNeed, tambahLearningNeed, type PatchLN } from "../actions";
import { Editor } from "./editor";
import { LembarKerja, type IsiCap } from "./lembar-kerja";

type FilterStatus = "semua" | Status;

export function MatriksClient({ data, bukaAwal }: { data: DataLNA; bukaAwal?: string }) {
  const [caps, setCaps] = useState<Capability[]>(data.capabilities);
  const [lns, setLns] = useState<LearningNeed[]>(data.learningNeeds);
  const [strategi, setStrategi] = useState<string>("semua");
  const [fStatus, setFStatus] = useState<FilterStatus>("semua");
  const [fRjpp, setFRjpp] = useState<string>("semua");
  const [q, setQ] = useState("");
  const [sembunyikan, setSembunyikan] = useState(false);
  const [petunjuk, setPetunjuk] = useState(true);
  const [bukaId, setBukaId] = useState<string | null>(bukaAwal ?? null);
  const [ekspor, setEkspor] = useState(false);
  const [pesan, setPesan] = useState<{ teks: string; err?: boolean } | null>(null);
  const [terakhir, setTerakhir] = useState<string | null>(null);

  useEffect(() => { setCaps(data.capabilities); setLns(data.learningNeeds); }, [data]);
  useEffect(() => {
    if (!pesan) return;
    const t = setTimeout(() => setPesan(null), 3500);
    return () => clearTimeout(t);
  }, [pesan]);

  const jmap = useMemo(() => new Map(data.jabatan.map((j) => [j.id, j])), [data.jabatan]);
  const pmap = useMemo(() => new Map(data.prioritas.map((x) => [x.kode, x])), [data.prioritas]);
  const cmap = useMemo(() => new Map(caps.map((c) => [c.id, c])), [caps]);
  const daftarStrategi = useMemo(() => [...new Set(caps.map((c) => c.strategi))], [caps]);
  const jumlahPerCap = useMemo(() => {
    const m = new Map<number, number>();
    lns.forEach((l) => m.set(l.capability_id, (m.get(l.capability_id) ?? 0) + 1));
    return m;
  }, [lns]);

  const urut = useMemo(
    () => [...lns].sort((a, b) => (cmap.get(a.capability_id)?.no ?? 0) - (cmap.get(b.capability_id)?.no ?? 0) || a.urutan - b.urutan),
    [lns, cmap],
  );

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return urut.filter((ln) => {
      const c = cmap.get(ln.capability_id);
      if (!c) return false;
      if (strategi !== "semua" && c.strategi !== strategi) return false;
      if (fRjpp === "belum" && c.prioritas_rjpp.length > 0) return false;
      if (fRjpp !== "semua" && fRjpp !== "belum" && !c.prioritas_rjpp.includes(fRjpp)) return false;
      const st = statusLN(ln, c);
      if (sembunyikan && st === "tidak_relevan") return false;
      if (fStatus !== "semua" && st !== fStatus) return false;
      if (!kata) return true;
      const hay = [c.capability, c.strategi, ...c.inisiatif, ...c.prioritas_rjpp.map((k) => pmap.get(k)?.nama ?? k), ln.kompetensi, ln.expected_role, ln.gap,
        ln.learning_need, ln.intervensi_non_pelatihan, ln.posisi_lain, ...namaJabatan(ln.jabatan_ids, jmap)].join(" ").toLowerCase();
      return hay.includes(kata);
    });
  }, [urut, cmap, strategi, fStatus, q, sembunyikan, jmap, fRjpp, pmap]);

  const hitung = useMemo(() => {
    const h: Record<Status, number> = { lengkap: 0, sebagian: 0, belum: 0, tidak_relevan: 0 };
    for (const ln of lns) h[statusLN(ln, cmap.get(ln.capability_id))]++;
    return h;
  }, [lns, cmap]);
  const aktifTotal = lns.length - hitung.tidak_relevan;

  const catatWaktu = () => setTerakhir(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));

  // Simpan satu sel: optimistik, dikembalikan bila gagal
  const simpanLN = useCallback(async (id: string, patch: PatchLN) => {
    const lama = lns.find((l) => l.id === id);
    setLns((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } as LearningNeed : l)));
    try {
      const baru = await simpanLearningNeed(id, { ...patch, diubah_oleh: bacaPengisi() || null });
      setLns((prev) => prev.map((l) => (l.id === id ? baru : l)));
      catatWaktu();
    } catch (e) {
      if (lama) setLns((prev) => prev.map((l) => (l.id === id ? lama : l)));
      setPesan({ teks: (e as Error).message, err: true });
      throw e;
    }
  }, [lns]);

  const simpanCap = useCallback(async (cap: Capability, isi: IsiCap) => {
    const sebelum = cap;
    setCaps((prev) => prev.map((c) => (c.id === cap.id ? { ...c, relevan: isi.relevan, catatan_relevansi: isi.catatan, prioritas_rjpp: isi.prioritas } : c)));
    try {
      const tersimpan = await simpanCapability(cap.id, isi, bacaPengisi() || undefined);
      setCaps((prev) => prev.map((c) => (c.id === cap.id ? { ...c, prioritas_rjpp: tersimpan } : c)));
      catatWaktu();
    } catch (e) {
      setCaps((prev) => prev.map((c) => (c.id === cap.id ? sebelum : c)));
      setPesan({ teks: (e as Error).message, err: true });
    }
  }, []);

  const tambah = useCallback(async (capId: number) => {
    try {
      const baru = await tambahLearningNeed(capId, undefined, bacaPengisi() || undefined);
      setLns((prev) => [...prev, baru]);
      setPesan({ teks: "Baris learning need ditambahkan" });
      catatWaktu();
    } catch (e) {
      setPesan({ teks: (e as Error).message, err: true });
    }
  }, []);

  const hapus = useCallback(async (ln: LearningNeed) => {
    const c = cmap.get(ln.capability_id);
    if (!confirm(`Hapus learning need ke-${ln.urutan} untuk "${c?.capability}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await hapusLearningNeed(ln.id);
      setLns((prev) => prev.filter((l) => l.id !== ln.id));
      if (bukaId === ln.id) setBukaId(null);
      setPesan({ teks: "Baris dihapus" });
    } catch (e) {
      setPesan({ teks: (e as Error).message, err: true });
    }
  }, [cmap, bukaId]);

  const lnBuka = bukaId ? lns.find((l) => l.id === bukaId) ?? null : null;
  const capBuka = lnBuka ? cmap.get(lnBuka.capability_id) : undefined;
  const idxBuka = lnBuka ? terfilter.findIndex((l) => l.id === lnBuka.id) : -1;

  return (
    <>
      <section className="section">
        <SectionHead no="02" eyebrow="Matriks: dari strategi bisnis ke learning needs" judul={`${angka(hitung.lengkap)} dari ${angka(aktifTotal)} learning need relevan sudah lengkap`}>
          <p className="muted">
            Isi langsung di sel seperti Kertas Kerja Excel. Teks tersimpan otomatis saat pindah sel. Klik sel Key Position atau Competency untuk memilih dari
            nomenklatur dan kamus. Satu baris = satu learning need. Sumber: Kertas Kerja Workshop 3 PT KINRA.
          </p>
        </SectionHead>

        <div className="card" style={{ padding: 16 }}>
          <div className="row" style={{ alignItems: "center", gap: 12 }}>
            <div className="seg small" role="group" aria-label="Filter strategi">
              <button aria-pressed={strategi === "semua"} onClick={() => setStrategi("semua")}>Semua strategi</button>
              {daftarStrategi.map((s) => (
                <button key={s} aria-pressed={strategi === s} onClick={() => setStrategi(s)} title={s}>{strategiPendek(s)}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <select className="sel" style={{ width: 220, height: 36 }} value={fRjpp} onChange={(e) => setFRjpp(e.target.value)} aria-label="Filter prioritas RJPP KINRA">
                <option value="semua">Semua prioritas RJPP</option>
                <option value="belum">Belum ditautkan ke RJPP</option>
                {URUT_PILAR_RJPP.map((pilar) => (
                  <optgroup key={pilar} label={pilar}>
                    {data.prioritas.filter((x) => x.pilar === pilar).map((x) => <option key={x.kode} value={x.kode}>{x.kode} · {x.nama}</option>)}
                  </optgroup>
                ))}
              </select>
              <label className="search" style={{ width: 220 }}>
                <Search aria-hidden="true" />
                <input className="inp" placeholder="Cari di lembar kerja…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari" />
              </label>
              <button className="btn" disabled={ekspor} onClick={async () => { setEkspor(true); try { await eksporExcel(caps, lns, data.jabatan, data.prioritas, sembunyikan); } finally { setEkspor(false); } }}>
                <Download aria-hidden="true" /> {ekspor ? "Menyiapkan…" : "Ekspor Excel"}
              </button>
              <Link className="btn" href="/cetak" target="_blank">
                <Printer aria-hidden="true" /> Cetak formulir
              </Link>
              <Link className="btn" href="/cetak/jabatan" target="_blank">
                <Printer aria-hidden="true" /> Cetak per jabatan
              </Link>
            </div>
          </div>
          <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
            <div className="seg small" role="group" aria-label="Filter status">
              {(["semua", "belum", "sebagian", "lengkap", "tidak_relevan"] as FilterStatus[]).map((s) => (
                <button key={s} aria-pressed={fStatus === s} onClick={() => setFStatus(s)}>
                  {s === "semua" ? "Semua status" : STATUS_LABEL[s]} <span className="mono muted" style={{ marginLeft: 4 }}>{s === "semua" ? lns.length : hitung[s]}</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <label className="check" style={{ alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={petunjuk} onChange={(e) => setPetunjuk(e.target.checked)} /> Petunjuk kolom &amp; contoh
              </label>
              <label className="check" style={{ alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={sembunyikan} onChange={(e) => setSembunyikan(e.target.checked)} /> Sembunyikan tidak relevan
              </label>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <LembarKerja
              rows={terfilter}
              cmap={cmap}
              jmap={jmap}
              pmap={pmap}
              data={data}
              jumlahPerCap={jumlahPerCap}
              aktifId={bukaId}
              tampilPetunjuk={petunjuk}
              onSimpanLN={simpanLN}
              onSimpanCap={simpanCap}
              onTambah={tambah}
              onHapus={hapus}
              onDetail={setBukaId}
            />
          </div>
          <p className="muted small" style={{ margin: "12px 0 0" }}>
            Menampilkan {angka(terfilter.length)} dari {angka(lns.length)} baris · {angka(caps.length)} capability
            {terakhir ? ` · Tersimpan terakhir ${terakhir} WIB` : ""} · Sumber: Kertas Kerja Workshop 3 PT KINRA
          </p>
        </div>
      </section>

      {lnBuka && capBuka && (
        <Editor
          key={lnBuka.id}
          ln={lnBuka}
          cap={capBuka}
          saudara={lns.filter((l) => l.capability_id === capBuka.id).sort((a, b) => a.urutan - b.urutan)}
          data={data}
          adaSebelum={idxBuka > 0}
          adaBerikut={idxBuka >= 0 && idxBuka < terfilter.length - 1}
          onPindah={(arah) => {
            const t = terfilter[idxBuka + arah];
            if (t) setBukaId(t.id);
          }}
          onBuka={setBukaId}
          onClose={() => setBukaId(null)}
          onLnTersimpan={(baru) => setLns((prev) => (prev.some((p) => p.id === baru.id) ? prev.map((p) => (p.id === baru.id ? baru : p)) : [...prev, baru]))}
          onLnTerhapus={(id) => setLns((prev) => prev.filter((p) => p.id !== id))}
          onCapTersimpan={(baru) => setCaps((prev) => prev.map((p) => (p.id === baru.id ? baru : p)))}
        />
      )}
      {pesan && <div className={cx("toast", pesan.err && "err")} role="status">{pesan.teks}</div>}
    </>
  );
}
