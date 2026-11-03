import { muatMatriks } from "@/lib/data";
import { checklist, strategiPendek, waktu } from "@/lib/domain";
import { Deck, type Statistik } from "./deck";
import "./presentasi.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Presentasi LNA · KINRA" };

/** Nama jabatan dipendekkan untuk layar presentasi. */
const pendek = (s: string) =>
  s.replace(/^Kepala Sub Bagian /, "Kasubag ").replace(/^Kepala Bagian /, "Kabag ").replace(/^Kepala Satuan /, "Ka. Satuan ").replace(/\s*\(([A-Z]+)\s*$/, " ($1)");

export default async function PresentasiPage() {
  const { capabilities: caps, learningNeeds: lns, jabatan, prioritas } = await muatMatriks();

  const cmap = new Map(caps.map((c) => [c.id, c]));
  const jmap = new Map(jabatan.map((j) => [j.id, j]));
  const relevan = caps.filter((c) => c.relevan !== false);
  const aktif = lns.filter((l) => cmap.get(l.capability_id)?.relevan !== false);
  const daftarStrategi = [...new Set([...caps].sort((a, b) => a.no - b.no).map((c) => c.strategi))];

  const strategi = daftarStrategi.map((s) => {
    const cs = caps.filter((c) => c.strategi === s);
    return {
      nama: s,
      pendek: strategiPendek(s),
      tema: s.split("–")[1]?.trim() ?? "",
      capability: cs.length,
      relevan: cs.filter((c) => c.relevan !== false).length,
      ln: aktif.filter((l) => cmap.get(l.capability_id)!.strategi === s).length,
      inisiatif: [...new Set(cs.flatMap((c) => c.inisiatif))],
    };
  });

  // Key position: hitung per jabatan (satu LN bisa menyasar beberapa jabatan)
  const perJabatan = new Map<number, number>();
  for (const l of aktif) for (const id of l.jabatan_ids) perJabatan.set(id, (perJabatan.get(id) ?? 0) + 1);
  const LEVEL = ["BOD-1", "BOD-2", "BOD-3", "BOD-4"];
  const level = LEVEL.map((lv) => ({
    level: lv,
    total: jabatan.filter((j) => j.level === lv).length,
    terlibat: [...perJabatan.keys()].filter((id) => jmap.get(id)?.level === lv).length,
  }));
  const topJabatan = [...perJabatan]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, n]) => ({ nama: pendek(jmap.get(id)?.nama ?? "?"), level: jmap.get(id)?.level ?? "", n }));

  const usulanSama = (l: (typeof aktif)[number]) =>
    (l.kompetensi ?? "").trim().toLowerCase() === (cmap.get(l.capability_id)!.kompetensi_usulan ?? "").trim().toLowerCase();

  // Contoh baris tertelusur: LN pertama (urut no capability) yang isian template-nya lengkap
  const contohLn = [...aktif]
    .sort((a, b) => cmap.get(a.capability_id)!.no - cmap.get(b.capability_id)!.no || a.urutan - b.urutan)
    .find((l) => l.sebab_gap === "kompetensi" && l.jabatan_ids.length > 0 && l.expected_role && l.gap && l.learning_need && l.kompetensi);
  const contohCap = contohLn ? cmap.get(contohLn.capability_id)! : undefined;

  const pmap = new Map(prioritas.map((p) => [p.kode, p]));
  const dukungRjpp = new Map<string, number>();
  for (const c of relevan) for (const k of c.prioritas_rjpp) dukungRjpp.set(k, (dukungRjpp.get(k) ?? 0) + 1);

  const terakhir = [...caps.map((c) => c.updated_at), ...lns.map((l) => l.updated_at)].sort().at(-1);

  const stat: Statistik = {
    dataPer: terakhir ? waktu(terakhir) : "-",
    capability: caps.length,
    relevan: relevan.length,
    tidakRelevan: caps.filter((c) => c.relevan === false).map((c) => c.capability),
    capIds: [...caps].sort((a, b) => a.no - b.no).map((c) => c.relevan !== false),
    ln: aktif.length,
    capMultiLn: [...new Set(aktif.map((l) => l.capability_id))].filter((id) => aktif.filter((l) => l.capability_id === id).length > 1).length,
    inisiatif: [...new Set(caps.flatMap((c) => c.inisiatif))].length,
    strategi,
    kekuatan: {
      kuat: relevan.filter((c) => c.kekuatan_usulan === "kuat").length,
      sedang: relevan.filter((c) => c.kekuatan_usulan === "sedang").length,
      lemah: relevan.filter((c) => c.kekuatan_usulan === "lemah").length,
    },
    kompetensiSama: aktif.filter((l) => l.kompetensi && usulanSama(l)).length,
    kompetensiDiganti: aktif.filter((l) => l.kompetensi && !usulanSama(l)).length,
    kompetensiUsulan: aktif.filter((l) => l.sumber_kompetensi === "usulan").length,
    divalidasi: aktif.filter((l) => l.kompetensi_divalidasi).length,
    lengkap: aktif.filter((l) => checklist(l, cmap.get(l.capability_id)).every((k) => k.ok)).length,
    pelatihan: aktif.filter((l) => l.sebab_gap !== "non_kompetensi").length,
    nonPelatihan: aktif
      .filter((l) => l.sebab_gap === "non_kompetensi")
      .map((l) => ({ capability: cmap.get(l.capability_id)!.capability, intervensi: l.intervensi_non_pelatihan ?? "" })),
    jabatanTotal: jabatan.filter((j) => j.level !== "BOD").length,
    jabatanTerlibat: perJabatan.size,
    level,
    topJabatan,
    rjpp: prioritas.map((p) => ({ kode: p.kode, nama: p.nama, pilar: p.pilar, jenis: p.jenis, n: dukungRjpp.get(p.kode) ?? 0 })),
    contoh: contohLn && contohCap
      ? {
          strategi: contohCap.strategi,
          inisiatif: contohCap.inisiatif,
          capability: contohCap.capability,
          rjpp: contohCap.prioritas_rjpp.map((k) => `${k} ${pmap.get(k)?.nama ?? ""}`.trim()),
          posisi: contohLn.jabatan_ids.map((id) => jmap.get(id)).filter(Boolean).map((j) => `${pendek(j!.nama)} (${j!.level})`),
          kompetensi: contohLn.kompetensi ?? "",
          expected: contohLn.expected_role ?? "",
          gap: contohLn.gap ?? "",
          ln: contohLn.learning_need ?? "",
        }
      : null,
  };

  return <Deck stat={stat} />;
}
