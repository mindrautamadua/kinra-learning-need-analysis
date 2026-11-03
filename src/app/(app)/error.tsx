"use client";

import { DatabaseZap } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Di produksi Next.js menyembunyikan pesan asli, jadi deteksi hanya berlaku saat development.
  const belumSetup = /schema cache|does not exist|PGRST205/i.test(error.message);
  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span className="icon-box"><DatabaseZap size={16} aria-hidden="true" /></span>
        <h3 style={{ fontSize: 18 }}>{belumSetup ? "Database belum disiapkan" : "Data gagal dimuat"}</h3>
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        {belumSetup
          ? "Tabel aplikasi belum ada di Supabase. Jalankan seluruh isi file supabase/setup-lengkap.sql di Supabase Dashboard > SQL Editor, lalu muat ulang halaman ini."
          : "Kemungkinan penyebab: tabel belum dibuat (jalankan supabase/setup-lengkap.sql di SQL Editor Supabase), atau SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY di .env.local belum benar."}
      </p>
      <p className="mono small muted" style={{ marginTop: 8 }}>{error.message || `Kode: ${error.digest}`}</p>
      <button className="btn primary" style={{ marginTop: 12 }} onClick={reset}>Coba lagi</button>
    </div>
  );
}
