import Image from "next/image";
import { FormLogin } from "./form";

export const metadata = { title: "Masuk · KINRA LNA 2027" };

export default function LoginPage() {
  return (
    <div className="login">
      <section className="login-brand" aria-label="KINRA">
        <div className="circles" aria-hidden="true">
          <span style={{ width: 340, height: 340, right: -90, top: -80, background: "var(--jingga)", opacity: 0.9 }} />
          <span style={{ width: 300, height: 300, right: 90, top: 60, background: "var(--merah)", opacity: 0.85 }} />
          <span style={{ width: 280, height: 280, right: -40, top: 230, background: "var(--biru)", opacity: 0.85 }} />
          <span style={{ width: 200, height: 200, right: 160, top: 320, background: "#fff", opacity: 0.16 }} />
        </div>
        <Image src="/brand/kinra-logo-tosca.png" alt="KINRA" width={190} height={81} priority style={{ position: "relative", height: "auto" }} />
        <div style={{ position: "relative", maxWidth: 460 }}>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,.8)" }}>ALNA PTPN Group · Tahun 2027</div>
          <h1 className="hero-title" style={{ marginTop: 12 }}>Dari strategi bisnis ke learning needs</h1>
          <p style={{ marginTop: 14, color: "rgba(255,255,255,.85)" }}>
            Kertas kerja Workshop 3 PT Kawasan Industri Nusantara. Telusuri setiap capability sampai menjadi kebutuhan pembelajaran yang tepat sasaran.
          </p>
        </div>
      </section>
      <section className="login-form">
        <FormLogin />
      </section>
    </div>
  );
}
