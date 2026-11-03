"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, TriangleAlert } from "lucide-react";
import type { Capability, Jabatan, LearningNeed, PrioritasRjpp } from "@/lib/types";
import {
  checklist, KEKUATAN_LABEL, namaJabatan, strategiPendek, teksKolomJ, waktu,
} from "@/lib/domain";

type Data = { capabilities: Capability[]; learningNeeds: LearningNeed[]; jabatan: Jabatan[]; prioritas: PrioritasRjpp[] };
type Kertas = "A3" | "A4";

// Kolom mengikuti template "Matriks Strategi-Kebutuhan" (Business Strategy tampil sebagai baris grup).
// Field penilaian (jumlah peserta, level, prioritas R/K/U, metode, TW, PIC) tetap tersimpan, tidak dicetak.
const KOLOM = 8;
const KURANG: Record<string, string> = {
  rjpp: "belum ditautkan ke prioritas RJPP",
  posisi: "belum ada Key Position",
  kompetensi: "belum ada Competency",
  validasi: "menunggu validasi SME",
  expected: "belum ada Expected Role",
  gap: "belum ada Gap atau sebabnya",
  ln: "belum ada Learning Need / intervensi",
};
const REK_PENDEK = { kuat: "Kuat", sedang: "Sedang", lemah: "Lemah" } as const;
const PENANDA_TANGAN = [
  { peran: "Disusun oleh", jabatan: "Kepala Sub Bagian Sumber Daya Manusia" },
  { peran: "Diverifikasi oleh", jabatan: "Subject Matter Expert / Kepala Divisi terkait" },
  { peran: "Direviu oleh", jabatan: "Kepala Bagian SDM, Umum dan Pengadaan" },
  { peran: "Disetujui oleh", jabatan: "Direktur" },
];
const KUNCI_SIMPAN = "kinra_cetak_identitas";
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Identitas = { noDok: string; unit: string; fasilitator: string; nama: string[] };
const IDENTITAS_AWAL: Identitas = { noDok: "FRM-SDM-LNA-03", unit: "Seluruh unit PT KINRA", fasilitator: "", nama: ["", "", "", ""] };

/** Nilai sel; "–" menandai data yang belum diisi di aplikasi. */
const Nilai = ({ v }: { v: React.ReactNode }) => (v === null || v === undefined || v === "" ? <span className="belum">–</span> : <>{v}</>);

function SelAnalisis({ ln, c, jmap }: { ln?: LearningNeed; c: Capability; jmap: Map<number, Jabatan> }) {
  if (!ln) {
    return (
      <>
        {Array.from({ length: KOLOM - 3 }, (_, i) => <td key={i} className="pusat"><Nilai v={null} /></td>)}
      </>
    );
  }
  const posisi = [...namaJabatan(ln.jabatan_ids, jmap), ...(ln.posisi_lain ? [ln.posisi_lain] : [])];
  const nk = ln.sebab_gap === "non_kompetensi";

  // Kompetensi: tingkat rekomendasi DSMK ditulis sebagai kode teks (tetap terbaca dicetak hitam-putih), warna hanya penguat.
  let kompetensi: React.ReactNode = null;
  if (ln.kompetensi) {
    const usulan = (c.kompetensi_usulan ?? "").trim();
    const sama = ln.kompetensi.trim().toLowerCase() === usulan.toLowerCase();
    const tag = ln.sumber_kompetensi === "leadership" ? "L" : ln.sumber_kompetensi === "hard" ? "H" : ln.sumber_kompetensi === "usulan" ? "U" : null;
    kompetensi = (
      <>
        <span className={cx(sama && `kuat-${c.kekuatan_usulan}`)}>{ln.kompetensi}</span>
        {tag && <span className="kode">{tag}</span>}
        {sama ? (
          <span className={`kode rek rek-${c.kekuatan_usulan}`}>DSMK {REK_PENDEK[c.kekuatan_usulan]}</span>
        ) : (
          usulan && <span className="kode ganti">Diganti</span>
        )}
        {ln.kompetensi_divalidasi && <span className="kode ok">✓ SME</span>}
        {!sama && usulan && <div className="asal-usulan">Usulan DSMK: {usulan} ({REK_PENDEK[c.kekuatan_usulan].toLowerCase()})</div>}
      </>
    );
  }

  return (
    <>
      <td><Nilai v={posisi.join("; ")} /></td>
      <td><Nilai v={kompetensi} /></td>
      <td><Nilai v={ln.expected_role} /></td>
      <td><Nilai v={ln.gap} /></td>
      <td className={cx(nk && "np")}><Nilai v={teksKolomJ(ln)} /></td>
    </>
  );
}

