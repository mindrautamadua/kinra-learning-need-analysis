"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import type { Capability, Jabatan, LearningNeed, PrioritasRjpp } from "@/lib/types";
import { kategoriPrioritas, skorPrioritas, statusLN, strategiPendek, waktu } from "@/lib/domain";

type Data = { capabilities: Capability[]; learningNeeds: LearningNeed[]; jabatan: Jabatan[]; prioritas: PrioritasRjpp[] };
type Kertas = "A3" | "A4";
type Baris = { kunci: string; nama: string; level: string; lns: { l: LearningNeed; c: Capability }[] };

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const LUAR = "Posisi lain (di luar nomenklatur KINRA)";

/** Hitungan per kolom untuk satu kumpulan learning need. */
function hitung(lns: { l: LearningNeed; c: Capability }[], daftarStrategi: string[]) {
  const perStrategi = daftarStrategi.map((s) => lns.filter((x) => x.c.strategi === s).length);
  const nk = lns.filter((x) => x.l.sebab_gap === "non_kompetensi").length;
  const kat = { tinggi: 0, sedang: 0, rendah: 0 };
  for (const x of lns) {
    const k = kategoriPrioritas(skorPrioritas(x.l));
    if (k) kat[k]++;
  }
  return { perStrategi, total: lns.length, pelatihan: lns.length - nk, nk, kat };
}

const Angka = ({ n, maks }: { n: number; maks?: number }) =>
  n === 0 ? (
    <span className="belum">·</span>
  ) : (
    <b style={maks ? { display: "block", background: `rgba(0, 133, 140, ${0.08 + 0.32 * (n / maks)})`, margin: "-1mm -1.2mm", padding: "1mm 0" } : undefined}>{n}</b>
  );

