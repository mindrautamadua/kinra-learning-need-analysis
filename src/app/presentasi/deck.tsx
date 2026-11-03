"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Compass, Crosshair, LayoutGrid, Map as IkonPeta, Maximize, Minimize, PiggyBank, StickyNote, Waves, X,
} from "lucide-react";

export type Statistik = {
  dataPer: string;
  capability: number;
  relevan: number;
  tidakRelevan: string[];
  capIds: boolean[];
  ln: number;
  capMultiLn: number;
  inisiatif: number;
  strategi: { nama: string; pendek: string; tema: string; capability: number; relevan: number; ln: number; inisiatif: string[] }[];
  kekuatan: { kuat: number; sedang: number; lemah: number };
  kompetensiSama: number;
  kompetensiDiganti: number;
  kompetensiUsulan: number;
  divalidasi: number;
  lengkap: number;
  pelatihan: number;
  nonPelatihan: { capability: string; intervensi: string }[];
  jabatanTotal: number;
  jabatanTerlibat: number;
  level: { level: string; total: number; terlibat: number }[];
  topJabatan: { nama: string; level: string; n: number }[];
  rjpp: { kode: string; nama: string; pilar: string; jenis: string; n: number }[];
  contoh: {
    strategi: string; inisiatif: string[]; capability: string; rjpp: string[]; posisi: string[];
    kompetensi: string; expected: string; gap: string; ln: string;
  } | null;
};

const W = 1920;
const H = 1080;
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
/** Jeda animasi per elemen (ms) lewat custom property --d. */
const d = (ms: number, extra?: React.CSSProperties) => ({ "--d": `${ms}ms`, ...extra }) as React.CSSProperties;
const fmt = (n: number) => n.toLocaleString("id-ID");
const WARNA_GO: Record<string, string> = {
  "Go Lean": "#32a3dc", "Go Secure": "#f15a22", "Go Beyond": "#fcaf17", "Go Green": "#6fd3a8", "Go AI": "#3cc2c6",
};
const warnaGo = (pendek: string, i: number) => WARNA_GO[pendek] ?? ["#32a3dc", "#f15a22", "#fcaf17", "#6fd3a8", "#3cc2c6"][i % 5];

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

/* ---------- Primitif animasi ---------- */

