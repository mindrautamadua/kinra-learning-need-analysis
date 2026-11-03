"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Maximize2, Plus, Trash2 } from "lucide-react";
import type { DataLNA } from "@/lib/data";
import type { Capability, Jabatan, LearningNeed, PrioritasRjpp, SebabGap } from "@/lib/types";
import { checklist, KEKUATAN_LABEL, statusLN } from "@/lib/domain";
import type { PatchLN } from "../actions";
import { Popover } from "@/components/popover";
import { StatusChip, cx } from "@/components/ui";
import { PilihJabatan, PilihKompetensi, PilihPrioritas } from "./editor";

export type IsiCap = { relevan: boolean | null; catatan: string | null; prioritas: string[] };

type Props = {
  rows: LearningNeed[];
  cmap: Map<number, Capability>;
  jmap: Map<number, Jabatan>;
  pmap: Map<string, PrioritasRjpp>;
  data: DataLNA;
  jumlahPerCap: Map<number, number>;
  aktifId: string | null;
  tampilPetunjuk: boolean;
  onSimpanLN: (id: string, patch: PatchLN) => Promise<void>;
  onSimpanCap: (cap: Capability, isi: IsiCap) => Promise<void>;
  onTambah: (capId: number) => void;
  onHapus: (ln: LearningNeed) => void;
  onDetail: (id: string) => void;
};

const KOLOM = [
  { k: "B", nama: "No", w: 64, ket: "Nomor urut baris" },
  { k: "C", nama: "Business Strategy / Strategic Priority", w: 130, ket: "Strategi bisnis / prioritas strategis dari top management atau strategic house" },
  { k: "D", nama: "Strategic Initiative", w: 150, ket: "Inisiatif strategis konkret yang mendukung strategi bisnis tersebut" },
  { k: "E", nama: "Required Capabilities (Business Capabilities)", w: 230, ket: "Kemampuan bisnis/organisasi yang dibutuhkan agar peran dan inisiatif berhasil" },
  { k: "F", nama: "Key Position / Target Population", w: 210, ket: "Posisi kunci / populasi target yang terlibat dalam inisiatif ini, lengkapi dengan level jabatannya" },
  { k: "G", nama: "Competency", w: 210, ket: "Kompetensi posisi kunci yang menopang capability (dari kamus kompetensi bila ada)" },
  { k: "H", nama: "Expected Role / Performance", w: 260, ket: "Peran atau kinerja yang diharapkan dari posisi tersebut" },
  { k: "I", nama: "Gap Competency", w: 250, ket: "Sudah sejauh mana? Apa yang masih kurang?" },
  { k: "J", nama: "Learning Need", w: 290, ket: 'Kebutuhan pembelajaran hasil analisis kapabilitas (isi hanya bila gap karena kompetensi; bila karena hal lain tuliskan "non-pelatihan")' },
  { k: "", nama: "Status", w: 112, ket: "Checklist pedoman" },
];

/** Kolom B–E dibekukan (sticky kiri) saat lembar kerja digulir horizontal. */
const FZ: Record<string, string> = { B: "fz fz-b", C: "fz fz-c", D: "fz fz-d", E: "fz fz-e" };

