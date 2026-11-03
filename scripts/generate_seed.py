"""Bangun supabase/migrations/..._seed_kertas_kerja.sql dari Kertas Kerja Workshop 3 (xlsx).

Jalankan: python3 -I scripts/generate_seed.py
"""
import pathlib
import openpyxl

ROOT = pathlib.Path(__file__).resolve().parent.parent
XLSX = ROOT / "sumber-data" / "Kertas Kerja Workshop 3_PT Kawasan Industri Nusantara (PT KIN).xlsx"
OUT = ROOT / "supabase" / "migrations" / "20261103000002_seed_kertas_kerja.sql"
WARNA = {"FF000000": "kuat", "FF9C5700": "sedang", "FFC00000": "lemah"}


def q(v):
    if v is None:
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


def arr(items):
    return "array[" + ", ".join(q(i) for i in items) + "]::text[]" if items else "'{}'::text[]"


def clean(s):
    return " ".join(str(s).split()).strip() if s is not None else None


wb = openpyxl.load_workbook(XLSX)
sql = ["-- Dibangkitkan oleh scripts/generate_seed.py dari Kertas Kerja Workshop 3. Jangan diedit manual.", "begin;"]

# Kamus Hard Competency
ws = wb["Kamus Hard Competency"]
kamus = [r for r in ws.iter_rows(min_row=2, values_only=True) if r[3]]
nama_hard = {clean(r[3]).lower() for r in kamus}
sql.append("insert into public.kamus_hard (id, area, job_function, nama) values")
sql.append(",\n".join(f"({int(r[0])}, {q(clean(r[1]))}, {q(clean(r[2]))}, {q(clean(r[3]))})" for r in kamus))
sql.append("on conflict (id) do update set area = excluded.area, job_function = excluded.job_function, nama = excluded.nama;")

# Kamus Leadership
ws = wb["Kamus Leadership"]
lead = [r for r in ws.iter_rows(min_row=2, values_only=True) if r[1]]
nama_lead = {clean(r[1]).lower() for r in lead}
sql.append("insert into public.kamus_leadership (id, nama) values")
sql.append(",\n".join(f"({int(r[0])}, {q(clean(r[1]))})" for r in lead))
sql.append("on conflict (id) do update set nama = excluded.nama;")

# Nomenklatur jabatan
ws = wb["Copy of PT KINRA"]
kode = {}
for r in range(97, ws.max_row + 1):
    c, d = ws.cell(r, 3).value, ws.cell(r, 4).value
    if c and d and str(d).startswith("KIN."):
        kode[clean(c)] = clean(d)
jabatan, seen, direktorat, divisi = [], set(), None, None
for r in range(5, 96):
    b, c, d = ws.cell(r, 2).value, ws.cell(r, 3).value, ws.cell(r, 4).value
    if b:
        b = clean(b)
        if b.startswith("DIREKTORAT"):
            direktorat, divisi = b, None
        else:
            divisi = b
    if c and d and str(d).replace(" ", "").startswith("BOD"):
        nama, level = clean(c), str(d).replace(" ", "")
        if (nama, level) in seen:
            continue
        seen.add((nama, level))
        jabatan.append((kode.get(nama), nama, level, direktorat or "BOARD OF DIRECTORS", divisi or direktorat or "BOARD OF DIRECTORS"))
sql.append("insert into public.jabatan (id, kode, nama, level, direktorat, divisi) values")
sql.append(",\n".join(f"({i}, {q(k)}, {q(n)}, {q(l)}, {q(dr)}, {q(dv)})" for i, (k, n, l, dr, dv) in enumerate(jabatan, 1)))
sql.append("on conflict (id) do update set kode = excluded.kode, nama = excluded.nama, level = excluded.level, direktorat = excluded.direktorat, divisi = excluded.divisi;")

# Matriks: baris 8 dst (baris 7 = contoh)
ws = wb["Matriks Strategi-Kebutuhan"]
caps = []
for r in range(8, ws.max_row + 1):
    no = ws.cell(r, 2).value
    if no is None:
        continue
    font = ws[f"G{r}"].font
    warna = font.color.rgb if font.color is not None and font.color.type == "rgb" else None
    inisiatif = [clean(s.lstrip("•")) for s in str(ws.cell(r, 4).value).split("\n") if s.strip()]
    komp = clean(ws.cell(r, 7).value).rstrip(":").strip()
    caps.append((int(no), clean(ws.cell(r, 3).value), inisiatif, clean(ws.cell(r, 5).value), komp, WARNA.get(warna, "kuat")))
sql.append("insert into public.capabilities (id, no, strategi, inisiatif, capability, kompetensi_usulan, kekuatan_usulan) values")
sql.append(",\n".join(f"({n}, {n}, {q(s)}, {arr(i)}, {q(c)}, {q(k)}, {q(w)})" for n, s, i, c, k, w in caps))
sql.append("on conflict (id) do update set strategi = excluded.strategi, inisiatif = excluded.inisiatif, capability = excluded.capability, kompetensi_usulan = excluded.kompetensi_usulan, kekuatan_usulan = excluded.kekuatan_usulan;")

# Satu baris learning need awal per capability, kompetensi = usulan DSMK (belum divalidasi SME)
sql.append("insert into public.learning_needs (capability_id, urutan, kompetensi, sumber_kompetensi)")
sql.append("select c.id, 1, c.kompetensi_usulan, case")
sql.append("  when exists (select 1 from public.kamus_hard k where lower(k.nama) = lower(c.kompetensi_usulan)) then 'hard'")
sql.append("  when exists (select 1 from public.kamus_leadership k where lower(k.nama) = lower(c.kompetensi_usulan)) then 'leadership'")
sql.append("  else 'usulan' end")
sql.append("from public.capabilities c")
sql.append("where not exists (select 1 from public.learning_needs l where l.capability_id = c.id);")
sql.append("commit;")

OUT.write_text("\n".join(sql) + "\n", encoding="utf-8")
cocok = sum(1 for c in caps if c[4].lower() in nama_hard)
print(f"{len(kamus)} kamus hard, {len(lead)} leadership, {len(jabatan)} jabatan, {len(caps)} capability ({cocok} cocok kamus) -> {OUT.name}")
