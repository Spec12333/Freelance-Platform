import type { ReactNode } from "react";
import { ShieldIcon } from "@/components/ui/icons";

type AdminHeaderProps = { title: string; description: string; total?: number; totalLabel: string; action?: ReactNode };

// Shared administration introduction; counts come from the current API query.
export default function AdminHeader({ title, description, total, totalLabel, action }: AdminHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-7 rounded-3xl bg-brand-950 p-7 text-white sm:p-10 lg:flex-row lg:items-end">
      <div className="min-w-0 max-w-2xl"><p className="eyebrow flex items-center gap-2 text-lime"><ShieldIcon className="size-4" />Administration workspace</p><h1 className="mt-5 font-display text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1><p className="mt-4 max-w-lg text-sm leading-7 text-white/65">{description}</p></div>
      <div className="flex shrink-0 flex-col items-start gap-5 lg:items-end">{total !== undefined && <div><p className="font-display text-4xl tracking-tight text-lime">{total}</p><p className="mt-2 text-xs text-white/65">{totalLabel}</p></div>}{action}</div>
    </header>
  );
}
