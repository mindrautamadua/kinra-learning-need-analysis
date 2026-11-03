import type { Capability, Jabatan, Kekuatan, LearningNeed, Metode } from "./types";

export const KEKUATAN_LABEL: Record<Kekuatan, string> = {
  kuat: "Rekomendasi kuat",
  sedang: "Rekomendasi sedang",
  lemah: "Rekomendasi lemah",
};

/** Singkatan strategi untuk label ringkas: "Go Lean – Operational Excellence" → "Go Lean" */
export const strategiPendek = (s: string) => s.split("–")[0].trim();

export type Status = "tidak_relevan" | "belum" | "sebagian" | "lengkap";
export const STATUS_LABEL: Record<Status, string> = {
  tidak_relevan: "Tidak relevan",
  belum: "Belum diisi",
  sebagian: "Sebagian",
  lengkap: "Lengkap",
};

/** Kolom penilaian bisa belum ada bila migrasi 20261103000004 belum dijalankan: isi nilai kosong. */
export function normalLN(r: LearningNeed): LearningNeed {
  return {
    ...r,
    jumlah_peserta: r.jumlah_peserta ?? null,
    level_dibutuhkan: r.level_dibutuhkan ?? null,
    level_saat_ini: r.level_saat_ini ?? null,
    skor_relevansi: r.skor_relevansi ?? null,
    skor_kritikalitas: r.skor_kritikalitas ?? null,
    skor_urgensi: r.skor_urgensi ?? null,
    metode: r.metode ?? [],
    target_tw: r.target_tw ?? null,
    pic: r.pic ?? null,
  };
}

const ada = (v: string | null | undefined) => !!v && v.trim().length > 0;

export type CekItem = { key: string; label: string; ok: boolean };

/** Checklist kualitas per baris: bagian E Pedoman Pengisian + keterkaitan ke prioritas RJPP KINRA. */
export function checklist(ln: LearningNeed, cap?: Pick<Capability, "prioritas_rjpp">): CekItem[] {
  const nonKomp = ln.sebab_gap === "non_kompetensi";
  return [
    { key: "rjpp", label: "Capability ditautkan ke prioritas RJPP KINRA", ok: (cap?.prioritas_rjpp.length ?? 0) > 0 },
    { key: "posisi", label: "Key Position memakai nomenklatur KINRA", ok: ln.jabatan_ids.length > 0 },
    { key: "kompetensi", label: "Kompetensi terisi", ok: ada(ln.kompetensi) },
    { key: "validasi", label: "Kompetensi divalidasi SME", ok: ln.kompetensi_divalidasi },
    { key: "expected", label: "Expected Role berupa perilaku teramati", ok: ada(ln.expected_role) },
    { key: "gap", label: "Gap dan penyebabnya ditetapkan", ok: ada(ln.gap) && !!ln.sebab_gap },
    nonKomp
      ? { key: "ln", label: "Intervensi non-pelatihan dituliskan", ok: ada(ln.intervensi_non_pelatihan) }
      : { key: "ln", label: "Learning Need: topik + populasi + cakupan", ok: ada(ln.learning_need) },
    { key: "penilaian", label: nonKomp ? "Jumlah peserta, prioritas, target TW, dan PIC terisi" : "Jumlah peserta, level, prioritas, metode, target TW, dan PIC terisi", ok: penilaianLengkap(ln) },
  ];
}

/** Gap level kemahiran = dibutuhkan − saat ini (null bila salah satu kosong). */
export const gapLevel = (ln: Pick<LearningNeed, "level_dibutuhkan" | "level_saat_ini">) =>
  ln.level_dibutuhkan != null && ln.level_saat_ini != null ? ln.level_dibutuhkan - ln.level_saat_ini : null;

