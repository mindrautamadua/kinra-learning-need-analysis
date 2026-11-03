import { SectionHead } from "@/components/ui";

export const metadata = { title: "Pedoman Pengisian · KINRA" };

const RANTAI = ["Business Strategy", "Strategic Initiative", "Required Capability", "Key Position", "Competency", "Expected Role", "Gap", "Learning Need"];

const KOLOM = [
  ["C", "Business Strategy / Strategic Priority", "DSMK", "Ambil dari strategic house atau pernyataan top management. Apa prioritas strategis yang sedang dikejar perusahaan?"],
  ["D", "Strategic Initiative", "DSMK", "Inisiatif konkret yang menjalankan strategi. Program atau proyek apa yang dijalankan tahun ini?"],
  ["E", "Required Capabilities", "DSMK", "Kemampuan organisasi, bukan individu. Kalau inisiatif ini mau berhasil, organisasi harus mampu melakukan apa? Satu capability per baris."],
  ["F", "Key Position / Target Population", "SDM & SME", "Jabatan yang paling menentukan keberhasilan capability. Nama jabatan, bukan nama orang atau unit kerja. Lengkapi level jabatan; boleh lebih dari satu."],
  ["G", "Competency", "Bersama", "Pilih dari Kamus Hard Competency atau Kamus Leadership. Bila belum ada padanannya, tulis usulan kompetensi baru. SME memvalidasi usulan DSMK."],
  ["H", "Expected Role / Performance", "SDM & SME", "Kinerja yang diharapkan bila kompetensi dikuasai. Tulis sebagai perilaku teramati: kata kerja + objek + hasil."],
  ["I", "Gap Competency", "SDM & SME", "Selisih kondisi saat ini dan Expected Role. Sebutkan penyebabnya: kurang pengetahuan/keterampilan, atau sebab non-kompetensi (sistem, data, SOP, struktur)."],
  ["J", "Learning Need", "SDM & SME", 'Topik + populasi target + cakupan materi. Isi hanya bila gap disebabkan kompetensi. Bila tidak, tulis "non-pelatihan" beserta intervensi yang disarankan.'],
];

const CHECKLIST = [
  "Setiap Learning Need dapat ditelusuri mundur ke Gap, Expected Role, Competency, Capability, Strategic Initiative, dan Business Strategy.",
  'Gap bersebab non-kompetensi tidak dipaksakan menjadi pelatihan; sudah ditandai "non-pelatihan".',
  "Isian competency sudah divalidasi oleh SME.",
  "Nama jabatan pada kolom Key Position memakai nomenklatur resmi perusahaan.",
];

export default function Pedoman() {
  return (
    <>
      <section className="section">
        <SectionHead no="05" eyebrow="Pedoman pengisian" judul="Delapan mata rantai dari strategi bisnis ke learning need">
          <p className="muted">Ringkasan tab Pedoman Pengisian pada Kertas Kerja Workshop 3. Satu baris = satu learning need; bila satu capability melahirkan beberapa kebutuhan, gunakan tombol Tambah LN di editor.</p>
        </SectionHead>
        <div className="card">
          <div className="chain" style={{ fontSize: 14 }}>
            {RANTAI.map((r, i) => (
              <span key={r} style={{ display: "contents" }}>
                <span className={i < 3 ? "chip brand" : "chip info"} style={{ height: 28, fontSize: 13 }}>{r}</span>
                {i < RANTAI.length - 1 && <span className="sep" aria-hidden="true">›</span>}
              </span>
            ))}
          </div>
          <p className="muted small" style={{ margin: "12px 0 0" }}>Tosca = diisi DSMK (kolom C–E). Biru = diisi SDM & SME bersama (kolom F–J).</p>
          <p className="small" style={{ margin: "10px 0 0" }}>
            <b>Tambahan untuk KINRA:</b> kolom C–E berasal dari strategi PTPN Group (5 pilar Go). Sebelum mengisi kolom F, tautkan setiap capability ke
            prioritas bisnis KINRA dalam RJPP 2026–2030 agar learning need dapat ditelusuri ke strategi KINRA sendiri. Capability yang tidak mendukung
            prioritas RJPP mana pun biasanya kandidat &quot;tidak relevan&quot;.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <h3>Panduan per kolom</h3>
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="tbl">
              <thead><tr><th>Kolom</th><th>Nama</th><th>Pengisi</th><th>Cara mengisi</th></tr></thead>
              <tbody>
                {KOLOM.map(([k, n, p, c]) => (
                  <tr key={k}><td className="mono">{k}</td><td style={{ fontWeight: 600, minWidth: 180 }}>{n}</td><td className="small" style={{ whiteSpace: "nowrap" }}>{p}</td><td className="small">{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <div className="card">
            <h3>Kode warna usulan kompetensi (kolom G)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }} className="small">
              <div><span className="chip good">Kuat</span> Nama dan cakupan kompetensi di kamus sejalan dengan capability.</div>
              <div><span className="chip warn">Sedang</span> Hanya menutup sebagian cakupan capability; perlu dipertegas SME.</div>
              <div><span className="chip crit">Lemah</span> Kamus belum memiliki kompetensi yang menutup capability; SME perlu mengusulkan kompetensi baru.</div>
            </div>
          </div>
          <div className="card">
            <h3>Checklist sebelum dikumpulkan</h3>
            <ol style={{ margin: "12px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }} className="small">
              {CHECKLIST.map((c) => <li key={c}>{c}</li>)}
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <h3>Contoh baris (dari kertas kerja)</h3>
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="tbl" style={{ minWidth: 900 }}>
              <thead><tr><th>Strategi</th><th>Capability</th><th>Key Position</th><th>Competency</th><th>Expected Role</th><th>Gap</th><th>Learning Need</th></tr></thead>
              <tbody>
                <tr className="small">
                  <td>Go Lean – Operational Excellence</td>
                  <td>Advanced Analytics, Modelling & Decision Support</td>
                  <td>Asisten Kebun (BOD-3)</td>
                  <td>Data Interpretation</td>
                  <td>Menggunakan data monitoring operasional untuk mengidentifikasi deviasi, menentukan corrective action, dan memantau tindak lanjutnya</td>
                  <td>Belum terbiasa membaca data dashboard monitoring untuk mendeteksi deviasi dan menetapkan corrective action</td>
                  <td>Pelatihan interpretasi data monitoring operasional kebun bagi Asisten Kebun, mencakup pembacaan deviasi, penentuan corrective action, dan pemantauan tindak lanjut</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
