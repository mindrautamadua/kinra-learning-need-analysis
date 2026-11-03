"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Circle, Copy, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import type { DataLNA } from "@/lib/data";
import type { Capability, LearningNeed, PrioritasRjpp, SebabGap, SumberKompetensi } from "@/lib/types";
import { checklist, KEKUATAN_LABEL, statusLN, URUT_PILAR_RJPP, waktu } from "@/lib/domain";
import { hapusLearningNeed, simpanCapability, simpanLearningNeed, tambahLearningNeed, type PatchLN } from "../actions";
import { bacaPengisi } from "@/components/pengisi";
import { KekuatanChip, StatusChip, cx } from "@/components/ui";

type Props = {
  ln: LearningNeed;
  cap: Capability;
  saudara: LearningNeed[];
  data: DataLNA;
  adaSebelum: boolean;
  adaBerikut: boolean;
  onPindah: (arah: -1 | 1) => void;
  onBuka: (id: string) => void;
  onClose: () => void;
  onLnTersimpan: (ln: LearningNeed) => void;
  onLnTerhapus: (id: string) => void;
  onCapTersimpan: (c: Capability) => void;
};

type Draft = Required<Omit<PatchLN, "diubah_oleh">>;
const dariLN = (l: LearningNeed): Draft => ({
  jabatan_ids: l.jabatan_ids,
  posisi_lain: l.posisi_lain,
  kompetensi: l.kompetensi,
  sumber_kompetensi: l.sumber_kompetensi,
  kompetensi_divalidasi: l.kompetensi_divalidasi,
  expected_role: l.expected_role,
  gap: l.gap,
  sebab_gap: l.sebab_gap,
  intervensi_non_pelatihan: l.intervensi_non_pelatihan,
  learning_need: l.learning_need,
  catatan: l.catatan,
  jumlah_peserta: l.jumlah_peserta,
  level_dibutuhkan: l.level_dibutuhkan,
  level_saat_ini: l.level_saat_ini,
  skor_relevansi: l.skor_relevansi,
  skor_kritikalitas: l.skor_kritikalitas,
  skor_urgensi: l.skor_urgensi,
  metode: l.metode,
  target_tw: l.target_tw,
  pic: l.pic,
});