/** Skor prioritas = Relevansi × Kritikalitas × Urgensi (1–27). */
export const skorPrioritas = (ln: Pick<LearningNeed, "skor_relevansi" | "skor_kritikalitas" | "skor_urgensi">) =>
  ln.skor_relevansi != null && ln.skor_kritikalitas != null && ln.skor_urgensi != null
    ? ln.skor_relevansi * ln.skor_kritikalitas * ln.skor_urgensi
    : null;

export type KategoriPrioritas = "tinggi" | "sedang" | "rendah";
export const kategoriPrioritas = (skor: number | null): KategoriPrioritas | null =>
  skor == null ? null : skor >= 12 ? "tinggi" : skor >= 6 ? "sedang" : "rendah";
export const KATEGORI_LABEL: Record<KategoriPrioritas, string> = { tinggi: "Tinggi", sedang: "Sedang", rendah: "Rendah" };

export const METODE: { v: Metode; kode: string; label: string; ket: string }[] = [
  { v: "pengalaman", kode: "P", label: "Pengalaman kerja (70)", ket: "penugasan, proyek, rotasi, job enrichment" },
  { v: "sosial", kode: "S", label: "Sosial (20)", ket: "coaching, mentoring, community of practice" },
  { v: "formal", kode: "F", label: "Formal (10)", ket: "pelatihan kelas, e-learning, sertifikasi" },
];

/** Kelengkapan penilaian: level dan metode hanya wajib untuk gap kompetensi. */
export function penilaianLengkap(ln: LearningNeed) {
  const dasar = ln.jumlah_peserta != null && skorPrioritas(ln) != null && ln.target_tw != null && ada(ln.pic);
  if (ln.sebab_gap === "non_kompetensi") return dasar;
  return dasar && ln.level_dibutuhkan != null && ln.level_saat_ini != null && ln.metode.length > 0;
}

export function statusLN(ln: LearningNeed, cap: Capability | undefined): Status {
  if (cap?.relevan === false) return "tidak_relevan";
  const cek = checklist(ln, cap);
  const terisi =
    ln.jabatan_ids.length > 0 || ada(ln.posisi_lain) || ada(ln.expected_role) || ada(ln.gap) || ada(ln.learning_need) ||
    ada(ln.intervensi_non_pelatihan) || ln.kompetensi_divalidasi || ln.jumlah_peserta != null || ln.level_dibutuhkan != null ||
    ln.skor_relevansi != null || ln.metode.length > 0 || ln.target_tw != null || ada(ln.pic);
  if (cek.every((c) => c.ok)) return "lengkap";
  return terisi ? "sebagian" : "belum";
}

export function namaJabatan(ids: number[], jabatan: Map<number, Jabatan>) {
  return ids
    .map((id) => jabatan.get(id))
    .filter((j): j is Jabatan => !!j)
    .map((j) => `${j.nama} (${j.level})`);
}

/** Teks kolom J sesuai aturan pedoman. */
export function teksKolomJ(ln: LearningNeed) {
  if (ln.sebab_gap === "non_kompetensi") {
    return ln.intervensi_non_pelatihan?.trim() ? `non-pelatihan: ${ln.intervensi_non_pelatihan.trim()}` : "non-pelatihan";
  }
  return ln.learning_need ?? "";
}

const fmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const angka = (n: number | null | undefined) => (n == null || Number.isNaN(n) ? "–" : fmt.format(n));
export const persen = (n: number | null | undefined) => (n == null || Number.isNaN(n) ? "–" : `${fmt.format(n)}%`);
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export function waktu(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso);
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${jam}`;
}

export const JENIS_PRIORITAS_LABEL = {
  pilar_utama: "Pilar utama",
  enabler: "Fondasi (enablers)",
  inisiatif_2027: "Strategic Journey 2027",
} as const;

/** Urutan pilar RJPP untuk pengelompokan tampilan. */
export const URUT_PILAR_RJPP = ["Performance Driven", "Stability and Growth", "New Business Expansion", "Fondasi (Enablers)"];
