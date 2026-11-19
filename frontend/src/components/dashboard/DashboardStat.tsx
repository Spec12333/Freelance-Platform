import type { ReactNode } from "react";

type DashboardStatProps = {
  label: string;
  value: number | string;
  hint: string;
  icon: ReactNode;
  accent?: boolean;
};

// Display one server statistic without inventing a trend or comparison.
export default function DashboardStat({ label, value, hint, icon, accent = false }: DashboardStatProps) {
  return (
    <div className={`card min-w-0 p-5 sm:p-6 ${accent ? "border-brand-200 bg-cream" : ""}`}>
      <dt className="flex items-start justify-between gap-3 text-xs font-semibold text-gray-500"><span>{label}</span><span aria-hidden="true" className="shrink-0 text-brand-700">{icon}</span></dt>
      <dd className="mt-4"><span className="block font-display text-4xl leading-none tracking-tight text-ink [overflow-wrap:anywhere]">{value}</span><span className="mt-3 block text-xs leading-5 text-gray-500">{hint}</span></dd>
    </div>
  );
}