/** Formulir isian berbentuk lembar kerja, mengikuti tab "Matriks Strategi-Kebutuhan" pada Kertas Kerja Workshop 3. */
export function LembarKerja(p: Props) {
  const [pop, setPop] = useState<{ jenis: "jabatan" | "kompetensi" | "rjpp"; id: string; anchor: HTMLElement } | null>(null);

  // rowspan ala sel gabungan Excel: strategi per blok strategi, capability per blok capability
  const spanStrategi = new Map<number, number>();
  const spanCap = new Map<number, number>();
  p.rows.forEach((ln, i) => {
    const c = p.cmap.get(ln.capability_id)!;
    const prev = i > 0 ? p.cmap.get(p.rows[i - 1].capability_id)! : null;
    // blok digabung bila strategi dan daftar inisiatifnya sama (seperti sel gabungan di Excel)
    const kunci = (x: Capability) => `${x.strategi}|${x.inisiatif.join("|")}`;
    if (!prev || kunci(prev) !== kunci(c)) {
      let n = 0;
      for (let j = i; j < p.rows.length && kunci(p.cmap.get(p.rows[j].capability_id)!) === kunci(c); j++) n++;
      spanStrategi.set(i, n);
    }
    if (!prev || prev.id !== c.id) {
      let n = 0;
      for (let j = i; j < p.rows.length && p.rows[j].capability_id === c.id; j++) n++;
      spanCap.set(i, n);
    }
  });

  const lnPop = pop ? p.rows.find((r) => r.id === pop.id) : undefined;
  const capPop = lnPop ? p.cmap.get(lnPop.capability_id) : undefined;

  return (
    <>
      <div className="legend-g small">
        <span className="muted">Warna teks kolom Competency (usulan DSMK):</span>
        <span className="g-kuat">■ Rekomendasi kuat</span>
        <span className="g-sedang">■ Rekomendasi sedang, perlu dipertegas SME</span>
        <span className="g-lemah">■ Rekomendasi lemah, SME perlu usulkan kompetensi baru</span>
      </div>
      <div className="table-wrap sheet-wrap">
        <table className="sheet" style={{ minWidth: KOLOM.reduce((a, k) => a + k.w, 0) }}>
          <colgroup>{KOLOM.map((k) => <col key={k.nama} style={{ width: k.w }} />)}</colgroup>
          <thead>
            <tr className="sheet-grp">
              <th className="fz fz-b" />
              <th colSpan={3} className="grp-dsmk fz fz-c fz-e">Diisi oleh DSMK</th>
              <th colSpan={5} className="grp-sdm">Diisi oleh SDM &amp; SME</th>
              <th />
            </tr>
            <tr className="sheet-col">
              {KOLOM.map((k) => (
                <th key={k.nama} className={cx(k.k >= "F" && k.k <= "J" ? "sdm" : k.k ? "dsmk" : "", FZ[k.k])}>
                  {k.k && <span className="col-letter">{k.k}</span>}
                  {k.nama}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.tampilPetunjuk && (
              <>
                <tr className="sheet-ket">{KOLOM.map((k) => <td key={k.nama} className={FZ[k.k]}>{k.ket}</td>)}</tr>
                <tr className="sheet-contoh">
                  <td className="num fz fz-b">CONTOH</td>
                  <td className="fz fz-c">Go Lean – Operational Excellence</td>
                  <td className="fz fz-d">• Operational Productivity &amp; Performance</td>
                  <td className="fz fz-e">Advanced Analytics, Modelling &amp; Decision Support</td>
                  <td>Asisten Kebun (BOD-3)</td>
                  <td>Data Interpretation</td>
                  <td>Menggunakan data monitoring operasional untuk mengidentifikasi deviasi, menentukan corrective action, dan memantau tindak lanjutnya</td>
                  <td>Belum terbiasa membaca data dashboard monitoring untuk mendeteksi deviasi dan menetapkan corrective action</td>
                  <td>Pelatihan interpretasi data monitoring operasional kebun bagi Asisten Kebun, mencakup pembacaan deviasi, penentuan corrective action, dan pemantauan tindak lanjut</td>
                  <td>←</td>
                </tr>
              </>
            )}
            {p.rows.length === 0 && (
              <tr><td colSpan={KOLOM.length} className="muted" style={{ padding: 28, textAlign: "center" }}>Tidak ada baris yang cocok dengan filter.</td></tr>
            )}
            {p.rows.map((ln, i) => {
              const c = p.cmap.get(ln.capability_id)!;
              const st = statusLN(ln, c);
              const kurang = checklist(ln, c).filter((x) => !x.ok);
              const tidakRelevan = c.relevan === false;
              const nonKomp = ln.sebab_gap === "non_kompetensi";
              const samaUsulan = (ln.kompetensi ?? "").trim().toLowerCase() === (c.kompetensi_usulan ?? "").trim().toLowerCase();
              const nSaudara = p.jumlahPerCap.get(c.id) ?? 1;
              const simpan = (patch: PatchLN) => p.onSimpanLN(ln.id, patch);
              return (
                <tr key={ln.id} className={cx(p.aktifId === ln.id && "aktif", tidakRelevan && "dim")}>
                  <td className="num no-cell fz fz-b">
                    <div>{ln.urutan > 1 ? `${c.no}.${ln.urutan}` : c.no}</div>
                    <div className="row-tools">
                      <button type="button" className="mini" onClick={() => p.onDetail(ln.id)} aria-label={`Buka detail baris ${c.no}`} title="Detail & checklist"><Maximize2 aria-hidden="true" /></button>
                      {nSaudara > 1 && (
                        <button type="button" className="mini danger" onClick={() => p.onHapus(ln)} aria-label={`Hapus learning need ke-${ln.urutan}`} title="Hapus baris ini"><Trash2 aria-hidden="true" /></button>
                      )}
                    </div>
                  </td>
                  {spanStrategi.has(i) && (
                    <>
                      <td rowSpan={spanStrategi.get(i)} className="ro strat-cell fz fz-c"><div className="sticky-in"><b>{c.strategi}</b></div></td>
                      <td rowSpan={spanStrategi.get(i)} className="ro small fz fz-d"><div className="sticky-in">{c.inisiatif.map((x) => <div key={x}>• {x}</div>)}</div></td>
                    </>
                  )}
                  {spanCap.has(i) && (
                    <>
                      <td rowSpan={spanCap.get(i)} className="ro cap-cell-x fz fz-e">
                        <div style={{ fontWeight: 600 }}>{c.capability}</div>
                        <div className="cap-meta">
                          <button
                            type="button"
                            className={cx("rjpp-btn", c.prioritas_rjpp.length === 0 && "kosong-btn")}
                            onClick={(e) => setPop({ jenis: "rjpp", id: ln.id, anchor: e.currentTarget })}
                            title="Tautkan ke prioritas RJPP KINRA"
                          >
                            {c.prioritas_rjpp.length ? c.prioritas_rjpp.map((k) => <span key={k} className="mono" title={p.pmap.get(k)?.nama}>{k}</span>) : "+ Prioritas RJPP"}
                          </button>
                          <div className="seg small rel-seg" role="group" aria-label={`Relevansi ${c.capability}`}>
                            {([[true, "Relevan"], [false, "Tidak relevan"]] as [boolean, string][]).map(([v, l]) => (
                              <button
                                key={l}
                                type="button"
                                aria-pressed={c.relevan === v}
                                onClick={() => p.onSimpanCap(c, { relevan: c.relevan === v ? null : v, catatan: c.catatan_relevansi, prioritas: c.prioritas_rjpp })}
                              >{l}</button>
                            ))}
                          </div>
                          <button type="button" className="mini-link" onClick={() => p.onTambah(c.id)} disabled={tidakRelevan} title="Tambah baris learning need untuk capability ini">
                            <Plus aria-hidden="true" /> Tambah learning need
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                  {/* F */}
                  <td className={cx("ed", !tidakRelevan && "pick")}>
                    <button
                      type="button"
                      className="cell-btn"
                      disabled={tidakRelevan}
                      onClick={(e) => setPop({ jenis: "jabatan", id: ln.id, anchor: e.currentTarget })}
                      aria-label={`Pilih key position untuk ${c.capability}`}
                    >
                      {ln.jabatan_ids.length ? (
                        <span>{ln.jabatan_ids.map((id) => p.jmap.get(id)).filter(Boolean).map((j) => <span key={j!.id} className="pos-line">{j!.nama} ({j!.level})</span>)}</span>
                      ) : <span className="ph">Pilih jabatan…</span>}
                      {ln.posisi_lain && <span className="pos-line muted">{ln.posisi_lain}</span>}
                    </button>
                  </td>
                  {/* G */}
                  <td className={cx("ed", !tidakRelevan && "pick")}>
                    <button
                      type="button"
                      className={cx("cell-btn", samaUsulan && `g-${c.kekuatan_usulan}`)}
                      disabled={tidakRelevan}
                      onClick={(e) => setPop({ jenis: "kompetensi", id: ln.id, anchor: e.currentTarget })}
                      title={samaUsulan ? KEKUATAN_LABEL[c.kekuatan_usulan] : "Kompetensi dipilih SME"}
                    >
                      {ln.kompetensi ?? <span className="ph">Pilih kompetensi…</span>}
                    </button>
                    <label className="sme-check">
                      <input type="checkbox" checked={ln.kompetensi_divalidasi} disabled={tidakRelevan} onChange={(e) => simpan({ kompetensi_divalidasi: e.target.checked })} />
                      Divalidasi SME
                    </label>
                  </td>
                  {/* H */}
                  <td className="ed">
                    <SelTeks nilai={ln.expected_role} disabled={tidakRelevan} label="Expected Role" placeholder="Kata kerja + objek + hasil" onSimpan={(v) => simpan({ expected_role: v })} />
                  </td>
                  {/* I */}
                  <td className="ed">
                    <SelTeks nilai={ln.gap} disabled={tidakRelevan} label="Gap Competency" placeholder="Sudah sejauh mana? Apa yang kurang?" onSimpan={(v) => simpan({ gap: v })} />
                    <div className="sebab" role="group" aria-label="Penyebab gap">
                      <span className="muted">Sebab:</span>
                      {([["kompetensi", "Kompetensi"], ["non_kompetensi", "Non-kompetensi"]] as [SebabGap, string][]).map(([v, l]) => (
                        <button key={v} type="button" aria-pressed={ln.sebab_gap === v} disabled={tidakRelevan} onClick={() => ln.sebab_gap !== v && simpan({ sebab_gap: v })}>{l}</button>
                      ))}
                    </div>
                  </td>
                  {/* J */}
                  <td className={cx("ed", nonKomp && "nonp")}>
                    {nonKomp ? (
                      <>
                        <div className="nonp-label">non-pelatihan</div>
                        <SelTeks nilai={ln.intervensi_non_pelatihan} disabled={tidakRelevan} label="Intervensi non-pelatihan" placeholder="Intervensi yang disarankan (SOP, sistem, data, struktur)…" onSimpan={(v) => simpan({ intervensi_non_pelatihan: v })} />
                      </>
                    ) : (
                      <SelTeks nilai={ln.learning_need} disabled={tidakRelevan} label="Learning Need" placeholder="Topik + populasi target + cakupan materi" onSimpan={(v) => simpan({ learning_need: v })} />
                    )}
                  </td>
                  <td>
                    <StatusChip status={st} />
                    {st !== "tidak_relevan" && kurang.length > 0 && (
                      <details className="upd" style={{ marginTop: 6 }}>
                        <summary style={{ cursor: "pointer", textDecoration: "underline dotted" }}>{kurang.length} syarat belum</summary>
                        <ul style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 12, lineHeight: 1.4 }}>
                          {kurang.map((x) => (
                            <li key={x.key}>{x.label}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {st === "lengkap" && <div className="upd" style={{ marginTop: 6, color: "var(--txt-good)" }}><Check size={11} aria-hidden="true" /> Siap</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pop && lnPop && capPop && pop.jenis === "jabatan" && (
        <Popover anchor={pop.anchor} judul={`Key Position · ${capPop.capability}`} onClose={() => setPop(null)}>
          <PilihJabatan data={p.data} terpilih={lnPop.jabatan_ids} selaluBuka onChange={(v) => p.onSimpanLN(lnPop.id, { jabatan_ids: v })} />
        </Popover>
      )}
      {pop && lnPop && capPop && pop.jenis === "kompetensi" && (
        <Popover anchor={pop.anchor} judul={`Competency · ${capPop.capability}`} lebar={520} onClose={() => setPop(null)}>
          <div className="small" style={{ marginBottom: 10 }}>
            Usulan DSMK: <b className={`g-${capPop.kekuatan_usulan}`}>{capPop.kompetensi_usulan ?? "–"}</b>{" "}
            <span className="muted">({KEKUATAN_LABEL[capPop.kekuatan_usulan].toLowerCase()})</span>
          </div>
          <PilihKompetensi
            data={p.data}
            nilai={lnPop.kompetensi}
            sumber={lnPop.sumber_kompetensi}
            onChange={(nama, sumber) =>
              p.onSimpanLN(lnPop.id, { kompetensi: nama, sumber_kompetensi: sumber, ...(nama !== lnPop.kompetensi ? { kompetensi_divalidasi: false } : {}) })
            }
          />
        </Popover>
      )}
      {pop && lnPop && capPop && pop.jenis === "rjpp" && (
        <Popover anchor={pop.anchor} judul={`Prioritas RJPP KINRA · ${capPop.capability}`} lebar={620} onClose={() => setPop(null)}>
          <PilihPrioritas
            daftar={p.data.prioritas}
            terpilih={capPop.prioritas_rjpp}
            onChange={(v) => p.onSimpanCap(capPop, { relevan: capPop.relevan, catatan: capPop.catatan_relevansi, prioritas: v })}
          />
        </Popover>
      )}
    </>
  );
}

/** Sel teks yang tumbuh otomatis dan menyimpan saat fokus berpindah (seperti mengetik di Excel). */
function SelTeks({ nilai, onSimpan, label, placeholder, disabled }: {
  nilai: string | null; onSimpan: (v: string | null) => Promise<void>; label: string; placeholder: string; disabled?: boolean;
}) {
  const [v, setV] = useState(nilai ?? "");
  const [status, setStatus] = useState<"diam" | "simpan" | "gagal">("diam");
  const ref = useRef<HTMLTextAreaElement>(null);
  const fokus = useRef(false);

  // sinkron dari server bila sel tidak sedang diedit
  useEffect(() => { if (!fokus.current) setV(nilai ?? ""); }, [nilai]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(56, el.scrollHeight)}px`;
  }, [v]);

  const simpan = async () => {
    fokus.current = false;
    const baru = v.trim() === "" ? null : v;
    if ((baru ?? "") === (nilai ?? "")) return;
    setStatus("simpan");
    try {
      await onSimpan(baru);
      setStatus("diam");
    } catch {
      setStatus("gagal");
    }
  };

  return (
    <textarea
      ref={ref}
      className={cx("cell-txt", status === "simpan" && "menyimpan", status === "gagal" && "gagal")}
      value={v}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={label}
      rows={2}
      onFocus={() => { fokus.current = true; }}
      onChange={(e) => setV(e.target.value)}
      onBlur={simpan}
      onKeyDown={(e) => {
        if (e.key === "Escape") { setV(nilai ?? ""); (e.target as HTMLTextAreaElement).blur(); }
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.target as HTMLTextAreaElement).blur();
      }}
    />
  );
}
