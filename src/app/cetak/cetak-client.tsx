"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, TriangleAlert } from "lucide-react";
import type { Capability, Jabatan, LearningNeed, PrioritasRjpp } from "@/lib/types";
import {
  gapLevel, KATEGORI_LABEL, kategoriPrioritas, KEKUATAN_LABEL, METODE, namaJabatan, penilaianLengkap, skorPrioritas, strategiPendek, teksKolomJ, waktu,
} from "@/lib/domain";

type Data = { capabilities: Capability[]; learningNeeds: LearningNeed[]; jabatan: Jabatan[]; prioritas: PrioritasRjpp[] };
type Kertas = "A3" | "A4";

const KOLOM = 20;
const REK_PENDEK = { kuat: "Kuat", sedang: "Sedang", lemah: "Lemah" } as const;
const TW = ["I", "II", "III", "IV"];
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

  const gap = gapLevel(ln);
  const skor = skorPrioritas(ln);
  const kat = kategoriPrioritas(skor);
  const metode = METODE.filter((m) => ln.metode.includes(m.v)).map((m) => m.kode).join(" · ");
  // Level dan metode tidak berlaku untuk intervensi non-pelatihan
  const na = <span className="na">n/a</span>;

  return (
    <>
      <td><Nilai v={posisi.join("; ")} /></td>
      <td className="angka"><Nilai v={ln.jumlah_peserta} /></td>
      <td><Nilai v={kompetensi} /></td>
      <td><Nilai v={ln.expected_role} /></td>
      <td className="angka">{nk ? na : <Nilai v={ln.level_dibutuhkan} />}</td>
      <td className="angka">{nk ? na : <Nilai v={ln.level_saat_ini} />}</td>
      <td className={cx("angka", "gap", gap != null && gap >= 1 && "ada")}>{nk ? na : <Nilai v={gap} />}</td>
      <td><Nilai v={ln.gap} /></td>
      <td className="angka sebab-gap"><Nilai v={ln.sebab_gap === "kompetensi" ? "K" : nk ? "NK" : null} /></td>
      <td className={cx(nk && "np")}><Nilai v={teksKolomJ(ln)} /></td>
      <td className="angka"><Nilai v={ln.skor_relevansi} /></td>
      <td className="angka"><Nilai v={ln.skor_kritikalitas} /></td>
      <td className="angka"><Nilai v={ln.skor_urgensi} /></td>
      <td className={cx("angka skor", kat && `kat-${kat}`)}>
        {skor == null ? <Nilai v={null} /> : <><b>{skor}</b><div className="kat">{KATEGORI_LABEL[kat!]}</div></>}
      </td>
      <td className="angka">{nk ? na : <Nilai v={metode} />}</td>
      <td className="angka"><Nilai v={ln.target_tw ? `TW ${TW[ln.target_tw - 1]}` : null} /></td>
      <td><Nilai v={ln.pic} /></td>
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

  const semuaLn = kelompok.flatMap((g) => g.caps.flatMap((x) => x.lns));
  const belumLengkap = semuaLn.filter((ln) => !penilaianLengkap(ln)).length;
  const ringkas = useMemo(() => {
    const kat = { tinggi: 0, sedang: 0, rendah: 0 };
    let peserta = 0, nk = 0;
    for (const ln of semuaLn) {
      const k = kategoriPrioritas(skorPrioritas(ln));
      if (k) kat[k]++;
      peserta += ln.jumlah_peserta ?? 0;
      if (ln.sebab_gap === "non_kompetensi") nk++;
    }
    return { kat, peserta, nk };
  }, [semuaLn]);

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
              <TriangleAlert size={14} aria-hidden="true" /> {belumLengkap} dari {semuaLn.length} learning need belum lengkap penilaiannya (tampil &quot;–&quot; di formulir).
              Lengkapi lewat editor baris di <Link href="/matriks">Matriks LNA</Link>, bagian K.
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
                <td>{kelompok.reduce((n, g) => n + g.caps.length, 0)} capability · {semuaLn.length} learning need · {ringkas.nk} intervensi non-pelatihan</td>
                <th>Prioritas</th>
                <td>Tinggi {ringkas.kat.tinggi} · Sedang {ringkas.kat.sedang} · Rendah {ringkas.kat.rendah}</td>
                <th>Total peserta</th>
                <td>{ringkas.peserta.toLocaleString("id-ID")} orang (jumlah per baris, bisa beririsan)</td>
              </tr>
              <tr>
                <th>Sumber data</th>
                <td colSpan={3}>Aplikasi LNA KINRA: Kertas Kerja Workshop 3 (DSMK), nomenklatur jabatan KINRA, kamus kompetensi PTPN Group, RJPP KINRA 2026–2030</td>
                <th>Status data</th>
                <td>Per {dicetak} WIB{belumLengkap > 0 ? ` · ${belumLengkap} baris belum lengkap` : " · lengkap"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="blok">
          <h2><span className="hrf">B</span> Keterangan kode dan skala</h2>
          <div className="skala">
            <div className="skala-kotak">
              <h3>Level kemahiran (kolom 8–10)</h3>
              <ol className="lvl">
                <li><b>1 Dasar</b>: mengenal konsep, perlu bimbingan penuh</li>
                <li><b>2 Berkembang</b>: menerapkan tugas rutin dengan bimbingan</li>
                <li><b>3 Mandiri</b>: menerapkan secara mandiri dan konsisten</li>
                <li><b>4 Mahir</b>: menangani kasus kompleks, membimbing orang lain</li>
                <li><b>5 Ahli</b>: menjadi rujukan, menetapkan standar dan inovasi</li>
              </ol>
              <p>Gap = dibutuhkan − saat ini; gap ≥ 1 ditebalkan. <b>n/a</b> = tidak berlaku untuk intervensi non-pelatihan.</p>
            </div>
            <div className="skala-kotak">
              <h3>Sebab gap (kolom 12) dan kompetensi (kolom 6)</h3>
              <p><b>K</b> kompetensi: kurang pengetahuan, keterampilan, atau sikap; dijawab dengan learning need.</p>
              <p><b>NK</b> non-kompetensi: proses, sistem, alat, struktur, atau insentif; kolom 13 berisi intervensi non-pelatihan.</p>
              <p><b>H</b> hard/teknis · <b>L</b> leadership · <b>U</b> usulan baru · <b>DSMK Kuat/Sedang/Lemah</b> = sama dengan usulan DSMK dan tingkat rekomendasinya · <b>Diganti</b> = diganti SDM/SME · <b>✓ SME</b> = divalidasi SME.</p>
            </div>
            <div className="skala-kotak">
              <h3>Prioritas (kolom 14–17)</h3>
              <table className="tbl-mini">
                <thead><tr><th /><th>1</th><th>2</th><th>3</th></tr></thead>
                <tbody>
                  <tr><th>R Relevansi strategi</th><td>pendukung</td><td>terkait langsung</td><td>inti RJPP</td></tr>
                  <tr><th>K Kritikalitas</th><td>dampak kecil</td><td>dampak unit</td><td>dampak korporat</td></tr>
                  <tr><th>U Urgensi</th><td>&gt; 12 bulan</td><td>6–12 bulan</td><td>&lt; 6 bulan</td></tr>
                </tbody>
              </table>
              <p>Skor = R × K × U (1–27): <b>Tinggi ≥ 12</b> · <b>Sedang 6–9</b> · <b>Rendah ≤ 4</b>.</p>
            </div>
            <div className="skala-kotak">
              <h3>Metode 70:20:10 (kolom 18) dan rencana</h3>
              {METODE.map((m) => <p key={m.v}><b>{m.kode}</b> {m.label}: {m.ket}.</p>)}
              <p><b>TW</b> = triwulan pelaksanaan 2027. <b>PIC</b> = penanggung jawab pelaksanaan.</p>
              <p><b>–</b> = belum diisi di aplikasi.</p>
            </div>
          </div>
        </section>

        <section className="blok">
          <h2><span className="hrf">C</span> Matriks strategi ke learning needs</h2>
          <table className="matriks">
            <colgroup>
              {[2.6, 9, 9.5, 9, 2.8, 9, 10.5, 2.6, 2.6, 2.6, 9, 2.8, 11.2, 2.2, 2.2, 2.2, 3.4, 3.6, 3.2, 4.2].map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
            </colgroup>
            <thead>
              <tr className="grup">
                <th colSpan={3} className="g-dsmk">Konteks strategis (DSMK)</th>
                <th colSpan={9} className="g-sdm">Analisis kompetensi dan gap (SDM &amp; SME)</th>
                <th colSpan={8} className="g-rencana">Kebutuhan, prioritas, dan rencana</th>
              </tr>
              <tr className="judul">
                <th rowSpan={2}>No</th>
                <th rowSpan={2}>Strategic Initiative</th>
                <th rowSpan={2}>Required Capability</th>
                <th rowSpan={2}>Key Position / Target Population</th>
                <th rowSpan={2}>Jml org</th>
                <th rowSpan={2}>Competency</th>
                <th rowSpan={2}>Expected Role / Performance</th>
                <th colSpan={3}>Level kemahiran</th>
                <th rowSpan={2}>Gap Competency (uraian)</th>
                <th rowSpan={2}>Sebab gap</th>
                <th rowSpan={2}>Learning Need / Intervensi</th>
                <th colSpan={4}>Prioritas</th>
                <th rowSpan={2}>Metode 70:20:10</th>
                <th rowSpan={2}>Target (TW)</th>
                <th rowSpan={2}>PIC</th>
              </tr>
              <tr className="judul sub">
                <th>Butuh</th><th>Kini</th><th>Gap</th>
                <th>R</th><th>K</th><th>U</th><th>Skor</th>
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
