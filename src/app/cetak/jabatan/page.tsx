import { muatMatriks } from "@/lib/data";
import { CetakJabatanClient } from "./cetak-jabatan-client";
import "../cetak.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cetak Matriks Learning Need per Jabatan · KINRA" };

export default async function CetakJabatanPage() {
  const data = await muatMatriks();
  return <CetakJabatanClient data={data} />;
}
