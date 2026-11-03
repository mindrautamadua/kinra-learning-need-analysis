import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plex = IBM_Plex_Mono({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "KINRA · Learning Need Analysis 2027",
  description: "Kertas kerja Workshop 3 ALNA 2027 PT Kawasan Industri Nusantara: dari strategi bisnis ke learning needs.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Tema pilihan pengguna dipasang di server agar tidak berkedip; tanpa cookie ikut prefers-color-scheme.
  const tema = (await cookies()).get("kinra_tema")?.value;
  return (
    <html lang="id" data-theme={tema === "light" || tema === "dark" ? tema : undefined} suppressHydrationWarning>
      <body className={`${nunito.variable} ${plex.variable}`}>
        <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
        {children}
      </body>
    </html>
  );
}
