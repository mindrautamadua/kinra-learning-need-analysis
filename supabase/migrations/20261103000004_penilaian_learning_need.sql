-- Penilaian per learning need agar formulir cetak Matriks LNA terisi penuh dari aplikasi (tanpa isian tangan):
-- jumlah peserta, level kemahiran (dibutuhkan vs saat ini, skala 1-5), prioritas R x K x U (skala 1-3),
-- metode 70:20:10, target triwulan pelaksanaan, dan PIC. Gap level dan skor prioritas dihitung di aplikasi.

alter table public.learning_needs
  add column if not exists jumlah_peserta integer check (jumlah_peserta is null or jumlah_peserta between 0 and 100000),
  add column if not exists level_dibutuhkan smallint check (level_dibutuhkan is null or level_dibutuhkan between 1 and 5),
  add column if not exists level_saat_ini smallint check (level_saat_ini is null or level_saat_ini between 1 and 5),
  add column if not exists skor_relevansi smallint check (skor_relevansi is null or skor_relevansi between 1 and 3),
  add column if not exists skor_kritikalitas smallint check (skor_kritikalitas is null or skor_kritikalitas between 1 and 3),
  add column if not exists skor_urgensi smallint check (skor_urgensi is null or skor_urgensi between 1 and 3),
  add column if not exists metode text[] not null default '{}' check (metode <@ array['pengalaman', 'sosial', 'formal']::text[]),
  add column if not exists target_tw smallint check (target_tw is null or target_tw between 1 and 4),
  add column if not exists pic text;
