import { CircleCheck, CircleDot, CircleX, Info, TriangleAlert, TrendingDown } from "lucide-react";
import type { Kekuatan } from "@/lib/types";
import { KEKUATAN_LABEL, STATUS_LABEL, type Status } from "@/lib/domain";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Kode = "good" | "warn" | "serious" | "crit" | "na" | "info" | "brand";
const IKON: Record<Kode, React.ElementType> = {
  good: CircleCheck, warn: TriangleAlert, serious: TrendingDown, crit: CircleX, na: CircleDot, info: Info, brand: Info,
};

export function Chip({ kode, label, title }: { kode: Kode; label: string; title?: string }) {
  const Ikon = IKON[kode];
  return (
    <span className={cx("chip", kode)} title={title}>
      <Ikon aria-hidden="true" />
      {label}
    </span>
  );
}

const STATUS_KODE: Record<Status, Kode> = { lengkap: "good", sebagian: "warn", belum: "na", tidak_relevan: "na" };
export function StatusChip({ status }: { status: Status }) {
  return <Chip kode={STATUS_KODE[status]} label={STATUS_LABEL[status]} />;
}

const KEKUATAN_KODE: Record<Kekuatan, Kode> = { kuat: "good", sedang: "warn", lemah: "crit" };
const KEKUATAN_PENDEK: Record<Kekuatan, string> = { kuat: "Kuat", sedang: "Sedang", lemah: "Lemah" };
export function KekuatanChip({ k }: { k: Kekuatan }) {
  return <Chip kode={KEKUATAN_KODE[k]} label={KEKUATAN_PENDEK[k]} title={KEKUATAN_LABEL[k]} />;
}

export function SectionHead({ no, eyebrow, judul, children }: { no: string; eyebrow: string; judul: string; children?: React.ReactNode }) {
  return (
    <header className="section-head">
      <div className="eyebrow"><b>{no}</b><span>{eyebrow}</span></div>
      <h2>{judul}</h2>
      {children}
    </header>
  );
}