export function CetakJabatanClient({ data }: { data: Data }) {
  const [kertas, setKertas] = useState<Kertas>("A4");
  const [hanyaLengkap, setHanyaLengkap] = useState(false);
  const [dicetak] = useState(() => waktu(new Date().toISOString()));

  const cmap = useMemo(() => new Map(data.capabilities.map((c) => [c.id, c])), [data.capabilities]);
  const daftarStrategi = useMemo(
    () => [...new Set([...data.capabilities].sort((a, b) => a.no - b.no).map((c) => c.strategi))],
    [data.capabilities],
  );

  // Learning need yang dihitung: capability relevan, status bukan tidak relevan, opsional hanya yang lengkap.
  const dipakai = useMemo(
    () =>
      data.learningNeeds
        .map((l) => ({ l, c: cmap.get(l.capability_id)! }))
        .filter((x) => x.c && x.c.relevan !== false)
        .filter((x) => {
          const s = statusLN(x.l, x.c);
          return s !== "tidak_relevan" && s !== "belum" && (!hanyaLengkap || s === "lengkap");
        }),
    [data.learningNeeds, cmap, hanyaLengkap],
  );

  // Satu learning need bisa menyasar beberapa jabatan, jadi muncul di setiap baris jabatan itu.
  const kelompok = useMemo(() => {
    const perJabatan = new Map<number, Baris["lns"]>();
    const perLain = new Map<string, Baris["lns"]>();
    for (const x of dipakai) {
      for (const id of new Set(x.l.jabatan_ids)) perJabatan.set(id, [...(perJabatan.get(id) ?? []), x]);
      const lain = x.l.posisi_lain?.trim();
      if (lain) perLain.set(lain, [...(perLain.get(lain) ?? []), x]);
    }
    const grup = new Map<string, Baris[]>();
    for (const j of data.jabatan) {
      const lns = perJabatan.get(j.id);
      if (!lns) continue;
      const g = j.divisi || j.direktorat || "Unit belum ditetapkan";
      grup.set(g, [...(grup.get(g) ?? []), { kunci: `j${j.id}`, nama: j.nama, level: j.level, lns }]);
    }
    const hasil = [...grup.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "id"))
      .map(([unit, baris]) => ({ unit, baris: baris.sort((a, b) => b.lns.length - a.lns.length || a.nama.localeCompare(b.nama, "id")) }));
    if (perLain.size > 0) {
      hasil.push({
        unit: LUAR,
        baris: [...perLain.entries()]
          .map(([nama, lns]) => ({ kunci: `l${nama}`, nama, level: "–", lns }))
          .sort((a, b) => b.lns.length - a.lns.length || a.nama.localeCompare(b.nama, "id")),
      });
    }
    return hasil;
  }, [dipakai, data.jabatan]);

  const tanpaPosisi = dipakai.filter((x) => x.l.jabatan_ids.length === 0 && !x.l.posisi_lain?.trim()).length;
  const jumlahJabatan = kelompok.reduce((n, g) => n + g.baris.length, 0);
  const maks = Math.max(1, ...kelompok.flatMap((g) => g.baris.flatMap((b) => hitung(b.lns, daftarStrategi).perStrategi)));
  const total = hitung(dipakai, daftarStrategi);
  const nS = daftarStrategi.length;
  const kolom = 3 + nS + 3 + 3;

  const css = `
    @page {
      size: ${kertas} landscape;
      margin: 9mm 9mm 12mm 9mm;
      @bottom-left { content: "Matriks Learning Need per Jabatan · ALNA 2027 · PT KINRA · RAHASIA – penggunaan internal"; font: 7pt sans-serif; color: #587073; }
      @bottom-right { content: "Halaman " counter(page) " dari " counter(pages); font: 7pt sans-serif; color: #587073; }
    }
  `;

  return (
    <div className="cetak-root">
      <style>{css}</style>

      <div className="cetak-toolbar no-print">
        <div className="tb-baris">
          <Link href="/matriks" className="tb-btn"><ArrowLeft size={15} aria-hidden="true" /> Kembali ke matriks</Link>
          <div className="tb-judul">Cetak matriks learning need per jabatan</div>
          <button className="tb-btn utama" onClick={() => window.print()}><Printer size={15} aria-hidden="true" /> Cetak / simpan PDF</button>
        </div>
        <div className="tb-baris">
          <div className="tb-seg" role="group" aria-label="Ukuran kertas">
            {(["A3", "A4"] as Kertas[]).map((k) => (
              <button key={k} aria-pressed={kertas === k} onClick={() => setKertas(k)}>{k} landscape</button>
            ))}
          </div>
          <label className="tb-cek">
            <input type="checkbox" checked={hanyaLengkap} onChange={(e) => setHanyaLengkap(e.target.checked)} />
            Hanya learning need berstatus lengkap
          </label>
        </div>
        <div className="tb-ket">
          Menghitung {dipakai.length} learning need ({hanyaLengkap ? "status lengkap" : "status sebagian dan lengkap"}; capability tidak relevan dan baris kosong tidak dihitung).
          {tanpaPosisi > 0 && <> {tanpaPosisi} learning need belum punya Key Position sehingga tidak muncul di baris mana pun.</>}{" "}
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
            <h1>Matriks Jumlah Learning Need per Jabatan</h1>
            <div className="sub">Sebaran learning need menurut Key Position dan Business Strategy</div>
          </div>
          <table className="kontrol">
            <tbody>
              <tr><th>Tanggal cetak</th><td>{dicetak} WIB</td></tr>
              <tr><th>Cakupan</th><td>{hanyaLengkap ? "Status lengkap" : "Sebagian + lengkap"}</td></tr>
              <tr><th>Jabatan</th><td>{jumlahJabatan}</td></tr>
              <tr><th>Klasifikasi</th><td>Rahasia · Internal</td></tr>
            </tbody>
          </table>
        </header>

        <section className="blok">
          <h2><span className="hrf">A</span> Matriks jabatan × strategi</h2>
          <table className="matriks">
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "8%" }} />
              {daftarStrategi.map((s) => <col key={s} style={{ width: `${40 / nS}%` }} />)}
              {Array.from({ length: 6 }, (_, i) => <col key={i} style={{ width: `${27 / 6}%` }} />)}
            </colgroup>
            <thead>
              <tr className="grup">
                <th colSpan={3} className="g-dsmk">Key Position</th>
                <th colSpan={nS} className="g-sdm">Jumlah learning need per Business Strategy</th>
                <th colSpan={3} className="g-rencana">Jenis</th>
                <th colSpan={3} className="g-rencana">Prioritas</th>
              </tr>
              <tr className="judul">
                <th>No</th>
                <th>Jabatan</th>
                <th>Level</th>
                {daftarStrategi.map((s, i) => <th key={s} title={s}>{i + 1}. {strategiPendek(s)}</th>)}
                <th>Total</th>
                <th>Pelatihan</th>
                <th>Non-pelatihan</th>
                <th>Tinggi</th>
                <th>Sedang</th>
                <th>Rendah</th>
              </tr>
            </thead>
            <tbody>
              {kelompok.map((g) => {
                const sub = hitung([...new Map(g.baris.flatMap((b) => b.lns).map((x) => [x.l.id, x])).values()], daftarStrategi);
                return (
                  <Fragment key={g.unit}>
                    <tr className="band">
                      <td colSpan={kolom}>
                        <b>{g.unit}</b>
                        <span className="band-ket">{g.baris.length} jabatan · {sub.total} learning need unik</span>
                      </td>
                    </tr>
                    {g.baris.map((b, i) => {
                      const h = hitung(b.lns, daftarStrategi);
                      return (
                        <tr key={b.kunci}>
                          <td className="pusat">{i + 1}</td>
                          <td>{b.nama}</td>
                          <td className="pusat">{b.level}</td>
                          {h.perStrategi.map((n, k) => <td key={k} className="angka"><Angka n={n} maks={maks} /></td>)}
                          <td className="angka skor"><b>{h.total}</b></td>
                          <td className="angka"><Angka n={h.pelatihan} /></td>
                          <td className="angka"><Angka n={h.nk} /></td>
                          <td className="angka"><Angka n={h.kat.tinggi} /></td>
                          <td className="angka"><Angka n={h.kat.sedang} /></td>
                          <td className="angka"><Angka n={h.kat.rendah} /></td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
              {kelompok.length === 0 && <tr><td colSpan={kolom} className="pusat">Belum ada learning need yang punya Key Position.</td></tr>}
              {kelompok.length > 0 && (
                <tr className="awal-cap">
                  <td colSpan={3}><b>Total learning need unik</b></td>
                  {total.perStrategi.map((n, k) => <td key={k} className="angka skor"><b>{n}</b></td>)}
                  <td className="angka skor"><b>{total.total}</b></td>
                  <td className="angka skor"><b>{total.pelatihan}</b></td>
                  <td className="angka skor"><b>{total.nk}</b></td>
                  <td className="angka skor"><b>{total.kat.tinggi}</b></td>
                  <td className="angka skor"><b>{total.kat.sedang}</b></td>
                  <td className="angka skor"><b>{total.kat.rendah}</b></td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="catatan-kaki">
            Satu learning need bisa menyasar beberapa jabatan, sehingga dihitung di setiap jabatan tersebut; baris total dan subtotal unit menghitung learning need unik (tidak
            dijumlah per baris). Prioritas dihitung dari skor R × K × U (Tinggi ≥ 12 · Sedang 6–9 · Rendah ≤ 4); learning need yang belum diberi skor tidak masuk kolom
            prioritas. Warna sel strategi makin pekat makin banyak learning need. Strategi: {daftarStrategi.map((s, i) => `${i + 1} ${s}`).join(" · ")}. Dicetak dari
            aplikasi LNA KINRA, {dicetak} WIB.
          </p>
        </section>
      </article>
    </div>
  );
}
