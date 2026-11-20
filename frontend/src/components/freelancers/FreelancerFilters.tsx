import type { FreelancerFilters as Filters } from "@/types/api";
import { ChevronDownIcon, CloseIcon, RefreshIcon, SearchIcon } from "@/components/ui/icons";

type FreelancerFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  searchError: string;
  skill: string;
  onSkillChange: (value: string) => void;
  minRate: string;
  maxRate: string;
  onMinRateChange: (value: string) => void;
  onMaxRateChange: (value: string) => void;
  onApply: () => void;
  skillError: string;
  rateError: string;
  sort: NonNullable<Filters["sort"]>;
  onSortChange: (value: string) => void;
  appliedSearch: string;
  appliedSkill: string;
  rateLabel?: string;
  onClearSearch: () => void;
  onClearSkill: () => void;
  onClearRate: () => void;
  onReset: () => void;
};

// Present editable drafts; the page owns URL updates, debounce and requests.
export default function FreelancerFilters(props: FreelancerFiltersProps) {
  const hasFilters = Boolean(props.search || props.skill || props.minRate || props.maxRate || props.sort !== "rating");
  const chipClass = "inline-flex max-w-full items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800 outline-none transition hover:bg-brand-100 focus-visible:ring-4 focus-visible:ring-brand-600/20";

  return (
    <section aria-label="Search and filter freelancers" className="card p-5 sm:p-7">
      {/* 1. Search names; Enter applies immediately. */}
      <form role="search" onSubmit={(event) => { event.preventDefault(); props.onSearchSubmit(); }}>
        <label htmlFor="freelancers-search" className="sr-only">Search freelancers by name</label>
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-gray-200 bg-paper p-2 transition focus-within:border-brand-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-600/10 sm:flex-nowrap">
          <SearchIcon className="ml-2 size-5 shrink-0 text-gray-400 sm:ml-3" />
          <input id="freelancers-search" type="search" value={props.search} maxLength={100} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Search freelancers by name…" aria-invalid={!!props.searchError} aria-describedby={props.searchError ? "freelancers-search-error" : undefined} className="h-11 min-w-0 flex-1 border-0 bg-transparent pr-1 text-sm text-ink outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:appearance-none" />
          {props.search && <button type="button" aria-label="Clear name search" onClick={props.onClearSearch} className="grid size-9 shrink-0 place-items-center rounded-full text-gray-400 outline-none hover:bg-gray-200 focus-visible:ring-4 focus-visible:ring-brand-600/20"><CloseIcon className="size-4" /></button>}
          <button type="submit" className="btn btn-primary w-full shrink-0 sm:w-auto sm:px-7">Find your people<SearchIcon className="size-4" /></button>
        </div>
        {props.searchError && <p id="freelancers-search-error" role="alert" className="field-error">{props.searchError}</p>}
      </form>

      {/* 2. Skill and rate drafts apply together, never on each keystroke. */}
      <form noValidate onSubmit={(event) => { event.preventDefault(); props.onApply(); }} className="mt-6 border-t border-gray-200 pt-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0"><label htmlFor="freelancers-skill" className="field-label">Skill</label><input id="freelancers-skill" value={props.skill} onChange={(event) => props.onSkillChange(event.target.value)} maxLength={30} placeholder="e.g. react" className="input" aria-invalid={!!props.skillError} aria-describedby={`freelancers-skill-hint${props.skillError ? " freelancers-skill-error" : ""}`} /><p id="freelancers-skill-hint" className="field-hint text-xs">Matches one listed skill exactly.</p>{props.skillError && <p id="freelancers-skill-error" role="alert" className="field-error">{props.skillError}</p>}</div>
          <div className="min-w-0"><label htmlFor="freelancers-min-rate" className="field-label">Minimum / hr</label><div className="relative"><span aria-hidden="true" className="input-icon text-sm">$</span><input id="freelancers-min-rate" type="text" inputMode="numeric" autoComplete="off" value={props.minRate} onChange={(event) => props.onMinRateChange(event.target.value)} placeholder="No minimum" className="input pl-9" aria-invalid={!!props.rateError} aria-describedby={props.rateError ? "freelancers-rate-error" : undefined} /></div></div>
          <div className="min-w-0"><label htmlFor="freelancers-max-rate" className="field-label">Maximum / hr</label><div className="relative"><span aria-hidden="true" className="input-icon text-sm">$</span><input id="freelancers-max-rate" type="text" inputMode="numeric" autoComplete="off" value={props.maxRate} onChange={(event) => props.onMaxRateChange(event.target.value)} placeholder="No maximum" className="input pl-9" aria-invalid={!!props.rateError} aria-describedby={props.rateError ? "freelancers-rate-error" : undefined} /></div></div>
          <button type="submit" className="btn btn-secondary sm:mt-7 lg:mt-7">Apply filters</button>
        </div>
        {props.rateError && <p id="freelancers-rate-error" role="alert" className="field-error">{props.rateError}</p>}
      </form>

      {/* 3. Sorting is applied immediately. */}
      <div className="mt-5 flex flex-col justify-between gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-3"><label htmlFor="freelancers-sort" className="shrink-0 text-xs font-semibold text-gray-500">Sort by</label><div className="relative min-w-0 flex-1 sm:flex-none"><select id="freelancers-sort" value={props.sort} onChange={(event) => props.onSortChange(event.target.value)} className="input h-10 w-full pr-10 text-sm sm:w-52"><option value="rating">Highest rated</option><option value="rate">Lowest hourly rate</option></select><ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400" /></div></div>
        <button type="button" onClick={props.onReset} disabled={!hasFilters && !props.appliedSearch && !props.appliedSkill && !props.rateLabel} className="btn btn-ghost btn-sm text-gray-500"><RefreshIcon className="size-4" />Reset all</button>
      </div>

      {(props.appliedSearch || props.appliedSkill || props.rateLabel) && <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4"><span className="mr-1 text-xs text-gray-400">Selected</span>{props.appliedSearch && <button type="button" onClick={props.onClearSearch} aria-label="Remove name filter" className={chipClass}><span className="min-w-0 [overflow-wrap:anywhere]">Name: {props.appliedSearch}</span><CloseIcon className="size-3.5 shrink-0" /></button>}{props.appliedSkill && <button type="button" onClick={props.onClearSkill} aria-label="Remove skill filter" className={chipClass}><span className="min-w-0 [overflow-wrap:anywhere]">Skill: {props.appliedSkill}</span><CloseIcon className="size-3.5 shrink-0" /></button>}{props.rateLabel && <button type="button" onClick={props.onClearRate} aria-label="Remove rate filter" className={chipClass}><span className="min-w-0 [overflow-wrap:anywhere]">{props.rateLabel}</span><CloseIcon className="size-3.5 shrink-0" /></button>}</div>}
    </section>
  );
}
