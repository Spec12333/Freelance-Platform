import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useFreelancers } from "@/hooks/useFreelancers";
import { getErrorMessage } from "@/api/client";
import { parseRateRange } from "@/utils/rate";
import { formatMoney } from "@/utils/format";
import type { FreelancerFilters as Filters } from "@/types/api";
import FreelancerCard from "@/components/FreelancerCard";
import FreelancerFilters from "@/components/FreelancerFilters";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import { ArrowUpRightIcon, UserIcon } from "@/components/ui/icons";

const PAGE_SIZE = 9;
type FilterChange = Partial<Record<"search" | "skill" | "minRate" | "maxRate" | "sort", string>>;

export default function Freelancers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // 1. Name search: type immediately, apply after 400 ms or Enter.
  const search = (searchParams.get("search") ?? "").trim();
  const [searchInput, setSearchInput] = useState(search);
  const applySearch = useCallback((value: string) => {
    if (value.trim().length > 100) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value.trim()) next.set("search", value.trim());
      else next.delete("search");
      next.set("page", "1");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => { setSearchInput(search); }, [search, location.key]);
  useEffect(() => {
    if (searchInput.trim() === search || searchInput.trim().length > 100) return;
    const timeout = window.setTimeout(() => applySearch(searchInput), 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, location.key, applySearch]);

  // 2. Skill: the API matches one lowercased skill exactly.
  const skillParam = searchParams.get("skill") ?? "";
  const skill = skillParam.trim().toLowerCase();
  const [skillInput, setSkillInput] = useState(skillParam);
  useEffect(() => { setSkillInput(skillParam); }, [skillParam]);

  // 3. Rates: keep editable drafts separate from the applied URL range.
  const minRateParam = searchParams.get("minRate") ?? "";
  const maxRateParam = searchParams.get("maxRate") ?? "";
  const range = parseRateRange(minRateParam, maxRateParam);
  const [minRateInput, setMinRateInput] = useState(minRateParam);
  const [maxRateInput, setMaxRateInput] = useState(maxRateParam);
  const [filterError, setFilterError] = useState("");
  useEffect(() => {
    setMinRateInput(minRateParam);
    setMaxRateInput(maxRateParam);
    setFilterError("");
  }, [minRateParam, maxRateParam]);

  // Include a pending name search when another filter is applied.
  const updateFilters = (changes: FilterChange) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries({ search: searchInput.trim(), ...changes })) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.set("page", "1");
      return next;
    });
  };

  const handleApply = () => {
    const nextSkill = skillInput.trim().toLowerCase();
    const nextRange = parseRateRange(minRateInput, maxRateInput);
    const validationError = nextSkill.length > 30 ? "Use no more than 30 characters for one skill." : nextRange.error;
    setFilterError(validationError);
    if (validationError) return;
    updateFilters({
      skill: nextSkill,
      minRate: nextRange.minRate === undefined ? "" : String(nextRange.minRate),
      maxRate: nextRange.maxRate === undefined ? "" : String(nextRange.maxRate),
    });
    setSkillInput(nextSkill);
    setMinRateInput(nextRange.minRate === undefined ? "" : String(nextRange.minRate));
    setMaxRateInput(nextRange.maxRate === undefined ? "" : String(nextRange.maxRate));
  };

  const handleClearSearch = () => { setSearchInput(""); updateFilters({ search: "" }); };
  const handleClearSkill = () => { setSkillInput(""); setFilterError(""); updateFilters({ skill: "" }); };
  const handleClearRate = () => { setMinRateInput(""); setMaxRateInput(""); setFilterError(""); updateFilters({ minRate: "", maxRate: "" }); };

  // 4. Sorting: only the two API-supported values can reach the server.
  const sortParam = searchParams.get("sort");
  const sort: NonNullable<Filters["sort"]> = sortParam === "rate" ? "rate" : "rating";
  const handleSortChange = (value: string) => updateFilters({ sort: value === "rate" ? "rate" : "" });

  // 5. Pagination: preserve filters and reject invalid/unsafe page offsets.
  const pageParam = searchParams.get("page");
  const parsedPage = Number(pageParam);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    && Number.isSafeInteger((parsedPage - 1) * PAGE_SIZE) ? parsedPage : 1;
  const updatePage = useCallback((nextPage: number, replace = false) => {
    if (!Number.isSafeInteger(nextPage) || nextPage < 1) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(nextPage));
      return next;
    }, { replace });
  }, [setSearchParams]);

  useEffect(() => {
    const invalidPage = pageParam !== null && pageParam !== String(page);
    const invalidSort = sortParam !== null && sortParam !== "rating" && sortParam !== "rate";
    if (!invalidPage && !invalidSort) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (invalidPage) next.set("page", String(page));
      if (invalidSort) next.delete("sort");
      return next;
    }, { replace: true });
  }, [pageParam, page, sortParam, setSearchParams]);

  const appliedSearchError = search.length > 100 ? "Use no more than 100 characters for a name search." : "";
  const appliedSkillError = skill.length > 30 ? "Use no more than 30 characters for one skill." : "";
  const appliedFilterError = appliedSkillError || range.error;
  const urlError = appliedSearchError || appliedFilterError;
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useFreelancers({
    page, limit: PAGE_SIZE, search: search || undefined, skill: skill || undefined,
    minRate: range.minRate, maxRate: range.maxRate, sort,
  }, { enabled: !urlError });

  useEffect(() => {
    if (urlError || !data || isFetching || isPlaceholderData || isError || page <= data.pages) return;
    updatePage(data.pages, true);
  }, [urlError, data, isFetching, isPlaceholderData, isError, page, updatePage]);

  const handleReset = () => {
    setSearchInput(""); setSkillInput(""); setMinRateInput(""); setMaxRateInput(""); setFilterError("");
    updateFilters({ search: "", skill: "", minRate: "", maxRate: "", sort: "" });
  };
  const rateLabel = range.error ? undefined : range.minRate !== undefined && range.maxRate !== undefined
    ? `${formatMoney(range.minRate)} – ${formatMoney(range.maxRate)} / hr`
    : range.minRate !== undefined ? `From ${formatMoney(range.minRate)} / hr`
      : range.maxRate !== undefined ? `Up to ${formatMoney(range.maxRate)} / hr` : undefined;
  const isDebouncing = searchInput.trim().length <= 100 && searchInput.trim() !== search;
  const isUpdating = isDebouncing || isFetching;
  const hasFilters = Boolean(search || skill || range.minRate !== undefined || range.maxRate !== undefined || sort !== "rating");

  const header = (
    <div className="space-y-7">
      <header className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-3xl bg-brand-950 p-7 text-white sm:p-10 lg:flex-row lg:items-end">
        <div className="relative z-10 min-w-0 max-w-2xl"><p className="eyebrow flex items-center gap-2 text-lime"><UserIcon className="size-4" />The people behind great work</p><h1 className="mt-6 font-display text-5xl leading-[1.04] tracking-tight sm:text-6xl lg:text-[68px]">Find your people.<br /><span className="text-lime">Build something great.</span></h1><p className="mt-5 max-w-lg text-sm leading-7 text-white/65">Fresh perspectives. Independent expertise. Find a collaborator who brings something different to the table.</p></div>
        {data && !isError && !urlError && <div className="relative z-10 flex shrink-0 items-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-5 py-5"><span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-lime text-brand-950"><UserIcon className="size-5" /></span><div><p className="font-display text-4xl leading-none">{data.total}</p><p className="mt-2 text-xs text-white/65">{isPlaceholderData ? "Updating matches…" : hasFilters ? "matching professionals" : "independent professionals"}</p></div></div>}
      </header>

      <FreelancerFilters
        search={searchInput} onSearchChange={setSearchInput} onSearchSubmit={() => applySearch(searchInput)}
        searchError={searchInput.trim().length > 100 ? "Use no more than 100 characters for a name search." : appliedSearchError}
        skill={skillInput} onSkillChange={(value) => { setSkillInput(value); setFilterError(""); }}
        minRate={minRateInput} maxRate={maxRateInput}
        onMinRateChange={(value) => { setMinRateInput(value); setFilterError(""); }}
        onMaxRateChange={(value) => { setMaxRateInput(value); setFilterError(""); }}
        onApply={handleApply}
        skillError={skillInput.trim().length > 30 ? "Use no more than 30 characters for one skill." : appliedSkillError}
        rateError={(skillInput.trim().length <= 30 ? filterError : "") || range.error}
        sort={sort} onSortChange={handleSortChange}
        appliedSearch={search.length <= 100 ? search : ""} appliedSkill={skill.length <= 30 ? skill : ""} rateLabel={rateLabel}
        onClearSearch={handleClearSearch} onClearSkill={handleClearSkill} onClearRate={handleClearRate} onReset={handleReset}
      />
    </div>
  );

  if (urlError) return <div className="space-y-7">{header}<p role="status" className="text-sm text-gray-500">Correct the filters above to see matching professionals.</p></div>;
  if (isPending) return <div className="space-y-7">{header}<div className="card p-10"><Spinner label="Finding independent talent…" /></div></div>;
  if (isError) return <div className="space-y-7">{header}<ErrorMessage title="We couldn't load freelancers" message={getErrorMessage(error)} onRetry={() => { void refetch(); }} /></div>;

  return (
    <div className="space-y-7">
      {header}
      <section aria-labelledby="freelancers-heading" aria-busy={isUpdating}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-brand-700">{hasFilters ? "Your search results" : "A world of independent talent"}</p><h2 id="freelancers-heading" className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">{hasFilters ? "People that match your search." : "Meet your next collaborator."}</h2></div><p role="status" className="flex min-h-5 items-center gap-2 text-xs text-gray-500">{isUpdating ? <><span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600 motion-reduce:animate-none" />Updating matches…</> : `Showing ${data.items.length} of ${data.total}`}</p></div>
        <div className={`transition-opacity duration-200 motion-reduce:transition-none ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
          {data.items.length === 0 ? <EmptyState title={hasFilters ? "Your next collaborator is still out there." : "The community is just getting started."} description={hasFilters ? "Try another name, a different skill or a wider rate range to find more people." : "Freelancers will appear here as they join the marketplace."} action={hasFilters ? { label: "Clear all filters", onClick: handleReset } : undefined} /> : <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">{data.items.map((freelancer) => <FreelancerCard key={freelancer.id} freelancer={freelancer} />)}</div>}
        </div>
      </section>
      {data.items.length > 0 && <p className="flex items-center justify-center gap-2 text-center text-xs text-gray-500"><ArrowUpRightIcon className="size-4 shrink-0" />Open a profile to explore skills, experience and feedback.</p>}
      <Pagination page={data.page} pages={data.pages} onPageChange={updatePage} disabled={isDebouncing || isFetching || isPlaceholderData} ariaLabel="Freelancers pagination" />
    </div>
  );
}
