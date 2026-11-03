# KINRA · Learning Need Analysis 2027

Aplikasi sementara untuk menyelesaikan pengisian **Kertas Kerja Workshop 3 ALNA 2027 PT KINRA**
(matriks dari strategi bisnis ke learning needs). Next.js 15 + Supabase, gaya visual mengikuti `panduan-ui-ux-kinra.md`.

## Menyiapkan database (sekali)

1. Buka Supabase Dashboard project `fpyzstskcbxtzjbcqctg` > **SQL Editor**.
2. Tempel seluruh isi `supabase/setup-lengkap.sql`, lalu **Run**.
   Isinya: skema tabel + data awal dari Excel (84 capability, 756 kompetensi teknis, 8 kompetensi leadership, 85 jabatan KINRA).
   File ini aman dijalankan ulang; isian learning need yang sudah ada tidak tertimpa.
3. Bila database sudah pernah disiapkan, cukup jalankan migrasi yang baru, misalnya
   `supabase/migrations/20261103000003_prioritas_rjpp.sql` (prioritas RJPP KINRA) dan
   `supabase/migrations/20261103000004_penilaian_learning_need.sql` (jumlah peserta, level kemahiran, prioritas R×K×U, metode 70:20:10, target TW, PIC).

## Menjalankan

```bash
cp .env.example .env.local   # isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev                  # http://localhost:3000
```

## Login

Satu akun bersama, hardcoded di `src/lib/auth.ts`:

| Nama pengguna | Kata sandi |
|---|---|
| `kinra` | `LNA-Kinra2027` |

Bisa ditimpa lewat env `APP_USERNAME`, `APP_PASSWORD`, dan `APP_SESSION_SECRET`.
Karena akun dipakai bersama, peserta mengetik nama di kolom "Nama pengisi" pada topbar; nama itu dicatat pada setiap perubahan.

## Keamanan data

- Database hanya diakses dari server memakai service role key. Key tidak pernah dikirim ke browser.
- RLS aktif tanpa policy, jadi anon key project tidak bisa membaca atau menulis tabel.
- Setiap server action memeriksa cookie sesi bertanda tangan HMAC (berlaku 12 jam).

## Fitur

- **Prioritas RJPP KINRA**: setiap capability ditautkan ke pilar utama, fondasi enablers, atau Strategic Journey 2027 dari RJPP 2026–2030.
  Ringkasan menandai prioritas yang belum didukung capability mana pun.
- **Ringkasan**: progres per strategi, usulan kompetensi yang perlu dipertegas SME, key position terbanyak, perubahan terbaru.
- **Matriks LNA**: formulir berbentuk lembar kerja seperti tab "Matriks Strategi-Kebutuhan" di Excel (kolom B–J, header DSMK dan SDM & SME,
  petunjuk kolom, baris CONTOH, sel gabungan per strategi). Sel teks tersimpan otomatis saat pindah sel; Key Position, Competency,
  dan Prioritas RJPP dipilih lewat popover. Tombol detail per baris membuka editor lengkap. Editor per baris mengikuti urutan kolom F–J,
  keputusan relevansi capability untuk KINRA, pemilih jabatan dari nomenklatur, pemilih kompetensi dari kamus,
  aturan "non-pelatihan", checklist pedoman, tambah/duplikat/hapus learning need.
- **Rekap**: klaster learning need per kompetensi atau strategi (bahan tahap Learning Priorities) dan daftar intervensi non-pelatihan.
- **Cetak formulir** (`/cetak`): formulir Matriks LNA A3/A4 landscape dengan kontrol dokumen, keterangan skala, 20 kolom bernomor,
  dan blok pengesahan. Semua kolom berasal dari aplikasi; sel "–" berarti belum diisi.
- **Ekspor Excel** dengan susunan kolom B–J seperti kertas kerja asli.

## Membangkitkan ulang seed dari Excel

```bash
python3 -I scripts/generate_seed.py
```
