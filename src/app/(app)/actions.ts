"use server";

import { revalidatePath } from "next/cache";
import { db, wajibLogin } from "@/lib/supabase/server";
import type { LearningNeed } from "@/lib/types";
import { normalLN } from "@/lib/domain";

const KOLOM_LN = [
  "jabatan_ids", "posisi_lain", "kompetensi", "sumber_kompetensi", "kompetensi_divalidasi", "expected_role",
  "gap", "sebab_gap", "intervensi_non_pelatihan", "learning_need", "catatan", "diubah_oleh",
  "jumlah_peserta", "level_dibutuhkan", "level_saat_ini", "skor_relevansi", "skor_kritikalitas", "skor_urgensi",
  "metode", "target_tw", "pic",
] as const;
const RENTANG: Partial<Record<(typeof KOLOM_LN)[number], [number, number]>> = {
  jumlah_peserta: [0, 100000], level_dibutuhkan: [1, 5], level_saat_ini: [1, 5],
  skor_relevansi: [1, 3], skor_kritikalitas: [1, 3], skor_urgensi: [1, 3], target_tw: [1, 4],
};
const bulat = (v: unknown, [min, max]: [number, number]) => (typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null);
export type PatchLN = Partial<Pick<LearningNeed, (typeof KOLOM_LN)[number]>>;

const teks = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? null : v.slice(0, 4000)) : null);

function bersihkan(patch: PatchLN) {
  const out: Record<string, unknown> = {};
  for (const k of KOLOM_LN) {
    if (!(k in patch)) continue;
    const v = patch[k];
    if (k === "jabatan_ids") out[k] = Array.isArray(v) ? v.filter((n) => Number.isInteger(n)) : [];
    else if (k === "kompetensi_divalidasi") out[k] = v === true;
    else if (k === "sumber_kompetensi") out[k] = v === "hard" || v === "leadership" || v === "usulan" ? v : null;
    else if (k === "sebab_gap") out[k] = v === "kompetensi" || v === "non_kompetensi" ? v : null;
    else if (RENTANG[k]) out[k] = bulat(v, RENTANG[k]!);
    else if (k === "metode") out[k] = Array.isArray(v) ? [...new Set(v as unknown[])].filter((m) => m === "pengalaman" || m === "sosial" || m === "formal") : [];
    else out[k] = teks(v);
  }
  return out;
}

function selesai() {
  revalidatePath("/", "layout");
}

export async function simpanLearningNeed(id: string, patch: PatchLN): Promise<LearningNeed> {
  await wajibLogin();
  const { data, error } = await db().from("learning_needs").update(bersihkan(patch)).eq("id", id).select("*").single();
  if (error) throw new Error(`Gagal menyimpan: ${error.message}`);
  selesai();
  return normalLN(data as LearningNeed);
}

/** Tambah baris learning need baru di bawah capability yang sama (kolom kiri diulang). */
export async function tambahLearningNeed(capabilityId: number, salinDariId?: string, oleh?: string): Promise<LearningNeed> {
  await wajibLogin();
  const s = db();
  const { data: ada, error: e1 } = await s.from("learning_needs").select("*").eq("capability_id", capabilityId).order("urutan");
  if (e1) throw new Error(e1.message);
  const rows = (ada ?? []) as LearningNeed[];
  const sumber = rows.find((r) => r.id === salinDariId);
  const { data: cap } = await s.from("capabilities").select("kompetensi_usulan").eq("id", capabilityId).single();
  const baru = {
    capability_id: capabilityId,
    urutan: Math.max(0, ...rows.map((r) => r.urutan)) + 1,
    jabatan_ids: sumber?.jabatan_ids ?? [],
    kompetensi: sumber?.kompetensi ?? (cap as { kompetensi_usulan: string | null } | null)?.kompetensi_usulan ?? null,
    sumber_kompetensi: sumber?.sumber_kompetensi ?? "hard",
    diubah_oleh: teks(oleh),
  };
  const { data, error } = await s.from("learning_needs").insert(baru).select("*").single();
  if (error) throw new Error(`Gagal menambah baris: ${error.message}`);
  selesai();
  return normalLN(data as LearningNeed);
}

export async function hapusLearningNeed(id: string) {
  await wajibLogin();
  const s = db();
  const { data: row } = await s.from("learning_needs").select("capability_id").eq("id", id).single();
  if (!row) throw new Error("Baris tidak ditemukan.");
  const { count } = await s.from("learning_needs").select("id", { count: "exact", head: true }).eq("capability_id", (row as { capability_id: number }).capability_id);
  if ((count ?? 0) <= 1) throw new Error("Setiap capability minimal punya satu baris. Kosongkan isiannya bila tidak dipakai.");
  const { error } = await s.from("learning_needs").delete().eq("id", id);
  if (error) throw new Error(`Gagal menghapus: ${error.message}`);
  selesai();
}

/** Simpan keputusan workshop di level capability: relevansi untuk KINRA dan tautan ke prioritas RJPP. */
export async function simpanCapability(
  capabilityId: number,
  isi: { relevan: boolean | null; catatan: string | null; prioritas: string[] },
  oleh?: string,
) {
  await wajibLogin();
  const s = db();
  const { data: master, error: e1 } = await s.from("prioritas_rjpp").select("kode");
  if (e1) throw new Error(`Gagal memuat prioritas RJPP: ${e1.message}`);
  const sah = new Set((master ?? []).map((m: { kode: string }) => m.kode));
  const prioritas = [...new Set(isi.prioritas)].filter((k) => sah.has(k));
  const { error } = await s
    .from("capabilities")
    .update({
      relevan: isi.relevan === true || isi.relevan === false ? isi.relevan : null,
      catatan_relevansi: teks(isi.catatan),
      prioritas_rjpp: prioritas,
      diubah_oleh: teks(oleh),
    })
    .eq("id", capabilityId);
  if (error) throw new Error(`Gagal menyimpan capability: ${error.message}`);
  selesai();
  return prioritas;
}
