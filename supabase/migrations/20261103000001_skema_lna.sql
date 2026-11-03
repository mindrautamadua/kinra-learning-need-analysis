-- Skema aplikasi Learning Need Analysis (ALNA 2027) PT KINRA
-- Rantai: Business Strategy > Strategic Initiative > Required Capability > Key Position
--         > Competency > Expected Role > Gap > Learning Need
--
-- Akses: aplikasi memakai login hardcoded dan mengakses database HANYA dari server
-- dengan service role key. RLS aktif tanpa policy, sehingga anon key tidak bisa membaca/menulis.

-- ---------- Referensi ----------
create table if not exists public.kamus_hard (
  id integer primary key,
  area text not null,
  job_function text not null,
  nama text not null
);
create index if not exists kamus_hard_nama_idx on public.kamus_hard (nama);

create table if not exists public.kamus_leadership (
  id integer primary key,
  nama text not null
);

-- Nomenklatur jabatan PT KINRA (sheet "Copy of PT KINRA")
create table if not exists public.jabatan (
  id integer primary key,
  kode text,
  nama text not null,
  level text not null,
  direktorat text,
  divisi text
);

-- ---------- Matriks ----------
-- Kolom C–E (diisi DSMK) + usulan kompetensi kolom G
create table if not exists public.capabilities (
  id integer primary key,
  no integer not null unique,
  strategi text not null,
  inisiatif text[] not null default '{}',
  capability text not null,
  kompetensi_usulan text,
  kekuatan_usulan text not null default 'kuat' check (kekuatan_usulan in ('kuat', 'sedang', 'lemah')),
  -- keputusan workshop: apakah capability relevan untuk bisnis kawasan industri KINRA (null = belum diputuskan)
  relevan boolean,
  catatan_relevansi text,
  diubah_oleh text,
  updated_at timestamptz not null default now()
);

-- Kolom F–J (diisi SDM & SME). Satu baris = satu learning need.
create table if not exists public.learning_needs (
  id uuid primary key default gen_random_uuid(),
  capability_id integer not null references public.capabilities (id) on delete cascade,
  urutan integer not null default 1,
  jabatan_ids integer[] not null default '{}',
  posisi_lain text,
  kompetensi text,
  sumber_kompetensi text check (sumber_kompetensi in ('hard', 'leadership', 'usulan')),
  kompetensi_divalidasi boolean not null default false,
  expected_role text,
  gap text,
  sebab_gap text check (sebab_gap in ('kompetensi', 'non_kompetensi')),
  intervensi_non_pelatihan text,
  learning_need text,
  catatan text,
  -- nama pengisi diketik peserta (akun login dipakai bersama)
  diubah_oleh text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learning_needs_capability_idx on public.learning_needs (capability_id, urutan);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists capabilities_updated_at on public.capabilities;
create trigger capabilities_updated_at before update on public.capabilities
  for each row execute function public.set_updated_at();
drop trigger if exists learning_needs_updated_at on public.learning_needs;
create trigger learning_needs_updated_at before update on public.learning_needs
  for each row execute function public.set_updated_at();

-- ---------- RLS: aktif tanpa policy (hanya service role yang bisa akses) ----------
alter table public.kamus_hard enable row level security;
alter table public.kamus_leadership enable row level security;
alter table public.jabatan enable row level security;
alter table public.capabilities enable row level security;
alter table public.learning_needs enable row level security;
