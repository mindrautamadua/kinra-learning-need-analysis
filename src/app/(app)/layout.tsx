import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Status sidebar dibaca di server agar tidak berkedip saat halaman dimuat
  const ciut = (await cookies()).get("kinra_sidebar")?.value === "ciut";
  return <AppShell ciutAwal={ciut}>{children}</AppShell>;
}
