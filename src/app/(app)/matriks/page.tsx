import { muatSemua } from "@/lib/data";
import { MatriksClient } from "./matriks-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matriks LNA · KINRA" };

export default async function MatriksPage({ searchParams }: { searchParams: Promise<{ buka?: string }> }) {
  const [data, sp] = await Promise.all([muatSemua(), searchParams]);
  return <MatriksClient data={data} bukaAwal={sp.buka} />;
}