export function CetakClient({ data }: { data: Data }) {
  const [kertas, setKertas] = useState<Kertas>("A3");
  const [strategi, setStrategi] = useState("semua");
  const [kecualiTidakRelevan, setKecualiTidakRelevan] = useState(true);
  const [idt, setIdt] = useState<Identitas>(IDENTITAS_AWAL);
  const [dicetak] = useState(() => waktu(new Date().toISOString()));

  // Identitas dokumen dan nama penanda tangan diingat per browser (kenyamanan saja; bukan data utama).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KUNCI_SIMPAN);
      if (raw) setIdt({ ...IDENTITAS_AWAL, ...JSON.parse(raw) });
    } catch { /* abaikan */ }
  }, []);
  const ubah = (patch: Partial<Identitas>) =>
    setIdt((x) => {
      const baru = { ...x, ...patch };
      try { localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(baru)); } catch { /* abaikan */ }
      return baru;
    });

  const jmap = useMemo(() => new Map(data.jabatan.map((j) => [j.id, j])), [data.jabatan]);
  const pmap = useMemo(() => new Map(data.prioritas.map((p) => [p.kode, p])), [data.prioritas]);
  const daftarStrategi = useMemo(() => [...new Set(data.capabilities.map((c) => c.strategi))], [data.capabilities]);

  const kelompok = useMemo(() => {
    const lnPerCap = new Map<number, LearningNeed[]>();
    for (const ln of data.learningNeeds) {
      const arr = lnPerCap.get(ln.capability_id) ?? [];
      arr.push(ln);
      lnPerCap.set(ln.capability_id, arr);
    }
    const caps = data.capabilities
      .filter((c) => strategi === "semua" || c.strategi === strategi)
      .filter((c) => !kecualiTidakRelevan || c.relevan !== false)
      .sort((a, b) => a.no - b.no);
    return daftarStrategi
      .filter((s) => strategi === "semua" || s === strategi)
      .map((s) => ({
        strategi: s,
        caps: caps.filter((c) => c.strategi === s).map((c) => ({ c, lns: (lnPerCap.get(c.id) ?? []).sort((a, b) => a.urutan - b.urutan) })),
      }))
      .filter((g) => g.caps.length > 0);
  }, [data, strategi, kecualiTidakRelevan, daftarStrategi]);

  const pasangan = kelompok.flatMap((g) => g.caps.flatMap((x) => x.lns.map((ln) => ({ ln, c: x.c }))));
  const semuaLn = pasangan.map((x) => x.ln);
  const belumLengkap = pasangan.filter(({ ln, c }) => !checklist(ln, c).every((k) => k.ok)).length;
  // Rincian butir checklist yang belum terpenuhi, agar jelas apa yang kurang (mis. "80 menunggu validasi SME").
  const kekurangan = (() => {
    const n = new Map<string, number>();
    for (const { ln, c } of pasangan) for (const k of checklist(ln, c)) if (!k.ok) n.set(k.key, (n.get(k.key) ?? 0) + 1);
    return [...n].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${KURANG[k] ?? k}`);
  })();
  const ketKurang = kekurangan.join(", ");
  const jumlahNk = semuaLn.filter((ln) => ln.sebab_gap === "non_kompetensi").length;

  const judulPendek = "Matriks Learning Needs Analysis · ALNA 2027 · PT KINRA";
  const css = `
    @page {
      size: ${kertas} landscape;
      margin: 9mm 9mm 12mm 9mm;
      @bottom-left { content: "${idt.noDok.replace(/["\\]/g, "")} · ${judulPendek} · RAHASIA – penggunaan internal"; font: 7pt sans-serif; color: #587073; }
      @bottom-right { content: "Halaman " counter(page) " dari " counter(pages); font: 7pt sans-serif; color: #587073; }
    }
  `;

  return (
    <div className="cetak-root">
      <style>{css}</style>

      <div className="cetak-toolbar no-print">
        <div className="tb-baris">
          <Link href="/matriks" className="tb-btn"><ArrowLeft size={15} aria-hidden="true" /> Kembali ke matriks</Link>
          <div className="tb-judul">Cetak formulir matriks LNA</div>
          <button className="tb-btn utama" onClick={() => window.print()}><Printer size={15} aria-hidden="true" /> Cetak / simpan PDF</button>
        </div>
        <div className="tb-baris">
          <div className="tb-seg" role="group" aria-label="Ukuran kertas">
            {(["A3", "A4"] as Kertas[]).map((k) => (
              <button key={k} aria-pressed={kertas === k} onClick={() => setKertas(k)}>{k} landscape</button>
            ))}
          </div>
          <select value={strategi} onChange={(e) => setStrategi(e.target.value)} aria-label="Strategi">
            <option value="semua">Semua strategi</option>
            {daftarStrategi.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="tb-cek">
            <input type="checkbox" checked={kecualiTidakRelevan} onChange={(e) => setKecualiTidakRelevan(e.target.checked)} />
            Sembunyikan capability tidak relevan
          </label>
          <label className="tb-isian">No. formulir<input value={idt.noDok} onChange={(e) => ubah({ noDok: e.target.value })} style={{ width: 140 }} /></label>
          <label className="tb-isian">Unit<input value={idt.unit} onChange={(e) => ubah({ unit: e.target.value })} style={{ width: 180 }} /></label>
          <label className="tb-isian">Fasilitator / SME<input value={idt.fasilitator} onChange={(e) => ubah({ fasilitator: e.target.value })} style={{ width: 200 }} /></label>
        </div>
        <div className="tb-baris">
          {PENANDA_TANGAN.map((p, i) => (
            <label key={p.peran} className="tb-isian">
              {p.peran}
              <input value={idt.nama[i] ?? ""} placeholder={`Nama (${p.jabatan.split(" ")[0]}…)`} style={{ width: 180 }}
                onChange={(e) => ubah({ nama: idt.nama.map((n, j) => (j === i ? e.target.value : n)) })} />
            </label>
          ))}
        </div>
        <div className="tb-ket">
          {belumLengkap > 0 ? (
            <span className="tb-warn">
              <TriangleAlert size={14} aria-hidden="true" /> {belumLengkap} dari {semuaLn.length} learning need belum lengkap: {ketKurang}.
              Lengkapi lewat editor baris di <Link href="/matriks">Matriks LNA</Link>.
            </span>
          ) : (
            <span>Semua {semuaLn.length} learning need sudah lengkap.</span>
          )}{" "}
          Di dialog cetak pilih {kertas} landscape, aktifkan &quot;Background graphics&quot;, matikan &quot;Headers and footers&quot;.
        </div>
      </div>

      <article className={cx("lembar", kertas === "A4" && "a4")}>
        <header className="kop">
          <div className="kop-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kinra-logo-tosca.png" alt="KINRA" />
          </div>
          <div className="kop-judul">
            <div className="eyebrow">Annual Learning Need Analysis (ALNA) 2027 · Tahap 3 Identifikasi Learning Needs</div>
            <h1>Formulir Matriks Analisis Kebutuhan Pembelajaran</h1>
            <div className="sub">Learning Needs Analysis Matrix: dari Strategi Bisnis ke Learning Needs</div>
          </div>
          <table className="kontrol">
            <tbody>
              <tr><th>No. Formulir</th><td>{idt.noDok}</td></tr>
              <tr><th>Revisi</th><td>00</td></tr>
              <tr><th>Tanggal cetak</th><td>{dicetak} WIB</td></tr>
              <tr><th>Klasifikasi</th><td>Rahasia · Internal</td></tr>
            </tbody>
          </table>
        </header>

        <section className="blok">
          <h2><span className="hrf">A</span> Identitas dan ringkasan</h2>
          <table className="identitas">
            <tbody>
              <tr>
                <th>Entitas</th><td>PT Kawasan Industri Nusantara (KINRA) · PTPN Group</td>
                <th>Unit</th><td><Nilai v={idt.unit} /></td>
                <th>Periode rencana</th><td>Tahun 2027</td>
              </tr>
              <tr>
                <th>Forum</th><td>Workshop 3 ALNA, 3–4 November 2026</td>
                <th>Fasilitator / SME</th><td><Nilai v={idt.fasilitator} /></td>
                <th>Lingkup</th><td>{strategi === "semua" ? `Semua strategi (${kelompok.length})` : strategi}</td>
              </tr>
              <tr>
                <th>Cakupan</th>
                <td colSpan={5}>{kelompok.reduce((n, g) => n + g.caps.length, 0)} capability · {semuaLn.length} learning need · {jumlahNk} intervensi non-pelatihan</td>
              </tr>
              <tr>
                <th>Sumber data</th>
                <td colSpan={3}>Aplikasi LNA KINRA: Kertas Kerja Workshop 3 (DSMK), nomenklatur jabatan KINRA, kamus kompetensi PTPN Group, RJPP KINRA 2026–2030</td>
                <th>Status data</th>
                <td>Per {dicetak} WIB{belumLengkap > 0 ? ` · ${belumLengkap} baris belum lengkap (${ketKurang})` : " · lengkap"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="blok">
          <h2><span className="hrf">B</span> Keterangan kode dan skala</h2>
          <div className="skala">
            <div className="skala-kotak">
              <h3>Kode pada kolom Competency</h3>
              <p><b>H</b> hard/teknis · <b>L</b> leadership · <b>U</b> usulan baru · <b>DSMK Kuat/Sedang/Lemah</b> = sama dengan usulan DSMK dan tingkat rekomendasinya · <b>Diganti</b> = diganti SDM/SME · <b>✓ SME</b> = divalidasi SME.</p>
            </div>
            <div className="skala-kotak">
              <h3>Kolom Learning Need</h3>
              <p>Diisi hanya bila gap disebabkan kompetensi. Bila gap bersebab lain (proses, sistem, alat, struktur, insentif), tertulis <b>non-pelatihan</b> beserta intervensi yang disarankan.</p>
              <p><b>–</b> = belum diisi di aplikasi.</p>
            </div>
          </div>
        </section>

        <section className="blok">
          <h2><span className="hrf">C</span> Matriks strategi ke learning needs</h2>
          <table className="matriks">
            <colgroup>
              {[3, 11, 11, 13, 13, 15, 15, 19].map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
            </colgroup>
            <thead>
              <tr className="grup">
                <th colSpan={3} className="g-dsmk">Diisi oleh DSMK</th>
                <th colSpan={5} className="g-sdm">Diisi oleh SDM &amp; SME</th>
              </tr>
              <tr className="judul">
                <th>No</th>
                <th>Strategic Initiative</th>
                <th>Required Capability</th>
                <th>Key Position / Target Population</th>
                <th>Competency</th>
                <th>Expected Role / Performance</th>
                <th>Gap Competency</th>
                <th>Learning Need</th>
              </tr>
              <tr className="nomor">
                {Array.from({ length: KOLOM }, (_, i) => <th key={i}>{i + 1}</th>)}
              </tr>
            </thead>
            <tbody>
              {kelompok.map((g, gi) => (
                <Fragment key={g.strategi}>
                  <tr className="band">
                    <td colSpan={KOLOM}>
                      Business Strategy {gi + 1}: <b>{g.strategi}</b>
                      <span className="band-ket">{g.caps.length} capability · {g.caps.reduce((n, x) => n + x.lns.length, 0)} learning need</span>
                    </td>
                  </tr>
                  {g.caps.map(({ c, lns }) => {
                    const n = Math.max(lns.length, 1);
                    const rjpp = c.prioritas_rjpp.map((k) => `${k} ${pmap.get(k)?.nama ?? ""}`.trim());
                    return Array.from({ length: n }, (_, i) => {
                      const pertama = i === 0;
                      return (
                        <tr key={`${c.id}-${i}`} className={cx(pertama && "awal-cap", c.relevan === false && "redup")}>
                          {/* Tanpa rowSpan: sel gabungan tidak bisa terpotong rapi antarhalaman. Baris lanjutan memakai sel tanpa garis atas. */}
                          {pertama ? (
                            <>
                              <td className="pusat no">{c.no}</td>
                              <td>{c.inisiatif.length > 0 && <ul className="daftar">{c.inisiatif.map((x) => <li key={x}>{x}</li>)}</ul>}</td>
                              <td>
                                <div>{c.capability}</div>
                                {rjpp.length > 0 && <div className="rjpp">RJPP: {rjpp.join("; ")}</div>}
                                {c.relevan === false && <div className="rjpp">Tidak relevan untuk KINRA</div>}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="lanjut pusat"><span className="no-lanjut">{c.no}</span></td>
                              <td className="lanjut" />
                              <td className="lanjut" />
                            </>
                          )}
                          <SelAnalisis ln={lns[i]} c={c} jmap={jmap} />
                        </tr>
                      );
                    });
                  })}
                </Fragment>
              ))}
              {kelompok.length === 0 && <tr><td colSpan={KOLOM} className="pusat">Tidak ada capability untuk filter ini.</td></tr>}
            </tbody>
          </table>
          <p className="catatan-kaki">
            Warna teks Competency = tingkat rekomendasi DSMK ({KEKUATAN_LABEL.kuat.toLowerCase()} hitam, {KEKUATAN_LABEL.sedang.toLowerCase()} oranye,{" "}
            {KEKUATAN_LABEL.lemah.toLowerCase()} merah). Strategi: {kelompok.map((g, i) => `${i + 1} ${strategiPendek(g.strategi)}`).join(" · ")}.
          </p>
        </section>

        <section className="blok tahan">
          <h2><span className="hrf">D</span> Pengesahan</h2>
          <div className="pengesahan">
            {PENANDA_TANGAN.map((p, i) => (
              <div key={p.peran} className="ttd">
                <div className="peran">{p.peran}</div>
                <div className="ruang-ttd" />
                <div className="baris-ttd"><span>Nama</span><em className={cx(!idt.nama[i] && "kosong-ttd")}>{idt.nama[i]}</em></div>
                <div className="baris-ttd"><span>Jabatan</span><em>{p.jabatan}</em></div>
                <div className="baris-ttd"><span>Tanggal</span><em className="kosong-ttd" /></div>
              </div>
            ))}
          </div>
          <p className="catatan-kaki">
            Formulir ini adalah keluaran Tahap 3 ALNA 2027 dan menjadi masukan Tahap 4 (penetapan learning priorities), validasi Direktur, dan perancangan learning
            solutions. Setiap learning need tertelusur ke Business Strategy dan Strategic Initiative pada baris yang sama. Dicetak dari aplikasi LNA KINRA, {dicetak} WIB.
          </p>
        </section>
      </article>
    </div>
  );
}
