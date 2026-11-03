import { muatMatriks } from "@/lib/data";
import { RekapClient } from "./rekap-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rekap Learning Needs · KINRA" };

export default async function RekapPage() {
  return <RekapClient data={await muatMatriks()} />;
}
