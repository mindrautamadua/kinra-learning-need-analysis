"use client";

import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

const KUNCI = "kinra_lna_pengisi";

/** Nama pengisi disimpan per perangkat karena akun login dipakai bersama. */
export function bacaPengisi() {
  try {
    return localStorage.getItem(KUNCI) ?? "";
  } catch {
    return "";
  }
}

export function NamaPengisi() {
  const [nama, setNama] = useState("");
  useEffect(() => setNama(bacaPengisi()), []);
  return (
    <label className="search hide-sm" style={{ width: 230 }} title="Nama Anda dicatat pada setiap perubahan">
      <UserRound aria-hidden="true" />
      <input
        className="inp"
        placeholder="Nama pengisi (mis. SME Pemasaran)"
        value={nama}
        aria-label="Nama pengisi"
        onChange={(e) => {
          setNama(e.target.value);
          try {
            localStorage.setItem(KUNCI, e.target.value);
          } catch {}
        }}
      />
    </label>
  );
}
