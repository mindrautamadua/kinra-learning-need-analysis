import Link from "next/link";
import { BadgeCheck, ClipboardList, Filter, Wrench } from "lucide-react";
import { muatMatriks } from "@/lib/data";
import { angka, JENIS_PRIORITAS_LABEL, namaJabatan, persen, statusLN, STATUS_LABEL, strategiPendek, URUT_PILAR_RJPP, waktu, type Status } from "@/lib/domain";
import { Chip, KekuatanChip, SectionHead, StatusChip } from "@/components/ui";

export const dynamic = "force-dynamic";

const URUT_STATUS: Status[] = ["lengkap", "sebagian", "belum", "tidak_relevan"];

export default async function Ringkasan() {
  const { capabilities: caps, learningNeeds: lns, jabatan, prioritas } = await muatMatriks();
  const cmap = new Map(caps.map((c) => [c.id, c]));
  const jmap = new Map(jabatan.map((j) => [j.id, j]));
  const st = lns.map((l) => ({ l, c: cmap.get(l.capability_id)!, s: statusLN(l, cmap.get(l.capability_id)) }));

  const relevanDiputus = caps.filter((c) => c.relevan !== null).length;
  const tidakRelevan = caps.filter((c) => c.relevan === false).length;
  const aktif = st.filter((x) => x.s !== "tidak_relevan");
  const lengkap = aktif.filter((x) => x.s === "lengkap").length;
  const divalidasi = aktif.filter((x) => x.l.kompetensi_divalidasi).length;
  const nonPelatihan = aktif.filter((x) => x.l.sebab_gap === "non_kompetensi").length;

  const perStrategi = [...new Set(caps.map((c) => c.strategi))].map((s) => {
    const baris = st.filter((x) => x.c.strategi === s);
    const h: Record<Status, number> = { lengkap: 0, sebagian: 0, belum: 0, tidak_relevan: 0 };
    baris.forEach((x) => h[x.s]++);
    return { s, total: baris.length, h, cap: caps.filter((c) => c.strategi === s).length };
  });

  const perluPerhatian = aktif
    .filter((x) => x.c.kekuatan_usulan !== "kuat" && !x.l.kompetensi_divalidasi)
    .sort((a, b) => (a.c.kekuatan_usulan === "lemah" ? -1 : 1) - (b.c.kekuatan_usulan === "lemah" ? -1 : 1) || a.c.no - b.c.no);

  const hitungJabatan = new Map<number, number>();
  aktif.forEach((x) => x.l.jabatan_ids.forEach((id) => hitungJabatan.set(id, (hitungJabatan.get(id) ?? 0) + 1)));
  const topJabatan = [...hitungJabatan.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Dukungan L&D per prioritas RJPP: capability relevan yang ditautkan dan learning need lengkapnya
  const dukungan = prioritas.map((pr) => {
    const capTerkait = caps.filter((c) => c.relevan !== false && c.prioritas_rjpp.includes(pr.kode));
    const ids = new Set(capTerkait.map((c) => c.id));
    const lnTerkait = aktif.filter((x) => ids.has(x.c.id));
    return { pr, cap: capTerkait.length, lengkap: lnTerkait.filter((x) => x.s === "lengkap").length, ln: lnTerkait.length };
  });
  const prioritasDidukung = dukungan.filter((d) => d.cap > 0).length;
  const capBelumRjpp = caps.filter((c) => c.relevan !== false && c.prioritas_rjpp.length === 0).length;

  const terbaru = [...st].sort((a, b) => +new Date(b.l.updated_at) - +new Date(a.l.updated_at)).filter((x) => x.l.updated_at !== x.l.created_at).slice(0, 8);

  const tiles = [
    { icon: Filter, label: "Relevansi diputuskan", nilai: relevanDiputus, dari: caps.length, meta: `${angka(tidakRelevan)} capability ditandai tidak relevan` },
    { icon: ClipboardList, label: "Learning need lengkap", nilai: lengkap, dari: aktif.length, meta: "Semua checklist pedoman terpenuhi" },
    { icon: BadgeCheck, label: "Kompetensi divalidasi SME", nilai: divalidasi, dari: aktif.length, meta: "Kolom G dikonfirmasi SME" },
    { icon: Wrench, label: "Gap non-pelatihan", nilai: nonPelatihan, dari: null, meta: "Ditangani lewat sistem, SOP, data, atau struktur" },
  ];

  return (
    <>
      <section className="section">
        <SectionHead no="01" eyebrow="Ringkasan pengisian" judul={`${persen(aktif.length ? (lengkap / aktif.length) * 100 : 0)} learning need KINRA sudah siap dikumpulkan`}>
          <p className="muted">
            Progres pengisian kertas kerja Workshop 3 ALNA 2027. Learning need lengkap menjadi input penyusunan Learning Priorities pada 9–13 November 2026.
            Sumber: Kertas Kerja Workshop 3 PT KINRA.
          </p>
        </SectionHead>
        <div className="tiles">
          {tiles.map((t) => (
            <div key={t.label} className="tile">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className="icon-box"><t.icon size={16} aria-hidden="true" /></span>
                <span className="label">{t.label}</span>
              </div>
              <div className="big tnum">{angka(t.nilai)}{t.dari != null && <small> / {angka(t.dari)}</small>}</div>
              {t.dari != null && (
                <div className="track" style={{ marginTop: 12 }} role="img" aria-label={`${angka(t.nilai)} dari ${angka(t.dari)}`}>
                  <i style={{ width: `${t.dari ? (t.nilai / t.dari) * 100 : 0}%` }} />
                </div>
              )}
              <div className="muted small" style={{ marginTop: 10 }}>{t.meta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead no="02" eyebrow="Prioritas bisnis RJPP KINRA" judul={`${angka(prioritasDidukung)} dari ${angka(prioritas.length)} prioritas RJPP sudah didukung capability`}>
          <p className="muted">
            Menjawab L&D Mission Objectives: business priorities apa yang membutuhkan dukungan L&D. Prioritas tanpa capability adalah area yang belum
            tersentuh pembelajaran. {angka(capBelumRjpp)} capability relevan belum ditautkan ke RJPP. Sumber: RJPP PT KINRA 2026–2030 (draft).
          </p>
        </SectionHead>
        <div className="card">
          <div className="table-wrap tall" style={{ maxHeight: 520 }}>
            <table className="tbl">
              <thead><tr><th style={{ width: 60 }}>Kode</th><th>Prioritas</th><th>Jenis</th><th className="num">Capability</th><th className="num">LN lengkap</th><th>Dukungan L&D</th></tr></thead>
              <tbody>
                {URUT_PILAR_RJPP.flatMap((pilar) => [
                  <tr key={`h-${pilar}`} className="strat-head"><td colSpan={6}><b>{pilar}</b></td></tr>,
                  ...dukungan.filter((d) => d.pr.pilar === pilar).map((d) => (
                    <tr key={d.pr.kode}>
                      <td className="mono small">{d.pr.kode}</td>
                      <td>
                        <Link href={`/rekap`} style={{ fontWeight: 600 }}>{d.pr.nama}</Link>
                        {d.pr.uraian && <div className="upd clamp-2" style={{ maxWidth: 560 }}>{d.pr.uraian}</div>}
                      </td>
                      <td className="small" style={{ whiteSpace: "nowrap" }}>{JENIS_PRIORITAS_LABEL[d.pr.jenis]}</td>
                      <td className="num">{angka(d.cap)}</td>
                      <td className="num">{angka(d.lengkap)}<span className="muted"> / {angka(d.ln)}</span></td>
                      <td>
                        {d.cap === 0 ? <Chip kode="serious" label="Belum didukung" /> : d.ln > 0 && d.lengkap === d.ln ? <Chip kode="good" label="Lengkap" /> : <Chip kode="info" label="Sedang diisi" />}
                      </td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHead no="03" eyebrow="Per strategi PTPN Group" judul={`${angka(perStrategi.length)} strategi, ${angka(caps.length)} capability dari DSMK`}>
          <p className="muted">Status setiap baris learning need per strategi. Arsir abu = capability tidak relevan untuk KINRA.</p>
        </SectionHead>
        <div className="card">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }} className="small">
            {URUT_STATUS.map((s) => <span key={s}><span className={`sw st-${s}`} />{STATUS_LABEL[s]}</span>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {perStrategi.map((p) => (
              <div key={p.s}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <div><b>{strategiPendek(p.s)}</b> <span className="muted small">{p.s.split("–")[1]?.trim()}</span></div>
                  <div className="mono small muted tnum">{angka(p.h.lengkap)} lengkap · {angka(p.total)} baris · {angka(p.cap)} capability</div>
                </div>
                <div className="stack" role="img" aria-label={URUT_STATUS.map((s) => `${STATUS_LABEL[s]} ${p.h[s]}`).join(", ")}>
                  {URUT_STATUS.map((s) => p.h[s] > 0 && <i key={s} className={`st-${s}`} style={{ width: `${(p.h[s] / p.total) * 100}%` }} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <div className="card">
            <div className="row">
              <div>
                <h3>Usulan kompetensi yang perlu dipertegas SME</h3>
                <p className="muted small" style={{ margin: "4px 0 0" }}>Rekomendasi DSMK berkekuatan sedang atau lemah dan belum divalidasi.</p>
              </div>
              <span className="mono tnum" style={{ fontSize: 28, fontWeight: 600 }}>{angka(perluPerhatian.length)}</span>
            </div>
            <div className="table-wrap tall" style={{ marginTop: 12, maxHeight: 380 }}>
              <table className="tbl">
                <thead><tr><th>No</th><th>Capability</th><th>Usulan</th><th>Kekuatan</th></tr></thead>
                <tbody>
                  {perluPerhatian.length === 0 && <tr><td colSpan={4} className="muted">Tidak ada usulan yang tertunda.</td></tr>}
                  {perluPerhatian.map((x) => (
                    <tr key={x.l.id}>
                      <td className="num">{x.c.no}</td>
                      <td><Link href={`/matriks?buka=${x.l.id}`} style={{ fontWeight: 600 }}>{x.c.capability}</Link></td>
                      <td className="small">{x.c.kompetensi_usulan}</td>
                      <td><KekuatanChip k={x.c.kekuatan_usulan} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>Key position yang paling sering dipilih</h3>
            <p className="muted small" style={{ margin: "4px 0 0" }}>Jumlah learning need yang menyasar jabatan tersebut.</p>
            {topJabatan.length === 0 ? (
              <p className="muted" style={{ marginTop: 16 }}>Belum ada key position yang dipilih.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                {topJabatan.map(([id, n]) => (
                  <div key={id}>
                    <div className="row small" style={{ marginBottom: 4 }}>
                      <span>{namaJabatan([id], jmap)[0]}</span>
                      <span className="mono tnum">{angka(n)}</span>
                    </div>
                    <div className="track" style={{ height: 6 }}><i style={{ width: `${(n / topJabatan[0][1]) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <h3>Perubahan terbaru</h3>
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="tbl">
              <thead><tr><th>Waktu</th><th>Capability</th><th>Oleh</th><th>Status</th></tr></thead>
              <tbody>
                {terbaru.length === 0 && <tr><td colSpan={4} className="muted">Belum ada perubahan.</td></tr>}
                {terbaru.map((x) => (
                  <tr key={x.l.id}>
                    <td className="mono small tnum" style={{ whiteSpace: "nowrap" }}>{waktu(x.l.updated_at)}</td>
                    <td><Link href={`/matriks?buka=${x.l.id}`}>{x.c.no}. {x.c.capability}</Link></td>
                    <td className="small">{x.l.diubah_oleh ?? <span className="muted">–</span>}</td>
                    <td><StatusChip status={x.s} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