export function Editor(p: Props) {
  const { ln, cap, data } = p;
  const [d, setD] = useState<Draft>(() => dariLN(ln));
  const [relevan, setRelevan] = useState<boolean | null>(cap.relevan);
  const [catatanRel, setCatatanRel] = useState(cap.catatan_relevansi ?? "");
  const [prioritas, setPrioritas] = useState<string[]>(cap.prioritas_rjpp);
  const [pesan, setPesan] = useState<{ teks: string; err?: boolean } | null>(null);
  const [pending, start] = useTransition();

  const jmap = useMemo(() => new Map(data.jabatan.map((j) => [j.id, j])), [data.jabatan]);
  const dirtyLN = JSON.stringify(d) !== JSON.stringify(dariLN(ln));
  const dirtyCap =
    relevan !== cap.relevan ||
    (catatanRel || null) !== (cap.catatan_relevansi || null) ||
    [...prioritas].sort().join() !== [...cap.prioritas_rjpp].sort().join();
  const dirty = dirtyLN || dirtyCap;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const lnPreview: LearningNeed = { ...ln, ...d };
  const cek = checklist(lnPreview, { prioritas_rjpp: prioritas });
  const status = statusLN(lnPreview, { ...cap, relevan, prioritas_rjpp: prioritas });

  useEffect(() => {
    if (!pesan) return;
    const t = setTimeout(() => setPesan(null), 3200);
    return () => clearTimeout(t);
  }, [pesan]);

  const simpan = useCallback(
    (lalu?: () => void) => {
      start(async () => {
        try {
          const oleh = bacaPengisi() || undefined;
          if (dirtyCap) {
            const tersimpan = await simpanCapability(cap.id, { relevan, catatan: catatanRel, prioritas }, oleh);
            setPrioritas(tersimpan);
            p.onCapTersimpan({ ...cap, relevan, catatan_relevansi: catatanRel || null, prioritas_rjpp: tersimpan, diubah_oleh: oleh ?? null });
          }
          if (dirtyLN) {
            const baru = await simpanLearningNeed(ln.id, { ...d, diubah_oleh: oleh ?? null });
            p.onLnTersimpan(baru);
          }
          setPesan({ teks: "Tersimpan" });
          lalu?.();
        } catch (e) {
          setPesan({ teks: (e as Error).message, err: true });
        }
      });
    },
    [dirtyCap, dirtyLN, cap, relevan, catatanRel, prioritas, ln.id, d, p],
  );

  const tutup = useCallback(() => {
    if (dirty && !confirm("Ada perubahan yang belum disimpan. Tutup tanpa menyimpan?")) return;
    p.onClose();
  }, [dirty, p]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (dirty) simpan(); }
      if (e.key === "Escape") tutup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, simpan, tutup]);

  const pindah = (arah: -1 | 1) => (dirty ? simpan(() => p.onPindah(arah)) : p.onPindah(arah));

  const tambah = (salin: boolean) =>
    start(async () => {
      try {
        const baru = await tambahLearningNeed(cap.id, salin ? ln.id : undefined, bacaPengisi() || undefined);
        p.onLnTersimpan(baru);
        p.onBuka(baru.id);
      } catch (e) {
        setPesan({ teks: (e as Error).message, err: true });
      }
    });

  const hapus = () => {
    if (!confirm(`Hapus learning need ke-${ln.urutan} untuk "${cap.capability}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    start(async () => {
      try {
        await hapusLearningNeed(ln.id);
        const lain = p.saudara.find((s) => s.id !== ln.id);
        p.onLnTerhapus(ln.id);
        if (lain) p.onBuka(lain.id); else p.onClose();
      } catch (e) {
        setPesan({ teks: (e as Error).message, err: true });
      }
    });
  };

  const isiKerangka = () => {
    const posisi = d.jabatan_ids.map((id) => jmap.get(id)?.nama).filter(Boolean).join(", ") || "[posisi kunci]";
    set("learning_need", `Pelatihan ${d.kompetensi ?? "[kompetensi]"} bagi ${posisi}, mencakup [cakupan materi 1], [cakupan materi 2], dan [cakupan materi 3]`);
  };

  const nonKomp = d.sebab_gap === "non_kompetensi";
  const ok = Object.fromEntries(cek.map((c) => [c.key, c.ok]));

  return (
    <>
      <div className="backdrop" onClick={tutup} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="judul-editor">
        <div className="drawer-head">
          <div className="row" style={{ alignItems: "center" }}>
            <div className="eyebrow">No {cap.no}{p.saudara.length > 1 ? ` · learning need ${ln.urutan} dari ${p.saudara.length}` : ""}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <StatusChip status={status} />
              <button className="btn icon-btn ghost" onClick={() => pindah(-1)} disabled={!p.adaSebelum || pending} aria-label="Baris sebelumnya"><ChevronLeft aria-hidden="true" /></button>
              <button className="btn icon-btn ghost" onClick={() => pindah(1)} disabled={!p.adaBerikut || pending} aria-label="Baris berikutnya"><ChevronRight aria-hidden="true" /></button>
              <button className="btn icon-btn ghost" onClick={tutup} aria-label="Tutup editor"><X aria-hidden="true" /></button>
            </div>
          </div>
          <h3 id="judul-editor" style={{ fontSize: 20, marginTop: 8 }}>{cap.capability}</h3>
          <div className="chain" style={{ marginTop: 8 }}>
            <span className="chip brand">{cap.strategi}</span>
            {cap.inisiatif.map((i) => <span key={i} className="chip na">{i}</span>)}
          </div>
          {p.saudara.length > 1 && (
            <div className="seg small" style={{ marginTop: 10 }} role="tablist" aria-label="Learning need pada capability ini">
              {p.saudara.map((s) => (
                <button key={s.id} role="tab" aria-selected={s.id === ln.id} onClick={() => s.id !== ln.id && (dirty ? simpan(() => p.onBuka(s.id)) : p.onBuka(s.id))}>
                  LN {s.urutan}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="drawer-body">
          {/* Prioritas RJPP KINRA */}
          <Step no="R" ok={prioritas.length > 0} judul="Prioritas RJPP KINRA" hint="Prioritas bisnis KINRA (RJPP 2026–2030) yang didukung capability ini. Pilih satu atau lebih. Berlaku untuk semua learning need pada capability ini.">
            <PilihPrioritas daftar={data.prioritas} terpilih={prioritas} onChange={setPrioritas} />
          </Step>

          {/* 0. Relevansi */}
          <Step no="0" ok={relevan !== null} judul="Relevan untuk bisnis KINRA?" hint="Template berasal dari PTPN Group. Tandai capability yang tidak dijalankan KINRA agar tidak dipaksakan menjadi learning need.">
            <div className="seg" role="group" aria-label="Relevansi capability">
              <button aria-pressed={relevan === true} onClick={() => setRelevan(true)}>Relevan</button>
              <button aria-pressed={relevan === false} onClick={() => setRelevan(false)}>Tidak relevan</button>
              <button aria-pressed={relevan === null} onClick={() => setRelevan(null)}>Belum diputuskan</button>
            </div>
            {relevan === false && (
              <input className="inp" placeholder="Alasan singkat (mis. KINRA tidak mengelola kebun tebu)" value={catatanRel} onChange={(e) => setCatatanRel(e.target.value)} aria-label="Alasan tidak relevan" />
            )}
          </Step>

          <fieldset disabled={relevan === false} style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 22, opacity: relevan === false ? 0.45 : 1 }}>
            {/* F. Key position */}
            <Step no="F" ok={ok.posisi} judul="Key Position / Target Population" hint="Jabatan yang paling menentukan keberhasilan capability. Pilih dari nomenklatur resmi PT KINRA; boleh lebih dari satu.">
              <PilihJabatan data={data} terpilih={d.jabatan_ids} onChange={(v) => set("jabatan_ids", v)} />
              <input className="inp" placeholder="Populasi lain di luar nomenklatur (opsional)" value={d.posisi_lain ?? ""} onChange={(e) => set("posisi_lain", e.target.value)} aria-label="Posisi lain" />
            </Step>

            {/* G. Competency */}
            <Step no="G" ok={ok.kompetensi && ok.validasi} judul="Competency" hint="Usulan DSMK sudah terisi. SME memvalidasi atau menggantinya dengan kompetensi dari kamus, kompetensi leadership, atau usulan baru.">
              <div className="card" style={{ padding: 12, background: "var(--surface-2)" }}>
                <div className="row" style={{ alignItems: "center" }}>
                  <div>
                    <div className="muted small">Usulan DSMK</div>
                    <div style={{ fontWeight: 600 }}>{cap.kompetensi_usulan ?? "–"}</div>
                  </div>
                  <KekuatanChip k={cap.kekuatan_usulan} />
                </div>
                <div className="muted small" style={{ marginTop: 6 }}>
                  {KEKUATAN_LABEL[cap.kekuatan_usulan]}.{" "}
                  {cap.kekuatan_usulan === "sedang" && "Hanya menutup sebagian cakupan capability; perlu dipertegas SME."}
                  {cap.kekuatan_usulan === "lemah" && "Kamus belum punya kompetensi yang menutup capability ini; SME perlu mengusulkan kompetensi baru."}
                  {cap.kekuatan_usulan === "kuat" && "Nama dan cakupan kompetensi sejalan dengan capability."}
                </div>
              </div>
              <PilihKompetensi
                data={data}
                nilai={d.kompetensi}
                sumber={d.sumber_kompetensi}
                onChange={(nama, sumber) => setD((x) => ({ ...x, kompetensi: nama, sumber_kompetensi: sumber, kompetensi_divalidasi: nama === x.kompetensi ? x.kompetensi_divalidasi : false }))}
              />
              <label className="check" style={{ cursor: "pointer", alignItems: "center" }}>
                <input type="checkbox" checked={d.kompetensi_divalidasi} onChange={(e) => set("kompetensi_divalidasi", e.target.checked)} />
                <span><b>Divalidasi SME.</b> Kompetensi ini benar menopang capability untuk posisi terpilih.</span>
              </label>
            </Step>

            {/* H. Expected role */}
            <Step no="H" ok={ok.expected} judul="Expected Role / Performance" hint="Perilaku kerja yang dapat diamati: kata kerja + objek + hasil.">
              <textarea className="txt" value={d.expected_role ?? ""} onChange={(e) => set("expected_role", e.target.value)}
                placeholder="Contoh: Menggunakan data operasional IPAL untuk mengidentifikasi deviasi mutu efluen, menentukan corrective action, dan memantau tindak lanjutnya" aria-label="Expected Role" />
            </Step>

            {/* I. Gap */}
            <Step no="I" ok={ok.gap} judul="Gap Competency" hint="Sudah sejauh mana? Apa yang masih kurang? Tentukan juga penyebabnya.">
              <textarea className="txt" value={d.gap ?? ""} onChange={(e) => set("gap", e.target.value)}
                placeholder="Contoh: Belum terbiasa membaca dashboard monitoring untuk mendeteksi deviasi dan menetapkan corrective action" aria-label="Gap Competency" />
              <div className="lbl small" style={{ fontWeight: 600 }}>Penyebab gap</div>
              <div className="seg" role="group" aria-label="Penyebab gap">
                {([["kompetensi", "Kompetensi (pengetahuan / keterampilan)"], ["non_kompetensi", "Non-kompetensi (sistem, data, SOP, struktur)"]] as [SebabGap, string][]).map(([v, l]) => (
                  <button key={v} aria-pressed={d.sebab_gap === v} onClick={() => set("sebab_gap", v)}>{l}</button>
                ))}
              </div>
            </Step>

            {/* J. Learning need */}
            {nonKomp ? (
              <Step no="J" ok={ok.ln} judul="Non-pelatihan: intervensi yang disarankan" hint='Gap bersebab non-kompetensi tidak dipaksakan menjadi pelatihan. Kolom J akan tertulis "non-pelatihan" diikuti intervensi ini.'>
                <textarea className="txt" value={d.intervensi_non_pelatihan ?? ""} onChange={(e) => set("intervensi_non_pelatihan", e.target.value)}
                  placeholder="Contoh: Revisi SOP pelaporan IPAL dan penyediaan dashboard monitoring terintegrasi" aria-label="Intervensi non-pelatihan" />
              </Step>
            ) : (
              <Step no="J" ok={ok.ln} judul="Learning Need" hint="Topik + populasi target + cakupan materi. Isi hanya bila gap disebabkan kompetensi.">
                <textarea className="txt" style={{ minHeight: 110 }} value={d.learning_need ?? ""} onChange={(e) => set("learning_need", e.target.value)}
                  placeholder="Contoh: Pelatihan interpretasi data monitoring IPAL bagi Supervisor IPAL, mencakup pembacaan deviasi, penentuan corrective action, dan pemantauan tindak lanjut" aria-label="Learning Need" />
                <div><button className="btn" type="button" onClick={isiKerangka}><Sparkles aria-hidden="true" /> Isi kerangka dari kompetensi & posisi</button></div>
              </Step>
            )}

            {/* Field penilaian (jumlah peserta, level, prioritas R/K/U, metode, TW, PIC) disembunyikan: tidak ada di template Workshop 3.
                Prioritas dipakai lagi di Tahap 4; datanya tetap tersimpan dan ikut tersimpan ulang apa adanya. */}

            <div className="field">
              <label htmlFor="catatan">Catatan workshop (opsional)</label>
              <textarea id="catatan" className="txt" style={{ minHeight: 60 }} value={d.catatan ?? ""} onChange={(e) => set("catatan", e.target.value)} />
            </div>
          </fieldset>

          <div className="card" style={{ padding: 16 }}>
            <h3>Checklist sebelum dikumpulkan</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {cek.map((c) => (
                <div key={c.key} className={cx("check", c.ok ? "ok" : "no")}>
                  {c.ok ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
                  <span>{c.label}<span className="sr-only">{c.ok ? ": terpenuhi" : ": belum"}</span></span>
                </div>
              ))}
            </div>
            <p className="muted small" style={{ margin: "10px 0 0" }}>
              Terakhir diubah {waktu(ln.updated_at)} WIB{ln.diubah_oleh ? ` oleh ${ln.diubah_oleh}` : ""}.
            </p>
          </div>
        </div>

        <div className="drawer-foot">
          <button className="btn primary" onClick={() => simpan()} disabled={!dirty || pending}>{pending ? "Menyimpan…" : dirty ? "Simpan" : "Tersimpan"}</button>
          <button className="btn" onClick={() => (dirty ? simpan(() => p.onPindah(1)) : p.onPindah(1))} disabled={!p.adaBerikut || pending}>Simpan & berikutnya</button>
          <span style={{ flex: 1 }} />
          <button className="btn ghost" onClick={() => tambah(true)} disabled={pending || dirty} title={dirty ? "Simpan dulu perubahan" : "Learning need baru dengan posisi & kompetensi yang sama"}><Copy aria-hidden="true" /><span className="hide-sm">Duplikat</span></button>
          <button className="btn ghost" onClick={() => tambah(false)} disabled={pending || dirty} title={dirty ? "Simpan dulu perubahan" : "Learning need baru untuk capability ini"}><Plus aria-hidden="true" /><span className="hide-sm">Tambah LN</span></button>
          {p.saudara.length > 1 && <button className="btn ghost danger" onClick={hapus} disabled={pending} aria-label="Hapus learning need ini"><Trash2 aria-hidden="true" /></button>}
        </div>
      </aside>
      {pesan && <div className={cx("toast", pesan.err && "err")} role="status">{pesan.teks}</div>}
    </>
  );
}

function Step({ no, ok, judul, hint, children }: { no: string; ok: boolean; judul: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="step">
      <div className={cx("step-no", ok && "ok")} aria-hidden="true">{ok ? <Check size={14} /> : no}</div>
      <div className="field">
        <div className="lbl">{judul}</div>
        <div className="hint">{hint}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>{children}</div>
      </div>
    </div>
  );
}

export function PilihJabatan({ data, terpilih, onChange, selaluBuka = false }: { data: Pick<DataLNA, "jabatan">; terpilih: number[]; onChange: (v: number[]) => void; selaluBuka?: boolean }) {
  const [q, setQ] = useState("");
  const [bukaState, setBuka] = useState(false);
  const buka = selaluBuka || bukaState;
  const jmap = useMemo(() => new Map(data.jabatan.map((j) => [j.id, j])), [data.jabatan]);
  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return data.jabatan.filter((j) => !terpilih.includes(j.id) && (!kata || `${j.nama} ${j.level} ${j.divisi} ${j.kode ?? ""}`.toLowerCase().includes(kata)));
  }, [q, data.jabatan, terpilih]);
  const grup = useMemo(() => {
    const m = new Map<string, typeof hasil>();
    for (const j of hasil) m.set(j.divisi ?? "Lainnya", [...(m.get(j.divisi ?? "Lainnya") ?? []), j]);
    return [...m.entries()];
  }, [hasil]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {terpilih.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {terpilih.map((id) => {
            const j = jmap.get(id);
            return (
              <span key={id} className="tag">
                {j ? `${j.nama} (${j.level})` : `#${id}`}
                <button type="button" onClick={() => onChange(terpilih.filter((x) => x !== id))} aria-label={`Hapus ${j?.nama ?? id}`}><X size={12} aria-hidden="true" /></button>
              </span>
            );
          })}
        </div>
      )}
      <label className="search">
        <Search aria-hidden="true" />
        <input className="inp" placeholder="Cari jabatan, divisi, atau level (mis. IPAL, BOD-2)…" value={q}
          onChange={(e) => { setQ(e.target.value); setBuka(true); }} onFocus={() => setBuka(true)} aria-label="Cari jabatan" />
      </label>
      {buka && (
        <div className="picker" role="listbox" aria-label="Daftar jabatan PT KINRA">
          {grup.length === 0 && <div className="muted small" style={{ padding: 12 }}>Tidak ada jabatan yang cocok.</div>}
          {grup.map(([div, list]) => (
            <div key={div}>
              <div className="grp-title">{div}</div>
              {list.map((j) => (
                <button key={j.id} type="button" role="option" aria-selected={false} onClick={() => { onChange([...terpilih, j.id]); setQ(""); }}>
                  <span style={{ flex: 1 }}>{j.nama}</span>
                  <span className="mono muted small">{j.level}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      {buka && !selaluBuka && <div><button type="button" className="btn ghost" onClick={() => setBuka(false)}>Tutup daftar</button></div>}
    </div>
  );
}

export function PilihKompetensi({ data, nilai, sumber, onChange }: { data: Pick<DataLNA, "kamusHard" | "kamusLeadership">; nilai: string | null; sumber: SumberKompetensi | null; onChange: (nama: string | null, sumber: SumberKompetensi) => void }) {
  const [tab, setTab] = useState<SumberKompetensi>(sumber ?? "hard");
  const [q, setQ] = useState("");
  const [hanyaKawasan, setHanyaKawasan] = useState(false);
  const [usulan, setUsulan] = useState(sumber === "usulan" ? nilai ?? "" : "");

  // kamus berisi nama yang sama di beberapa job function: gabungkan per nama
  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    const m = new Map<string, { nama: string; jf: Set<string>; area: Set<string> }>();
    for (const k of data.kamusHard) {
      if (hanyaKawasan && k.area !== "KAWASAN INDUSTRI") continue;
      if (kata && !`${k.nama} ${k.job_function} ${k.area}`.toLowerCase().includes(kata)) continue;
      const key = k.nama.toLowerCase();
      const e = m.get(key) ?? { nama: k.nama, jf: new Set(), area: new Set() };
      e.jf.add(k.job_function);
      e.area.add(k.area);
      m.set(key, e);
    }
    return [...m.values()].slice(0, 80);
  }, [q, hanyaKawasan, data.kamusHard]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="row" style={{ alignItems: "center" }}>
        <div>
          <div className="muted small">Kompetensi terpilih</div>
          <div style={{ fontWeight: 600 }}>{nilai ?? "–"}</div>
        </div>
        {sumber && <span className="chip na">{sumber === "hard" ? "Kamus Hard Competency" : sumber === "leadership" ? "Kamus Leadership" : "Usulan baru"}</span>}
      </div>
      <div className="seg small" role="tablist" aria-label="Sumber kompetensi">
        <button role="tab" aria-selected={tab === "hard"} onClick={() => setTab("hard")}>Hard Competency ({new Set(data.kamusHard.map((k) => k.nama.toLowerCase())).size})</button>
        <button role="tab" aria-selected={tab === "leadership"} onClick={() => setTab("leadership")}>Leadership ({data.kamusLeadership.length})</button>
        <button role="tab" aria-selected={tab === "usulan"} onClick={() => setTab("usulan")}>Usulan baru</button>
      </div>
      {tab === "hard" && (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label className="search" style={{ flex: 1, minWidth: 220 }}>
              <Search aria-hidden="true" />
              <input className="inp" placeholder="Cari nama kompetensi, job function, atau area…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari kompetensi" />
            </label>
            <label className="check" style={{ alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={hanyaKawasan} onChange={(e) => setHanyaKawasan(e.target.checked)} /> Area Kawasan Industri saja
            </label>
          </div>
          <div className="picker" role="listbox" aria-label="Kamus Hard Competency">
            {hasil.length === 0 && <div className="muted small" style={{ padding: 12 }}>Tidak ada kompetensi yang cocok. Coba tab Usulan baru.</div>}
            {hasil.map((h) => (
              <button key={h.nama} type="button" role="option" aria-selected={nilai === h.nama} onClick={() => onChange(h.nama, "hard")}>
                {nilai === h.nama ? <Check size={14} style={{ color: "var(--brand)", marginTop: 3 }} aria-hidden="true" /> : <span style={{ width: 14 }} />}
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600 }}>{h.nama}</span>
                  <span className="muted small" style={{ display: "block" }}>{[...h.jf].slice(0, 3).join(" · ")}{h.jf.size > 3 ? ` · +${h.jf.size - 3}` : ""}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      {tab === "leadership" && (
        <div className="picker" role="listbox" aria-label="Kamus Leadership">
          {data.kamusLeadership.map((k) => (
            <button key={k.id} type="button" role="option" aria-selected={nilai === k.nama} onClick={() => onChange(k.nama, "leadership")}>
              {nilai === k.nama ? <Check size={14} style={{ color: "var(--brand)", marginTop: 3 }} aria-hidden="true" /> : <span style={{ width: 14 }} />}
              <span>{k.nama}</span>
            </button>
          ))}
        </div>
      )}
      {tab === "usulan" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input className="inp" placeholder="Nama kompetensi baru yang diusulkan SME" value={usulan} onChange={(e) => setUsulan(e.target.value)} aria-label="Usulan kompetensi baru" />
          <button type="button" className="btn" disabled={!usulan.trim()} onClick={() => onChange(usulan.trim(), "usulan")}>Pakai</button>
        </div>
      )}
    </div>
  );
}

export function PilihPrioritas({ daftar, terpilih, onChange }: { daftar: PrioritasRjpp[]; terpilih: string[]; onChange: (v: string[]) => void }) {
  const grup = URUT_PILAR_RJPP.map((pilar) => ({ pilar, items: daftar.filter((d) => d.pilar === pilar) })).filter((g) => g.items.length);
  const toggle = (kode: string) => onChange(terpilih.includes(kode) ? terpilih.filter((k) => k !== kode) : [...terpilih, kode]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {grup.map((g) => (
        <div key={g.pilar}>
          <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>{g.pilar}</div>
          <div className="prio-grid" role="group" aria-label={`Prioritas ${g.pilar}`}>
            {g.items.map((it) => {
              const on = terpilih.includes(it.kode);
              return (
                <button key={it.kode} type="button" className={cx("prio", on && "on", it.jenis === "inisiatif_2027" && "j27")} aria-pressed={on} onClick={() => toggle(it.kode)} title={it.uraian ?? it.nama}>
                  <span className="mono kode">{it.kode}</span>
                  <span className="nm">{it.nama}</span>
                  {it.jenis === "inisiatif_2027" && <span className="chip warn" style={{ height: 18, fontSize: 10.5 }}>2027</span>}
                  {on && <Check size={14} aria-hidden="true" style={{ color: "var(--brand)", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="muted small" style={{ margin: 0 }}>Arahkan kursor ke pilihan untuk melihat uraiannya. Sumber: RJPP PT KINRA 2026–2030 (draft), Bab III dan Strategic Journey 2027.</p>
    </div>
  );
}
