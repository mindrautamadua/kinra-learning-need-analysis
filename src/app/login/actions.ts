"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buatToken, cekKredensial, COOKIE_SESI, UMUR_SESI_DETIK } from "@/lib/auth";

export async function masuk(_prev: { error?: string; username?: string } | undefined, form: FormData) {
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  if (!cekKredensial(username, password)) {
    await new Promise((r) => setTimeout(r, 600)); // perlambat tebakan kata sandi
    return { error: "Nama pengguna atau kata sandi salah.", username };
  }
  (await cookies()).set(COOKIE_SESI, await buatToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_SESI_DETIK,
  });
  redirect("/");
}

export async function keluar() {
  (await cookies()).delete(COOKIE_SESI);
  redirect("/login");
}
