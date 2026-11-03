import { db } from "@/lib/supabase/server";
import { muatKamus } from "@/lib/data";
import type { Jabatan, PrioritasRjpp } from "@/lib/types";
import { ReferensiClient } from "./referensi-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kamus & Jabatan · KINRA" };

export default async function ReferensiPage() {
  const [kamus, jab, pr] = await Promise.all([muatKamus(), db().from("jabatan").select("*").order("id"), db().from("prioritas_rjpp").select("*").order("urutan")]);
  return <ReferensiClient {...kamus} jabatan={(jab.data ?? []) as Jabatan[]} prioritas={(pr.data ?? []) as PrioritasRjpp[]} />;
}
