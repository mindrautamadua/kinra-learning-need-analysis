"use client";

import { useActionState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { masuk } from "./actions";

export function FormLogin() {
  const [state, action, pending] = useActionState(masuk, undefined);
  return (
    <form action={action} style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div className="eyebrow">Masuk</div>
        <h2 style={{ marginTop: 8 }}>Kertas Kerja LNA</h2>
        <p className="muted" style={{ marginTop: 6 }}>Gunakan akun workshop yang dibagikan panitia.</p>
      </div>
      <div className="field">
        <label htmlFor="username">Nama pengguna</label>
        <div className="search">
          <UserRound aria-hidden="true" />
          <input id="username" name="username" className="inp input-wrap" autoComplete="username" required autoFocus={!state?.username} defaultValue={state?.username} key={state?.username ?? ""} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="password">Kata sandi</label>
        <div className="search">
          <KeyRound aria-hidden="true" />
          <input id="password" name="password" type="password" className="inp input-wrap" autoComplete="current-password" required autoFocus={!!state?.username} />
        </div>
      </div>
      {state?.error && <p role="alert" className="small" style={{ color: "var(--txt-bad)", margin: 0 }}>{state.error}</p>}
      <button className="btn primary btn-masuk" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</button>
    </form>
  );
}