/** Angka yang menghitung naik setiap kali slide aktif. */
function Hitung({ n, aktif, tunda = 0, durasi = 1600 }: { n: number; aktif: boolean; tunda?: number; durasi?: number }) {
  const [v, setV] = useState(n);
  const reduced = useReduced();
  useEffect(() => {
    if (!aktif) return;
    if (reduced) { setV(n); return; }
    let raf = 0;
    const t0 = performance.now() + tunda;
    setV(0);
    const step = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / durasi));
      setV(Math.round(n * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [aktif, n, tunda, durasi, reduced]);
  return <span className="tnum">{fmt(v)}</span>;
}

/** Judul yang muncul kata demi kata dari balik masker. */
function Judul({ teks, tunda = 0, besar = false, sorot }: { teks: string; tunda?: number; besar?: boolean; sorot?: string[] }) {
  const kata = teks.split(" ");
  return (
    <h2 className={cx("pz-judul", besar && "besar")} aria-label={teks}>
      {kata.map((k, i) => (
        <span key={i} className="kata" aria-hidden="true">
          <span style={d(tunda + i * 70)} className={cx(sorot?.includes(k.replace(/[,.:]/g, "")) && "sorot")}>{k}</span>
        </span>
      ))}
    </h2>
  );
}

const Eyebrow = ({ children, tunda = 0 }: { children: React.ReactNode; tunda?: number }) => (
  <div className="pz-eyebrow a" style={d(tunda)}>{children}</div>
);

/* ---------- Latar: medan partikel yang "melesat" saat berganti slide ---------- */

function Medan({ denyut }: { denyut: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dorong = useRef(0);
  const reduced = useReduced();
  useEffect(() => { dorong.current = 1; }, [denyut]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const warna = ["50,163,220", "60,194,198", "60,194,198", "50,163,220", "252,175,23", "241,90,34"];
    const N = 120;
    const p = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003, vy: (Math.random() - 0.5) * 0.0003,
      r: Math.random() * 1.8 + 0.6, c: warna[Math.floor(Math.random() * warna.length)],
    }));
    let w = 0, h = 0, raf = 0;
    const ukur = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ukur();
    window.addEventListener("resize", ukur);
    const gambar = () => {
      ctx.clearRect(0, 0, w, h);
      const boost = 1 + dorong.current * 22;
      dorong.current *= 0.93;
      for (const a of p) {
        a.x += a.vx * boost; a.y += a.vy * boost;
        if (a.x < 0) a.x += 1; if (a.x > 1) a.x -= 1;
        if (a.y < 0) a.y += 1; if (a.y > 1) a.y -= 1;
      }
      const maks = Math.min(w, h) * 0.13;
      for (let i = 0; i < N; i++) {
        const a = p[i];
        for (let j = i + 1; j < N; j++) {
          const b = p[j];
          const dx = (a.x - b.x) * w, dy = (a.y - b.y) * h;
          const dist = Math.hypot(dx, dy);
          if (dist < maks) {
            ctx.strokeStyle = `rgba(${a.c},${0.16 * (1 - dist / maks)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h); ctx.stroke();
          }
        }
      }
      for (const a of p) {
        ctx.fillStyle = `rgba(${a.c},0.75)`;
        ctx.beginPath(); ctx.arc(a.x * w, a.y * h, a.r * (1 + dorong.current * 0.8), 0, Math.PI * 2); ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(gambar);
    };
    gambar();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", ukur); };
  }, [reduced]);
  return <canvas ref={ref} className="pz-medan" aria-hidden="true" />;
}

/** Motif lingkaran bertumpuk Kinra yang mengorbit. */
const Motif = () => (
  <div className="pz-motif" aria-hidden="true">
    <div className="inti"><span className="m1" /><span className="m2" /><span className="m3" /><span className="m4" /></div>
    <i className="cincin c1" /><i className="cincin c2" /><i className="cincin c3" />
  </div>
);

/* ---------- Slide ---------- */

type Slide = { judul: string; catatan: string; isi: (aktif: boolean) => React.ReactNode; kelas?: string };

const TAHAP = [
  { no: 1, nama: "Kick-off & finalisasi worksheet", jadwal: "19–23 Okt" },
  { no: 2, nama: "Strategic Direction dengan DSMK", jadwal: "23 Okt" },
  { no: 3, nama: "Identifikasi Learning Needs", jadwal: "26 Okt – 13 Nov", sesi: "Workshop 3–4 Nov" },
  { no: 4, nama: "Penyusunan Learning Priorities", jadwal: "9–13 Nov", sesi: "Workshop 11 Nov" },
  { no: 5, nama: "Pitching (validasi) ke Direktur Bidang", jadwal: "16–27 Nov" },
  { no: 6, nama: "Perancangan Learning Solutions", jadwal: "23 Nov – 4 Des", sesi: "Workshop 1–3 Des" },
  { no: 7, nama: "Finalisasi dokumen ALNA", jadwal: "14–18 Des" },
];

const RANTAI = [
  { nama: "Business Strategy", tanya: "Ke mana bisnis diarahkan?" },
  { nama: "Strategic Initiative", tanya: "Inisiatif apa yang paling menentukan?" },
  { nama: "Required Capability", tanya: "Organisasi harus mampu melakukan apa?" },
  { nama: "Key Position", tanya: "Siapa yang paling menentukan keberhasilan?" },
  { nama: "Competency", tanya: "Kompetensi apa yang menopang?" },
  { nama: "Expected Role", tanya: "Apa yang harus dilakukan berbeda?" },
  { nama: "Gap", tanya: "Sudah sejauh mana, apa yang kurang?" },
  { nama: "Learning Need", tanya: "Kemampuan apa yang perlu dibangun?" },
];

function buatSlide(s: Statistik): Slide[] {
  const maxLn = Math.max(1, ...s.strategi.map((x) => x.ln));
  const top = [...s.strategi].sort((a, b) => b.ln - a.ln)[0];
  const persenTop = s.ln ? Math.round((top.ln / s.ln) * 100) : 0;
  const maxRjpp = Math.max(1, ...s.rjpp.map((r) => r.n));
  const rjppNol = s.rjpp.filter((r) => r.n === 0);
  const rjppTipis = s.rjpp.filter((r) => r.n === 1);
  const grupRjpp = [
    ...[...new Set(s.rjpp.filter((r) => r.jenis === "pilar_utama").map((r) => r.pilar))].map((p) => ({ judul: p, isi: s.rjpp.filter((r) => r.jenis === "pilar_utama" && r.pilar === p) })),
    { judul: "Fondasi (Enablers)", isi: s.rjpp.filter((r) => r.jenis === "enabler") },
    { judul: "Inisiatif strategis 2027", isi: s.rjpp.filter((r) => r.jenis === "inisiatif_2027") },
  ].filter((g) => g.isi.length > 0);
  const maxJab = Math.max(1, ...s.topJabatan.map((j) => j.n));
  const totalKekuatan = s.kekuatan.kuat + s.kekuatan.sedang + s.kekuatan.lemah || 1;
  const persenValidasi = s.ln ? Math.round((s.divalidasi / s.ln) * 100) : 0;
  const sisaValidasi = s.ln - s.divalidasi;
  const contohTidakRelevan = s.tidakRelevan.slice(0, 7);

  return [
    /* 1. Sampul */
    {
      judul: "Sampul",
      kelas: "sampul",
      catatan: "Buka dengan konteks: ini hasil kerja Tahap 3 ALNA 2027, workshop 3–4 November. Semua angka di presentasi ini dibaca langsung dari aplikasi LNA KINRA, jadi selalu mutakhir.",
      isi: (aktif) => (
        <>
          <Motif />
          <div className="pz-sampul">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pz-logo a a-zoom" style={d(0)} src="/brand/kinra-logo-putih.png" alt="KINRA" />
            <Eyebrow tunda={250}>Annual Learning Need Analysis 2027 · Tahap 3</Eyebrow>
            <Judul besar teks="Dari Strategi Bisnis ke Learning Needs" tunda={400} sorot={["Learning", "Needs"]} />
            <p className="pz-lead a" style={d(1100)}>Hasil identifikasi kebutuhan pembelajaran PT Kawasan Industri Nusantara untuk tahun 2027</p>
            <div className="pz-kpi-baris">
              {[
                { n: s.strategi.length, l: "strategi Go" },
                { n: s.relevan, l: "capability relevan" },
                { n: s.ln, l: "learning needs" },
                { n: s.jabatanTerlibat, l: "key position" },
              ].map((k, i) => (
                <div key={k.l} className="pz-kpi a a-naik" style={d(1400 + i * 140)}>
                  <b><Hitung n={k.n} aktif={aktif} tunda={1400 + i * 140} /></b>
                  <span>{k.l}</span>
                </div>
              ))}
            </div>
            <div className="pz-kaki a" style={d(2100)}>Workshop 3 ALNA · 3–4 November 2026 · PTPN Group</div>
          </div>
        </>
      ),
    },

    /* 2. Mengapa LNA */
    {
      judul: "Mengapa LNA",
      catatan: "Tekankan: LNA mengganti asumsi dengan analisis. Setiap rupiah dan jam belajar diarahkan ke kebutuhan yang paling berdampak pada bisnis. Sejalan dengan One PTPN Big Dream, RJPP HC 2026–2030, dan 3on3.",
      isi: () => (
        <div className="pz-isi">
          <Eyebrow>Pendahuluan</Eyebrow>
          <Judul teks="Pelatihan yang tepat sasaran berawal dari analisis, bukan asumsi" sorot={["analisis,"]} />
          <div className="pz-empat">
            {[
              { ikon: Waves, j: "Perubahan lingkungan bisnis", t: "Strategi, teknologi, regulasi, dan pasar bergerak cepat. Kapabilitas SDM harus ikut menyesuaikan." },
              { ikon: Crosshair, j: "Kesenjangan kompetensi", t: "Tanpa analisis sistematis, pelatihan dirancang dari asumsi dan sering tidak tepat sasaran." },
              { ikon: PiggyBank, j: "Efektivitas investasi", t: "Prioritas berdasarkan relevansi strategis, kekritisan, dan urgensi, bukan permintaan umum." },
              { ikon: IkonPeta, j: "Dasar perencanaan", t: "Input roadmap kapabilitas dan Learning Portfolio tahunan yang selaras dengan strategi jangka panjang." },
            ].map((k, i) => (
              <div key={k.j} className="pz-kartu a a-angkat" style={d(700 + i * 180)}>
                <div className="pz-kartu-no">0{i + 1}</div>
                <k.ikon className="pz-kartu-ikon" aria-hidden="true" />
                <h3>{k.j}</h3>
                <p>{k.t}</p>
              </div>
            ))}
          </div>
          <div className="pz-pita a" style={d(1600)}>
            <span>One PTPN Big Dream</span><i /><span>RJPP HC 2026–2030</span><i /><span>3on3 · Continuous Learning</span>
          </div>
        </div>
      ),
    },

    /* 3. Timeline */
    {
      judul: "Posisi kita",
      catatan: "Kita di Tahap 3. Output tahap ini adalah daftar learning needs. Tahap 4 (9–13 November) mengubahnya menjadi learning priorities, lalu dipitching ke Direktur Bidang.",
      isi: () => (
        <div className="pz-isi">
          <Eyebrow>Timeline ALNA · Oktober – Desember 2026</Eyebrow>
          <Judul teks="Kita berada di Tahap 3 dari 7" sorot={["Tahap", "3"]} />
          <div className="pz-timeline">
            <div className="pz-rel"><div className="pz-rel-isi" style={{ "--p": `${(2.5 / 6) * 100}%` } as React.CSSProperties} /></div>
            {TAHAP.map((t, i) => (
              <div key={t.no} className={cx("pz-tahap a a-naik", t.no === 3 && "kini", t.no < 3 && "selesai")} style={d(600 + i * 160)}>
                <div className="pz-tahap-titik">{t.no < 3 ? <Check size={22} aria-hidden="true" /> : t.no}{t.no === 3 && <><i className="denyut" /><i className="denyut d2" /></>}</div>
                {t.no === 3 && <div className="pz-disini">Hari ini</div>}
                <div className="pz-tahap-nama">{t.nama}</div>
                <div className="pz-tahap-jadwal">{t.jadwal}</div>
                {t.sesi && <div className="pz-tahap-sesi">{t.sesi}</div>}
              </div>
            ))}
          </div>
          <div className="pz-catatan-bawah a" style={d(1900)}>Output Tahap 3: <b>daftar learning needs</b> yang tertelusur ke strategi bisnis, sebagai masukan Tahap 4.</div>
        </div>
      ),
    },

    /* 4. Rantai */
    {
      judul: "Delapan mata rantai",
      catatan: "Ini logika kertas kerja. Tiga mata rantai pertama disiapkan DSMK dari strategic house. Lima berikutnya diisi SDM & SME KINRA. Aturannya: setiap learning need harus bisa ditelusuri mundur sampai strategi.",
      isi: () => (
        <div className="pz-isi">
          <Eyebrow>Kerangka kerja</Eyebrow>
          <Judul teks="Delapan mata rantai: setiap learning need tertelusur ke strategi" sorot={["tertelusur"]} />
          <div className="pz-rantai">
            <div className="pz-kurung dsmk a" style={d(700)}><span>Diisi DSMK</span></div>
            <div className="pz-kurung sme a" style={d(900)}><span>Diisi SDM &amp; SME KINRA</span></div>
            <svg className="pz-rantai-garis" viewBox="0 0 1640 40" preserveAspectRatio="none" aria-hidden="true">
              <path id="jalur-rantai" d="M 100 20 L 1540 20" className="garis-dasar" />
              <path d="M 100 20 L 1540 20" className="garis-gambar" />
              <circle r="9" className="kilat">
                <animateMotion dur="3.2s" repeatCount="indefinite" begin="1.8s"><mpath href="#jalur-rantai" /></animateMotion>
              </circle>
            </svg>
            {RANTAI.map((r, i) => (
              <div key={r.nama} className={cx("pz-mata a a-zoom", i < 3 ? "dsmk" : "sme")} style={d(800 + i * 150)}>
                <div className="pz-mata-bulat"><span>{i + 1}</span></div>
                <div className="pz-mata-nama">{r.nama}</div>
                <div className="pz-mata-tanya">{r.tanya}</div>
              </div>
            ))}
          </div>
          <div className="pz-aturan">
            {[
              "Satu baris = satu learning need",
              "Gap bersebab non-kompetensi ditandai “non-pelatihan”",
              "Key Position memakai nomenklatur resmi KINRA",
              "Kompetensi divalidasi SME",
            ].map((t, i) => (
              <div key={t} className="a a-naik" style={d(2200 + i * 120)}><Check size={18} aria-hidden="true" /> {t}</div>
            ))}
          </div>
        </div>
      ),
    },

    /* 5. Saringan template */
    {
      judul: "Dari template ke realitas KINRA",
      catatan: `Template PTPN Group memuat ${s.capability} capability yang banyak bernuansa perkebunan. Kita tidak memaksakannya: ${s.tidakRelevan.length} capability ditandai tidak relevan untuk bisnis kawasan industri. Dari ${s.relevan} capability relevan lahir ${s.ln} learning needs; ${s.capMultiLn} capability melahirkan lebih dari satu kebutuhan.`,
      isi: (aktif) => (
        <div className="pz-isi">
          <Eyebrow>Penyaringan</Eyebrow>
          <Judul teks="Template PTPN Group, disaring untuk realitas kawasan industri" sorot={["disaring"]} />
          <div className="pz-saring">
            <div className="pz-titik-grid" aria-label={`${s.capability} capability, ${s.tidakRelevan.length} tidak relevan`}>
              {s.capIds.map((rel, i) => (
                <span key={i} className={cx("titik", !rel && "gugur")} style={d(300 + i * 14, { "--g": `${1900 + (i % 12) * 40}ms` } as React.CSSProperties)} />
              ))}
            </div>
            <div className="pz-alir">
              <div className="pz-alir-baris a a-kiri" style={d(600)}>
                <b><Hitung n={s.capability} aktif={aktif} tunda={600} /></b>
                <span>capability dalam template PTPN Group<small>5 strategi Go · {s.inisiatif} strategic initiative</small></span>
              </div>
              <div className="pz-alir-baris buang a a-kiri" style={d(1900)}>
                <b>−<Hitung n={s.tidakRelevan.length} aktif={aktif} tunda={1900} /></b>
                <span>tidak relevan untuk KINRA
                  <span className="pz-chip-buang">
                    {contohTidakRelevan.map((t, i) => <em key={t} style={d(2200 + i * 90)} className="a">{t}</em>)}
                    {s.tidakRelevan.length > contohTidakRelevan.length && <em className="a lagi" style={d(2200 + contohTidakRelevan.length * 90)}>+{s.tidakRelevan.length - contohTidakRelevan.length} lainnya</em>}
                  </span>
                </span>
              </div>
              <div className="pz-alir-baris inti a a-kiri" style={d(3000)}>
                <b><Hitung n={s.relevan} aktif={aktif} tunda={3000} /></b>
                <span>capability relevan, dianalisis bersama SME</span>
              </div>
              <div className="pz-alir-baris hasil a a-kiri" style={d(3500)}>
                <b><Hitung n={s.ln} aktif={aktif} tunda={3500} /></b>
                <span>learning needs teridentifikasi<small>{s.capMultiLn} capability melahirkan lebih dari satu kebutuhan</small></span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    /* 6. Strategi Go */
    {
      judul: "Lima strategi Go",
      catatan: `${top.pendek} menyumbang ${top.ln} dari ${s.ln} learning needs (${persenTop}%). Jelaskan mengapa: efisiensi, struktur organisasi, SOP, dan tata kelola adalah pekerjaan rumah terbesar KINRA saat ini.`,
      isi: (aktif) => (
        <div className="pz-isi">
          <Eyebrow>Sebaran per business strategy</Eyebrow>
          <Judul teks={`Lima strategi Go, ${s.ln} learning needs`} sorot={["Go,"]} />
          <div className="pz-go">
            {s.strategi.map((g, i) => {
              const w = warnaGo(g.pendek, i);
              return (
                <div key={g.nama} className={cx("pz-go-kol a a-naik", g === top && "puncak")} style={d(600 + i * 160, { "--w": w } as React.CSSProperties)}>
                  <div className="pz-go-batang">
                    <div className="pz-go-isi" style={d(900 + i * 160, { "--h": `${(g.ln / maxLn) * 100}%` } as React.CSSProperties)} />
                    <div className="pz-go-angka" style={d(900 + i * 160, { "--h": `${(g.ln / maxLn) * 100}%` } as React.CSSProperties)}>
                      <b><Hitung n={g.ln} aktif={aktif} tunda={900 + i * 160} /></b>
                      <span>learning needs</span>
                    </div>
                  </div>
                  <div className="pz-go-nama">{g.pendek}</div>
                  <div className="pz-go-tema">{g.tema}</div>
                  <div className="pz-go-meta">{g.relevan} dari {g.capability} capability relevan</div>
                </div>
              );
            })}
          </div>
          <div className="pz-sorotan a" style={d(2000)}>
            <b>{persenTop}%</b> kebutuhan berada di <b>{top.pendek}</b> ({top.tema}).
          </div>
        </div>
      ),
    },

    /* 7. RJPP */
    {
      judul: "Keterkaitan ke RJPP",
      catatan: `Setiap capability ditautkan ke prioritas RJPP KINRA 2026–2030. ${s.rjpp.length - rjppNol.length} dari ${s.rjpp.length} prioritas sudah didukung. ${rjppNol.length ? `Yang belum didukung: ${rjppNol.map((r) => r.nama).join(", ")}. Ini bahan diskusi: apakah perlu capability tambahan?` : "Semua prioritas sudah didukung."}`,
      isi: (aktif) => (
        <div className="pz-isi">
          <Eyebrow>Keselarasan dengan RJPP KINRA 2026–2030</Eyebrow>
          <Judul teks="Prioritas bisnis mana yang didukung L&D?" sorot={["didukung"]} />
          <div className="pz-rjpp">
            <div className="pz-rjpp-grid">
              {grupRjpp.map((g, gi) => (
                <div key={g.judul} className="pz-rjpp-grup">
                  <div className="pz-rjpp-pilar a a-kiri" style={d(500 + gi * 120)}>{g.judul}</div>
                  <div className="pz-rjpp-ubin">
                    {g.isi.map((r, ri) => (
                      <div key={r.kode} className={cx("ubin a a-balik", r.n === 0 && "kosong")} style={d(700 + gi * 120 + ri * 70, { "--k": `${Math.round((r.n / maxRjpp) * 100)}%` } as React.CSSProperties)}
                        title={`${r.kode} ${r.nama}: ${r.n} capability`}>
                        <span className="kode">{r.kode}</span>
                        <span className="nama">{r.nama}</span>
                        <b className="n">{r.n === 0 ? "belum" : r.n}</b>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <aside className="pz-rjpp-ringkas">
              <div className="a a-zoom" style={d(1600)}>
                <b className="raksasa"><Hitung n={s.rjpp.length - rjppNol.length} aktif={aktif} tunda={1600} /></b>
                <span>dari {s.rjpp.length} prioritas RJPP sudah didukung capability</span>
              </div>
              {rjppNol.length > 0 && (
                <div className="pz-perhatian a" style={d(2100)}>
                  <h4>Belum didukung</h4>
                  {rjppNol.map((r) => <p key={r.kode}><span>{r.kode}</span>{r.nama}</p>)}
                </div>
              )}
              {rjppTipis.length > 0 && (
                <div className="pz-perhatian tipis a" style={d(2400)}>
                  <h4>Baru 1 capability</h4>
                  {rjppTipis.map((r) => <p key={r.kode}><span>{r.kode}</span>{r.nama}</p>)}
                </div>
              )}
            </aside>
          </div>
        </div>
      ),
    },

    /* 8. Key position */
    {
      judul: "Key position",
      catatan: `${s.jabatanTerlibat} jabatan dari ${s.jabatanTotal} nomenklatur BOD-1 sampai BOD-4 menjadi target populasi. Satu learning need bisa menyasar beberapa jabatan. Sebut jabatan yang paling sering muncul dan maknanya bagi beban belajar mereka.`,
      isi: (aktif) => (
        <div className="pz-isi">
          <Eyebrow>Target populasi</Eyebrow>
          <Judul teks="Siapa yang paling menentukan keberhasilan?" sorot={["menentukan"]} />
          <div className="pz-posisi">
            <div className="pz-posisi-kiri">
              <div className="pz-cincin-besar a a-zoom" style={d(500)}>
                <svg viewBox="0 0 200 200" aria-hidden="true">
                  <circle cx="100" cy="100" r="88" className="jalur" />
                  <circle cx="100" cy="100" r="88" className="isi" pathLength={100}
                    style={{ "--p": `${s.jabatanTotal ? (s.jabatanTerlibat / s.jabatanTotal) * 100 : 0}`, "--d": "700ms" } as React.CSSProperties} />
                </svg>
                <div><b><Hitung n={s.jabatanTerlibat} aktif={aktif} tunda={700} /></b><span>dari {s.jabatanTotal} jabatan</span></div>
              </div>
              <div className="pz-level">
                {s.level.map((l, i) => (
                  <div key={l.level} className="a a-kiri" style={d(1200 + i * 120)}>
                    <span className="lv">{l.level}</span>
                    <span className="trek"><i style={d(1300 + i * 120, { "--p": `${l.total ? (l.terlibat / l.total) * 100 : 0}%` } as React.CSSProperties)} /></span>
                    <span className="nn tnum">{l.terlibat}/{l.total}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pz-posisi-kanan">
              <h3 className="a" style={d(900)}>Paling sering menjadi target learning need</h3>
              {s.topJabatan.map((j, i) => (
                <div key={j.nama} className="pz-jab a a-kiri" style={d(1100 + i * 110)}>
                  <span className="pz-jab-nama">{j.nama}</span>
                  <span className="pz-jab-trek"><i style={d(1300 + i * 110, { "--p": `${(j.n / maxJab) * 100}%` } as React.CSSProperties)} /></span>
                  <b className="tnum">{j.n}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    /* 9. Kompetensi */
    {
      judul: "Kompetensi",
      catatan: `DSMK memetakan usulan kompetensi dari kamus 756 kompetensi PTPN Group. SDM & SME KINRA mengganti ${s.kompetensiDiganti} di antaranya dan mengusulkan ${s.kompetensiUsulan} kompetensi baru. Validasi SME baru ${s.divalidasi} dari ${s.ln}: ini agenda yang harus dituntaskan sebelum Tahap 4.`,
      isi: (aktif) => {
        const seg = [
          { k: "Kuat", n: s.kekuatan.kuat, c: "#eef6f6" },
          { k: "Sedang", n: s.kekuatan.sedang, c: "#fcaf17" },
          { k: "Lemah", n: s.kekuatan.lemah, c: "#f15a22" },
        ];
        let acc = 0;
        return (
          <div className="pz-isi">
            <Eyebrow>Competency</Eyebrow>
            <Judul teks="Usulan DSMK diuji oleh mereka yang paling paham pekerjaannya" sorot={["diuji"]} />
            <div className="pz-komp">
              <div className="pz-komp-donat a a-zoom" style={d(500)}>
                <svg viewBox="0 0 220 220" aria-hidden="true">
                  {seg.map((x, i) => {
                    const p = (x.n / totalKekuatan) * 100;
                    const el = (
                      <circle key={x.k} cx="110" cy="110" r="90" pathLength={100} className="seg"
                        style={{ stroke: x.c, "--p": `${Math.max(0, p - 0.8)}`, "--o": `${-acc}`, "--d": `${800 + i * 350}ms` } as React.CSSProperties} />
                    );
                    acc += p;
                    return el;
                  })}
                </svg>
                <div className="pusat"><b><Hitung n={s.relevan} aktif={aktif} tunda={600} /></b><span>usulan DSMK</span><small>per capability relevan</small></div>
                <ul className="pz-legenda">
                  {seg.map((x, i) => <li key={x.k} className="a" style={d(1200 + i * 200)}><i style={{ background: x.c }} />Rekomendasi {x.k.toLowerCase()} <b>{x.n}</b></li>)}
                </ul>
              </div>
              <div className="pz-komp-tengah">
                <h3 className="a" style={d(1100)}>Dari {s.ln} learning needs</h3>
                {[
                  { n: s.kompetensiSama, l: "dipertahankan sesuai usulan DSMK" },
                  { n: s.kompetensiDiganti, l: "diganti SDM & SME dengan kompetensi yang lebih tepat" },
                  { n: s.kompetensiUsulan, l: "usulan kompetensi baru di luar kamus" },
                ].map((x, i) => (
                  <div key={x.l} className="pz-angka-baris a a-kiri" style={d(1300 + i * 200)}>
                    <b><Hitung n={x.n} aktif={aktif} tunda={1300 + i * 200} /></b><span>{x.l}</span>
                  </div>
                ))}
              </div>
              <div className={cx("pz-validasi a a-zoom", persenValidasi < 100 && "menunggu")} style={d(2000)}>
                <div className="pz-validasi-cincin">
                  <svg viewBox="0 0 200 200" aria-hidden="true">
                    <circle cx="100" cy="100" r="84" className="jalur" />
                    {persenValidasi > 0 && <circle cx="100" cy="100" r="84" className="isi" pathLength={100} style={{ "--p": `${persenValidasi}`, "--d": "2300ms" } as React.CSSProperties} />}
                  </svg>
                  <div><b><Hitung n={persenValidasi} aktif={aktif} tunda={2300} />%</b><span>divalidasi SME</span></div>
                </div>
                <h4>{sisaValidasi > 0 ? "Langkah berikutnya" : "Tuntas"}</h4>
                <p>{sisaValidasi > 0 ? <>SME memvalidasi <b>{sisaValidasi}</b> kompetensi yang tersisa, sesuai checklist Pedoman Pengisian.</> : "Semua kompetensi sudah divalidasi SME."}</p>
              </div>
            </div>
          </div>
        );
      },
    },

    /* 10. Non-pelatihan */
    {
      judul: "Tidak semua gap = pelatihan",
      catatan: "Disiplin penting: gap yang disebabkan sistem, data, atau kebijakan tidak dijawab dengan pelatihan. Bacakan tiga intervensi non-pelatihan ini sebagai contoh kejujuran analisis.",
      isi: (aktif) => (
        <div className="pz-isi">
          <Eyebrow>Gap competency</Eyebrow>
          <Judul teks="Tidak semua gap dijawab dengan pelatihan" sorot={["Tidak"]} />
          <div className="pz-belah a" style={d(600)}>
            <div className="kiri" style={d(800, { "--p": `${s.ln ? (s.pelatihan / s.ln) * 100 : 0}%` } as React.CSSProperties)}>
              <b><Hitung n={s.pelatihan} aktif={aktif} tunda={800} /></b><span>learning need pelatihan<small>gap karena pengetahuan, keterampilan, atau sikap</small></span>
            </div>
            <div className="kanan">
              <b><Hitung n={s.nonPelatihan.length} aktif={aktif} tunda={1200} /></b><span>non-pelatihan<small>sistem, data, kebijakan</small></span>
            </div>
          </div>
          <div className="pz-np">
            {s.nonPelatihan.length === 0 && <p className="a" style={d(1400)}>Belum ada gap yang ditandai non-pelatihan.</p>}
            {s.nonPelatihan.slice(0, 3).map((x, i) => (
              <div key={i} className="pz-np-kartu a a-angkat" style={d(1500 + i * 220)}>
                <div className="tag">Non-pelatihan</div>
                <h4>{x.capability}</h4>
                <p>{x.intervensi}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* 11. Contoh baris */
    {
      judul: "Satu baris, tertelusur penuh",
      catatan: "Bacakan satu baris nyata dari matriks, dari atas ke bawah. Tunjukkan bahwa learning need ini lahir dari strategi, bukan dari daftar keinginan pelatihan.",
      isi: () => {
        const c = s.contoh;
        if (!c) return <div className="pz-isi"><Judul teks="Belum ada baris lengkap untuk dicontohkan" /></div>;
        const kanan = [
          { k: "Key Position", v: c.posisi.join(" · ") },
          { k: "Competency", v: c.kompetensi },
          { k: "Expected Role", v: c.expected },
          { k: "Gap", v: c.gap },
        ];
        return (
          <div className="pz-isi">
            <Eyebrow>Contoh nyata dari matriks</Eyebrow>
            <Judul teks="Satu baris, ditelusuri dari strategi sampai learning need" sorot={["ditelusuri"]} />
            <div className="pz-telusur">
              <div className="pz-telusur-konteks">
                {[
                  { k: "Business Strategy", v: c.strategi },
                  { k: "Strategic Initiative", v: c.inisiatif.join(" · ") },
                  { k: "Required Capability", v: c.capability, extra: c.rjpp.length ? `RJPP: ${c.rjpp.join("; ")}` : undefined },
                ].map((x, i) => (
                  <div key={x.k} className="pz-simpul dsmk a a-kiri" style={d(600 + i * 300)}>
                    <span className="k">{i + 1} · {x.k}</span>
                    <span className="v">{x.v}</span>
                    {x.extra && <span className="x">{x.extra}</span>}
                  </div>
                ))}
              </div>
              <svg className="pz-telusur-panah" viewBox="0 0 80 400" preserveAspectRatio="none" aria-hidden="true">
                <path d="M 0 200 C 40 200 40 60 80 60" /><path d="M 0 200 C 40 200 40 340 80 340" />
              </svg>
              <div className="pz-telusur-analisis">
                {kanan.map((x, i) => (
                  <div key={x.k} className="pz-simpul sme a a-kiri" style={d(1500 + i * 300)}>
                    <span className="k">{i + 4} · {x.k}</span>
                    <span className="v">{x.v}</span>
                  </div>
                ))}
                <div className="pz-simpul hasil a a-zoom" style={d(2800)}>
                  <span className="k">8 · Learning Need</span>
                  <span className="v">{c.ln}</span>
                </div>
              </div>
            </div>
          </div>
        );
      },
    },

    /* 12. Langkah berikutnya */
    {
      judul: "Langkah berikutnya",
      catatan: "Tutup dengan ajakan: tuntaskan validasi SME, lalu bawa daftar ini ke Workshop Learning Priority 11 November. Di sana setiap kebutuhan dinilai dengan Strategic Relevance, Criticality, dan Urgency.",
      isi: (aktif) => (
        <div className="pz-isi">
          <Eyebrow>Tahap 4 · 9–13 November 2026</Eyebrow>
          <Judul teks="Dari learning needs menuju annual learning priorities" sorot={["priorities"]} />
          <div className="pz-tiga">
            {[
              { no: "01", j: "Consolidate", t: "Gabungkan learning needs holding dan seluruh entitas, samakan istilah, hapus duplikasi." },
              { no: "02", j: "Cluster", t: "Kelompokkan berdasarkan capability, target population, dan strategic priority." },
              { no: "03", j: "Prioritize", t: "Tetapkan annual priorities dengan tiga kriteria." },
            ].map((x, i) => (
              <div key={x.j} className="pz-langkah a a-angkat" style={d(600 + i * 220)}>
                <span className="no">{x.no}</span><h3>{x.j}</h3><p>{x.t}</p>
                {i < 2 && <ArrowRight className="panah" aria-hidden="true" />}
              </div>
            ))}
          </div>
          <div className="pz-rku">
            {[
              { h: "R", j: "Strategic relevance", t: "seberapa langsung mendukung strategi" },
              { h: "K", j: "Criticality", t: "dampak bila kapabilitas tak terbangun" },
              { h: "U", j: "Urgency", t: "seberapa cepat harus tersedia" },
            ].map((x, i) => (
              <div key={x.h} className="pz-orb a a-zoom" style={d(1500 + i * 200)}>
                <b>{x.h}</b><span>{x.j}</span><small>{x.t}</small>
              </div>
            ))}
            <div className="pz-cek a a-kiri" style={d(2300)}>
              <h4>Sebelum Tahap 4</h4>
              <p><span className={cx("bul", s.divalidasi === s.ln && "ok")} /> Validasi SME <b className="tnum"><Hitung n={s.divalidasi} aktif={aktif} tunda={2300} />/{s.ln}</b></p>
              <p><span className={cx("bul", s.lengkap === s.ln && "ok")} /> Baris lengkap sesuai checklist <b className="tnum"><Hitung n={s.lengkap} aktif={aktif} tunda={2400} />/{s.ln}</b></p>
              <p><span className="bul" /> Workshop Learning Priority <b>Rabu, 11 Nov</b></p>
            </div>
          </div>
        </div>
      ),
    },

    /* 13. Penutup */
    {
      judul: "Terima kasih",
      kelas: "sampul",
      catatan: "Terima kasih. Buka sesi diskusi. Aplikasi bisa langsung dibuka untuk menunjukkan baris tertentu bila ada pertanyaan.",
      isi: (aktif) => (
        <>
          <Motif />
          <div className="pz-sampul penutup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pz-logo a a-zoom" style={d(0)} src="/brand/kinra-logo-putih.png" alt="KINRA" />
            <Judul besar teks="Terima kasih" tunda={300} sorot={["kasih"]} />
            <div className="pz-rumus a" style={d(1000)}>
              <span><b><Hitung n={s.capability} aktif={aktif} tunda={1000} /></b> capability</span><ArrowRight aria-hidden="true" />
              <span><b><Hitung n={s.relevan} aktif={aktif} tunda={1300} /></b> relevan</span><ArrowRight aria-hidden="true" />
              <span className="akhir"><b><Hitung n={s.ln} aktif={aktif} tunda={1600} /></b> learning needs</span>
            </div>
            <p className="pz-lead a" style={d(1900)}>Mari tuntaskan validasi dan lanjutkan ke penyusunan learning priorities.</p>
            <div className="pz-kaki a" style={d(2200)}>Data langsung dari aplikasi LNA KINRA · per {s.dataPer} WIB</div>
          </div>
        </>
      ),
    },
  ];
}

/* ---------- Deck ---------- */

export function Deck({ stat }: { stat: Statistik }) {
  const [slides] = useState(() => buatSlide(stat));
  const [i, setI] = useState(0);
  const [keluar, setKeluar] = useState<number | null>(null);
  const [arah, setArah] = useState<"maju" | "mundur">("maju");
  const [skala, setSkala] = useState(1);
  const [catatan, setCatatan] = useState(false);
  const [ikhtisar, setIkhtisar] = useState(false);
  const [penuh, setPenuh] = useState(false);
  const [diam, setDiam] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tKeluar = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tDiam = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const n = slides.length;

  const iRef = useRef(0);
  const ke = useCallback((tujuan: number) => {
    const lama = iRef.current;
    const baru = Math.max(0, Math.min(n - 1, tujuan));
    if (baru === lama) return;
    iRef.current = baru;
    setArah(baru > lama ? "maju" : "mundur");
    setKeluar(lama);
    setI(baru);
    clearTimeout(tKeluar.current);
    tKeluar.current = setTimeout(() => setKeluar(null), 900);
  }, [n]);

  // Slide awal dari hash (#3), lalu sinkronkan hash
  useEffect(() => {
    const h = parseInt(window.location.hash.slice(1), 10);
    if (h >= 1 && h <= n) { iRef.current = h - 1; setI(h - 1); }
  }, [n]);
  useEffect(() => { window.history.replaceState(null, "", `#${i + 1}`); }, [i]);

  // Skala panggung 1920×1080 agar tampilan sama di proyektor mana pun
  useEffect(() => {
    const f = () => setSkala(Math.min(window.innerWidth / W, window.innerHeight / H));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    const f = () => setPenuh(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  const togglePenuh = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (["ArrowRight", "PageDown", " ", "Enter", "ArrowDown"].includes(k)) { e.preventDefault(); ke(i + 1); }
      else if (["ArrowLeft", "PageUp", "Backspace", "ArrowUp"].includes(k)) { e.preventDefault(); ke(i - 1); }
      else if (k === "Home") ke(0);
      else if (k === "End") ke(n - 1);
      else if (k === "f" || k === "F") togglePenuh();
      else if (k === "n" || k === "N") setCatatan((v) => !v);
      else if (k === "g" || k === "G" || k === "o" || k === "O") setIkhtisar((v) => !v);
      else if (k === "Escape") { setIkhtisar(false); setCatatan(false); }
      else if (/^[1-9]$/.test(k)) ke(Number(k) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, n, ke, togglePenuh]);

  // Kontrol memudar saat mouse diam; parallax halus mengikuti kursor
  const onMove = (e: React.MouseEvent) => {
    setDiam(false);
    clearTimeout(tDiam.current);
    tDiam.current = setTimeout(() => setDiam(true), 2200);
    const r = rootRef.current;
    if (r) {
      r.style.setProperty("--mx", `${(e.clientX / window.innerWidth - 0.5).toFixed(3)}`);
      r.style.setProperty("--my", `${(e.clientY / window.innerHeight - 0.5).toFixed(3)}`);
    }
  };
  useEffect(() => { tDiam.current = setTimeout(() => setDiam(true), 2500); return () => clearTimeout(tDiam.current); }, []);

  // Geser di layar sentuh
  const sentuh = useRef<number | null>(null);

  return (
    <div
      ref={rootRef}
      className={cx("pz-root", diam && "diam")}
      data-arah={arah}
      onMouseMove={onMove}
      onTouchStart={(e) => { sentuh.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (sentuh.current == null) return;
        const dx = e.changedTouches[0].clientX - sentuh.current;
        if (Math.abs(dx) > 50) ke(i + (dx < 0 ? 1 : -1));
        sentuh.current = null;
      }}
    >
      <div className="pz-aurora" aria-hidden="true"><span /><span /><span /></div>
      <Medan denyut={i} />
      <div className="pz-progres" aria-hidden="true"><i style={{ width: `${((i + 1) / n) * 100}%` }} /></div>

      <div className="pz-panggung" style={{ transform: `translate(-50%, -50%) scale(${skala})` }}>
        {slides.map((sl, k) => (
          <section
            key={k}
            className={cx("pz-slide", sl.kelas, k === i && "aktif", k === keluar && "keluar")}
            aria-hidden={k !== i}
            aria-roledescription="slide"
            aria-label={`${k + 1} dari ${n}: ${sl.judul}`}
          >
            {(k === i || k === keluar) && sl.isi(k === i)}
            {!sl.kelas && (
              <div className="pz-kepala">
                <span>ALNA 2027 · PT KINRA</span>
                <span className="tnum">{String(k + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="pz-kontrol" role="toolbar" aria-label="Kontrol presentasi">
        <Link href="/" className="pz-tbl" aria-label="Keluar dari presentasi" title="Keluar"><X size={18} aria-hidden="true" /></Link>
        <span className="pz-sep" />
        <button className="pz-tbl" onClick={() => ke(i - 1)} disabled={i === 0} aria-label="Slide sebelumnya" title="Sebelumnya (←)"><ArrowLeft size={18} aria-hidden="true" /></button>
        <span className="pz-nomor tnum" aria-live="polite">{i + 1} / {n} · {slides[i].judul}</span>
        <button className="pz-tbl" onClick={() => ke(i + 1)} disabled={i === n - 1} aria-label="Slide berikutnya" title="Berikutnya (→ / spasi)"><ArrowRight size={18} aria-hidden="true" /></button>
        <span className="pz-sep" />
        <button className="pz-tbl" onClick={() => setCatatan((v) => !v)} aria-pressed={catatan} aria-label="Catatan pembicara" title="Catatan pembicara (N)"><StickyNote size={18} aria-hidden="true" /></button>
        <button className="pz-tbl" onClick={() => setIkhtisar((v) => !v)} aria-pressed={ikhtisar} aria-label="Ikhtisar slide" title="Ikhtisar slide (G)"><LayoutGrid size={18} aria-hidden="true" /></button>
        <button className="pz-tbl" onClick={togglePenuh} aria-label={penuh ? "Keluar layar penuh" : "Layar penuh"} title="Layar penuh (F)">
          {penuh ? <Minimize size={18} aria-hidden="true" /> : <Maximize size={18} aria-hidden="true" />}
        </button>
      </div>

      {catatan && (
        <div className="pz-catatan" role="note">
          <div className="pz-catatan-kepala"><Compass size={15} aria-hidden="true" /> Catatan pembicara · slide {i + 1}</div>
          <p>{slides[i].catatan}</p>
          {i < n - 1 && <div className="pz-catatan-lanjut">Berikutnya: {slides[i + 1].judul}</div>}
        </div>
      )}

      {ikhtisar && (
        <div className="pz-ikhtisar" role="dialog" aria-label="Ikhtisar slide" onClick={() => setIkhtisar(false)}>
          <div className="pz-ikhtisar-grid" onClick={(e) => e.stopPropagation()}>
            {slides.map((sl, k) => (
              <button key={k} className={cx("pz-ikhtisar-item", k === i && "kini")} style={d(k * 30)} onClick={() => { ke(k); setIkhtisar(false); }}>
                <span className="no tnum">{String(k + 1).padStart(2, "0")}</span>
                <span>{sl.judul}</span>
              </button>
            ))}
          </div>
          <p className="pz-pintasan">← → spasi PageUp/PageDown: pindah slide · F layar penuh · N catatan · G ikhtisar · 1–9 lompat · Esc tutup</p>
        </div>
      )}
    </div>
  );
}
