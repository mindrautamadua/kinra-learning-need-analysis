-- Prioritas bisnis PT KINRA dari RJPP 2026-2030 (DRAFT), Bab III Strategi Utama dan Sasaran Perusahaan
-- serta Bab V Strategic Journey 2027. Dipakai untuk menautkan setiap capability ke prioritas bisnis KINRA
-- (pertanyaan L&D Mission Objectives: "Business priorities apa yang membutuhkan dukungan L&D?").

create table if not exists public.prioritas_rjpp (
  kode text primary key,
  pilar text not null,
  jenis text not null check (jenis in ('pilar_utama', 'enabler', 'inisiatif_2027')),
  nama text not null,
  uraian text,
  urutan integer not null default 0
);
alter table public.prioritas_rjpp enable row level security;

alter table public.capabilities add column if not exists prioritas_rjpp text[] not null default '{}';

insert into public.prioritas_rjpp (kode, pilar, jenis, nama, uraian, urutan) values
  ('P1.1', 'Performance Driven', 'pilar_utama', 'Okupansi Lahan',
   'Optimalisasi lahan eksisting, ekspansi lahan bertahap, sinergi hilirisasi industri, dan kemitraan untuk menarik tenant. Target pemasaran lahan 100 Ha pada 2030.', 11),
  ('P1.2', 'Performance Driven', 'pilar_utama', 'Marketing Strategy (4P)',
   'Strategi product, price, place, dan promotion terintegrasi untuk menarik tenant hilirisasi sawit, karet, dan industri pendukung.', 12),
  ('P1.3', 'Performance Driven', 'pilar_utama', 'Marketing Intelligence',
   'Analisis pasar dan pendekatan geo-ekonomi untuk menentukan sektor sasaran dan wilayah pemasaran paling potensial.', 13),
  ('P1.4', 'Performance Driven', 'pilar_utama', 'Rantai Pasok Terintegrasi',
   'Penetapan target investor, integrasi rantai pasok, dan pengembangan green industrial cluster berbasis ekonomi sirkular.', 14),
  ('P1.5', 'Performance Driven', 'pilar_utama', 'Customer Relationship Management',
   'Sistem CRM terpadu, standar layanan berbasis SLA, dan penguatan hubungan tenant. Target kepuasan tenant minimal 81%.', 15),
  ('P2.1', 'Stability and Growth', 'pilar_utama', 'Penguatan Bisnis Eksisting',
   'Keandalan utilitas (reliability >99%) untuk listrik, air bersih, pengolahan air limbah, tank farm, dan dry port.', 21),
  ('P2.2', 'Stability and Growth', 'pilar_utama', 'Pengembangan dengan Mitra Strategis',
   'Kemitraan PPP, JV, atau BOT untuk pembiayaan dan percepatan ekspansi utilitas serta infrastruktur kawasan (PLTS/PLTBm, tank farm, dry port).', 22),
  ('P2.3', 'Stability and Growth', 'pilar_utama', 'Peningkatan Daya Saing melalui Penerapan IT',
   'Digitalisasi dan otomasi proses bisnis untuk mengurangi proses manual. Roadmap IT ditargetkan hingga 2027.', 23),
  ('P2.4', 'Stability and Growth', 'pilar_utama', 'Utilitas Berbasis Green Energy',
   'Daur ulang limbah cair menjadi air bersih, embung, konservasi air, serta pembangkit energi terbarukan (PLTS, PLTBm).', 24),
  ('P3.1', 'New Business Expansion', 'pilar_utama', 'Peningkatan Jasa Pelayanan',
   'Peningkatan kualitas layanan, pelayanan responsif, dan service excellence kawasan.', 31),
  ('P3.2', 'New Business Expansion', 'pilar_utama', 'New Business Initiatives',
   'Pengembangan fasilitas parkir, perumahan, zona IKM, Standard Factory Building, dan fasilitas MICE.', 32),
  ('P3.3', 'New Business Expansion', 'pilar_utama', 'Mitra Strategis Bisnis Baru',
   'Kolaborasi strategis untuk ekspansi bisnis serta percepatan proyek dan daya saing.', 33),
  ('P3.4', 'New Business Expansion', 'pilar_utama', 'Transformasi Digital',
   'Integrasi teknologi digital, peningkatan efisiensi dan inovasi, serta implementasi digitalisasi sistem.', 34),
  ('E.1', 'Fondasi (Enablers)', 'enabler', 'Branding & Commercial Excellence',
   'Peningkatan branding melalui stakeholder, marketing intelligence, dan word of mouth (getok tular).', 41),
  ('E.2', 'Fondasi (Enablers)', 'enabler', 'Operational Excellence',
   'Cost of good sales, commitment to quality, process excellence, dan new technology.', 42),
  ('E.3', 'Fondasi (Enablers)', 'enabler', 'Financial & Risk Management',
   'Financial structure, selective investment, dan proactive risk mitigation.', 43),
  ('E.4', 'Fondasi (Enablers)', 'enabler', 'Governance & Organization',
   'Business model, subsidiary governance, dan HR structure.', 44),
  ('E.5', 'Fondasi (Enablers)', 'enabler', 'People & Culture',
   'Studi banding, knowledge sharing, talent pool, budaya kerja, dan remunerasi.', 45),
  ('J27.1', 'Performance Driven', 'inisiatif_2027', 'Palm Oil Business Gathering KEK Sei Mangkei',
   'Strategic Journey 2027. Menarik investor hilirisasi sawit dan memperkuat penjualan lahan. Pemilik: Divisi Pemasaran & Penjualan, Divisi Pengembangan.', 51),
  ('J27.2', 'Stability and Growth', 'inisiatif_2027', 'Optimalisasi Operasional WTP bersama Mitra',
   'Strategic Journey 2027. Optimalisasi kapasitas, SLA, digitalisasi monitoring, dan kualitas air bersih. Pemilik: Divisi Produksi Kawasan & Pengembangan.', 52),
  ('J27.3', 'New Business Expansion', 'inisiatif_2027', 'Pengembangan Kawasan IKM',
   'Strategic Journey 2027. Kerja sama pembangunan cluster IKM ±18,3 Ha dengan skema BOT/JV, terintegrasi dengan tenant besar. Pemilik: Divisi Pengembangan.', 53)
on conflict (kode) do update
  set pilar = excluded.pilar, jenis = excluded.jenis, nama = excluded.nama, uraian = excluded.uraian, urutan = excluded.urutan;

notify pgrst, 'reload schema';
