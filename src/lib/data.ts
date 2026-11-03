import "server-only";
import { db } from "./supabase/server";
import { normalLN } from "./domain";
import type { Capability, Jabatan, KamusHard, KamusLeadership, LearningNeed, PrioritasRjpp } from "./types";

export type DataLNA = {
  capabilities: Capability[];
  learningNeeds: LearningNeed[];
  jabatan: Jabatan[];
  prioritas: PrioritasRjpp[];
  kamusHard: KamusHard[];
  kamusLeadership: KamusLeadership[];
};

function cek<T>(res: { data: T[] | null; error: { message: string } | null }, nama: string): T[] {
  if (res.error) throw new Error(`Gagal memuat ${nama}: ${res.error.message}`);
  return res.data ?? [];
}

export async function muatMatriks(): Promise<Pick<DataLNA, "capabilities" | "learningNeeds" | "jabatan" | "prioritas">> {
  const s = db();
  const [c, l, j, p] = await Promise.all([
    s.from("capabilities").select("*").order("no").range(0, 999),
    s.from("learning_needs").select("*").order("capability_id").order("urutan").range(0, 4999),
    s.from("jabatan").select("*").order("id").range(0, 999),
    s.from("prioritas_rjpp").select("*").order("urutan"),
  ]);
  return {
    capabilities: cek(c, "capabilities") as Capability[],
    learningNeeds: (cek(l, "learning needs") as LearningNeed[]).map(normalLN),
    jabatan: cek(j, "jabatan") as Jabatan[],
    prioritas: cek(p, "prioritas RJPP") as PrioritasRjpp[],
  };
}

export async function muatKamus(): Promise<Pick<DataLNA, "kamusHard" | "kamusLeadership">> {
  const s = db();
  const [h, k] = await Promise.all([
    s.from("kamus_hard").select("*").order("id").range(0, 1999),
    s.from("kamus_leadership").select("*").order("id"),
  ]);
  return { kamusHard: cek(h, "kamus hard competency") as KamusHard[], kamusLeadership: cek(k, "kamus leadership") as KamusLeadership[] };
}

export async function muatSemua(): Promise<DataLNA> {
  const [m, k] = await Promise.all([muatMatriks(), muatKamus()]);
  return { ...m, ...k };
}
