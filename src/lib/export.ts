"use client";

import { gapLevel, KATEGORI_LABEL, kategoriPrioritas, METODE, namaJabatan, skorPrioritas, statusLN, STATUS_LABEL, teksKolomJ, waktu } from "./domain";
import type { Capability, Jabatan, LearningNeed, PrioritasRjpp } from "./types";

const WARNA_G = { kuat: "FF000000", sedang: "FF9C5700", lemah: "FFC00000" } as const;

/** Ekspor ke .xlsx dengan susunan kolom B–J sama seperti Kertas Kerja Workshop 3, plus kolom bantu. */
export async function eksporExcel(caps: Capability[], lns: LearningNeed[], jabatan: Jabatan[], prioritas: PrioritasRjpp[], kecualiTidakRelevan: boolean) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "KINRA LNA 2027";
  const ws = wb.addWorksheet("Matriks Strategi-Kebutuhan", { views: [{ state: "frozen", ySplit: 3, xSplit: 0 }] });
  const jmap = new Map(jabatan.map((j) => [j.id, j]));
  const cmap = new Map(caps.map((c) => [c.id, c]));
  const pmap = new Map(prioritas.map((p) => [p.kode, p]));

  ws.columns = [
    { width: 3 }, { width: 6 }, { width: 26 }, { width: 30 }, { width: 30 }, { width: 32 }, { width: 32 },
    { width: 42 }, { width: 42 }, { width: 48 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 8 }, { width: 6 }, { width: 6 }, { width: 6 }, { width: 8 }, { width: 11 }, { width: 22 }, { width: 9 }, { width: 22 },
    { width: 40 }, { width: 12 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 20 }, { width: 20 },
  ];
  ws.mergeCells("B1:J1");
  ws.getCell("B1").value = "MATRIKS: DARI STRATEGI BISNIS KE LEARNING NEEDS · PT KAWASAN INDUSTRI NUSANTARA (KINRA)";
  ws.getCell("B1").font = { bold: true, size: 13 };
  ws.mergeCells("B2:J2");
  ws.getCell("B2").value = `Diekspor ${waktu(new Date().toISOString())} WIB dari aplikasi LNA KINRA. Warna teks kolom Competency = tingkat rekomendasi DSMK (hitam kuat, oranye sedang, merah lemah).`;
  ws.getCell("B2").font = { italic: true, size: 9, color: { argb: "FF587073" } };

  const header = [
    "", "No", "Business Strategy / Strategic Priority", "Strategic Initiative", "Required Capabilities (Business Capabilities)",
    "Key Position / Target Population", "Competency", "Expected Role / Performance", "Gap Competency", "Learning Need",
    "Jumlah peserta", "Level dibutuhkan (1–5)", "Level saat ini (1–5)", "Gap level", "R", "K", "U", "Skor R×K×U", "Kategori prioritas",
    "Metode 70:20:10", "Target TW", "PIC",
    "Prioritas RJPP KINRA", "Relevan KINRA", "Sebab Gap", "Validasi SME", "Status", "Diubah oleh", "Waktu ubah",
  ];
  const h = ws.getRow(3);
  h.values = header;
  h.height = 34;
  h.eachCell((cell, col) => {
    if (col === 1) return;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: col <= 5 ? "FF008187" : col <= 10 ? "FF32A3DC" : col <= 22 ? "FF2F5D62" : "FF4D4D4F" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  const urut = [...lns].sort((a, b) => (cmap.get(a.capability_id)?.no ?? 0) - (cmap.get(b.capability_id)?.no ?? 0) || a.urutan - b.urutan);
  let no = 0;
  for (const ln of urut) {
    const c = cmap.get(ln.capability_id);
    if (!c) continue;
    if (kecualiTidakRelevan && c.relevan === false) continue;
    no++;
    const posisi = [...namaJabatan(ln.jabatan_ids, jmap), ...(ln.posisi_lain ? [ln.posisi_lain] : [])].join("\n");
    const row = ws.addRow([
      "", no, c.strategi, c.inisiatif.map((i) => `• ${i}`).join("\n"), c.capability, posisi, ln.kompetensi ?? "",
      ln.expected_role ?? "", ln.gap ?? "", teksKolomJ(ln),
      ln.jumlah_peserta ?? "", ln.level_dibutuhkan ?? "", ln.level_saat_ini ?? "", gapLevel(ln) ?? "",
      ln.skor_relevansi ?? "", ln.skor_kritikalitas ?? "", ln.skor_urgensi ?? "", skorPrioritas(ln) ?? "",
      kategoriPrioritas(skorPrioritas(ln)) ? KATEGORI_LABEL[kategoriPrioritas(skorPrioritas(ln))!] : "",
      METODE.filter((m) => ln.metode.includes(m.v)).map((m) => m.label).join(", "), ln.target_tw ? `TW ${["I", "II", "III", "IV"][ln.target_tw - 1]}` : "", ln.pic ?? "",
      c.prioritas_rjpp.map((k) => `${k} ${pmap.get(k)?.nama ?? ""}`.trim()).join("\n"),
      c.relevan === null ? "Belum diputuskan" : c.relevan ? "Ya" : "Tidak",
      ln.sebab_gap === "kompetensi" ? "Kompetensi" : ln.sebab_gap === "non_kompetensi" ? "Non-kompetensi" : "",
      ln.kompetensi_divalidasi ? "Sudah" : "Belum", STATUS_LABEL[statusLN(ln, c)], ln.diubah_oleh ?? "", waktu(ln.updated_at),
    ]);
    row.eachCell((cell, col) => {
      if (col === 1) return;
      cell.alignment = { vertical: "top", wrapText: true, horizontal: col === 2 || (col >= 11 && col <= 19) || col === 21 ? "center" : "left" };
      cell.border = { top: { style: "thin", color: { argb: "FFD0DADB" } }, bottom: { style: "thin", color: { argb: "FFD0DADB" } }, left: { style: "thin", color: { argb: "FFD0DADB" } }, right: { style: "thin", color: { argb: "FFD0DADB" } } };
    });
    const sama = (ln.kompetensi ?? "").trim().toLowerCase() === (c.kompetensi_usulan ?? "").trim().toLowerCase();
    row.getCell(7).font = { color: { argb: sama ? WARNA_G[c.kekuatan_usulan] : "FF000000" } };
    if (c.relevan === false) row.eachCell((cell) => (cell.font = { ...cell.font, color: { argb: "FF9AA5A6" } }));
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  const tgl = new Date().toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = `Kertas Kerja Workshop 3 LNA PT KINRA ${tgl}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
