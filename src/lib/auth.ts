// Login tunggal hardcoded untuk aplikasi sementara (workshop ALNA 2027).
// Nilai default bisa ditimpa lewat env APP_USERNAME / APP_PASSWORD / APP_SESSION_SECRET.
// Dipakai di middleware (edge) dan server, jadi hanya memakai Web Crypto.

export const AKUN = {
  username: process.env.APP_USERNAME ?? "kinra",
  password: process.env.APP_PASSWORD ?? "LNA-Kinra2027",
};

const SECRET = process.env.APP_SESSION_SECRET ?? "kinra-lna-2027-ganti-rahasia-ini-bila-perlu";
export const COOKIE_SESI = "kinra_lna_sesi";
export const UMUR_SESI_DETIK = 60 * 60 * 12; // 12 jam

const enc = new TextEncoder();

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function samaPersis(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function cekKredensial(username: string, password: string) {
  return samaPersis(username.trim(), AKUN.username) && samaPersis(password, AKUN.password);
}

/** Token sesi: "<kedaluwarsa-epoch>.<hmac>" */
export async function buatToken() {
  const exp = String(Math.floor(Date.now() / 1000) + UMUR_SESI_DETIK);
  return `${exp}.${await hmac(exp)}`;
}

export async function tokenValid(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return samaPersis(sig, await hmac(exp));
}
