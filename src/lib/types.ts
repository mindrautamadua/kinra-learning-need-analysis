export type Kekuatan = "kuat" | "sedang" | "lemah";
export type SumberKompetensi = "hard" | "leadership" | "usulan";
export type SebabGap = "kompetensi" | "non_kompetensi";
export type Metode = "pengalaman" | "sosial" | "formal";

export type KamusHard = { id: number; area: string; job_function: string; nama: string };
export type KamusLeadership = { id: number; nama: string };
export type JenisPrioritas = "pilar_utama" | "enabler" | "inisiatif_2027";
export type PrioritasRjpp = { kode: string; pilar: string; jenis: JenisPrioritas; nama: string; uraian: string | null; urutan: number };
export type Jabatan = { id: number; kode: string | null; nama: string; level: string; direktorat: string | null; divisi: string | null };

export type Capability = {
  id: number;
  no: number;
  strategi: string;
  inisiatif: string[];
  capability: string;
  kompetensi_usulan: string | null;
  kekuatan_usulan: Kekuatan;
  relevan: boolean | null;
  catatan_relevansi: string | null;
  prioritas_rjpp: string[];
  diubah_oleh: string | null;
  updated_at: string;
};

export type LearningNeed = {
  id: string;
  capability_id: number;
  urutan: number;
  jabatan_ids: number[];
  posisi_lain: string | null;
  kompetensi: string | null;
  sumber_kompetensi: SumberKompetensi | null;
  kompetensi_divalidasi: boolean;
  expected_role: string | null;
  gap: string | null;
  sebab_gap: SebabGap | null;
  intervensi_non_pelatihan: string | null;
  learning_need: string | null;
  catatan: string | null;
  jumlah_peserta: number | null;
  level_dibutuhkan: number | null;
  level_saat_ini: number | null;
  skor_relevansi: number | null;
  skor_kritikalitas: number | null;
  skor_urgensi: number | null;
  metode: Metode[];
  target_tw: number | null;
  pic: string | null;
  diubah_oleh: string | null;
  created_at: string;
  updated_at: string;
};
