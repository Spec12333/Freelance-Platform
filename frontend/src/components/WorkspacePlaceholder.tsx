import { Link } from "react-router-dom";
import { ArrowUpRightIcon, BriefcaseIcon, LayersIcon } from "./ui/icons";

type WorkspacePlaceholderProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

// Give unfinished sections a clear, honest state and a working next action.
export default function WorkspacePlaceholder({ title, description, eyebrow = "Your workspace" }: WorkspacePlaceholderProps) {
  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-brand-950 p-7 text-white sm:p-12">
        <p className="eyebrow text-lime">{eyebrow}</p>
        <h1 className="relative mt-5 max-w-2xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-white/65">{description}</p>
        <LayersIcon aria-hidden="true" className="absolute -right-8 bottom-5 hidden size-44 text-white/5 sm:block" />
      </header>
      <section className="card flex flex-col items-center px-6 py-14 text-center sm:py-20">
        <span aria-hidden="true" className="mb-6 grid size-16 place-items-center rounded-full bg-cream text-brand-700"><BriefcaseIcon className="size-7" /></span>
        <p className="eyebrow text-brand-700">Coming soon</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-ink">More room to do great work.</h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-gray-500">This section is on its way. In the meantime, explore projects and keep your conversations moving.</p>
        <Link to="/orders" className="btn btn-primary mt-7">Explore projects<ArrowUpRightIcon className="size-4" /></Link>
      </section>
    </div>
  );
}
