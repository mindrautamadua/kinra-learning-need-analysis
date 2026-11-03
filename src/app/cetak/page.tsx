import { muatMatriks } from "@/lib/data";
import { CetakClient } from "./cetak-client";
import "./cetak.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cetak Formulir Matriks LNA · KINRA" };

export default async function CetakPage() {
  const data = await muatMatriks();
  return <CetakClient data={data} />;
}
