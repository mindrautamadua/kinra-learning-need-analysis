import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { COOKIE_SESI, tokenValid } from "../auth";

let client: SupabaseClient | null = null;

/** Klien database server-side (service role). Tidak pernah dikirim ke browser. */
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local");
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Wajib dipanggil di setiap server action: middleware tidak melindungi pemanggilan action langsung. */
export async function wajibLogin() {
  const token = (await cookies()).get(COOKIE_SESI)?.value;
  if (!(await tokenValid(token))) throw new Error("Sesi berakhir. Silakan masuk kembali.");
}
