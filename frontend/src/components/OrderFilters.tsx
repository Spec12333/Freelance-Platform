import type { Category, OrderStatus } from "@/types/models";
import { ORDER_STATUS } from "@/utils/constants";
import {
  ChevronDownIcon,
  CloseIcon,
  FilterIcon,
  LayersIcon,
  RefreshIcon,
  SearchIcon,
} from "./ui/icons";

type OrderFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  status: OrderStatus | "";
  onStatusChange: (value: string) => void;
  categoryId: number | undefined;
  category: Category[] | undefined;
  onCategoryChange: (value: string) => void;
  minBudget: string;
  maxBudget: string;
  onMinBudgetChange: (value: string) => void;
  onMaxBudgetChange: (value: string) => void;
  onBudgetApply: () => void;
  onBudgetClear: () => void;
  budgetError: string;
  budgetLabel?: string;
  onReset: () => void;
  categoryError?: string;
  onRetryCategories?: () => void;
};

// Present filters; URL updates, debounce and requests belong to the page.
export default function OrdersFilters({
  search,
  onSearchChange,
  onSearchSubmit,
  status,
  onStatusChange,
  categoryId,
  category,
  onCategoryChange,
  minBudget,
  maxBudget,
  onMinBudgetChange,
  onMaxBudgetChange,
  onBudgetApply,
  onBudgetClear,
  budgetError,
  budgetLabel,
  onReset,
  categoryError,
  onRetryCategories,
}: OrderFiltersProps) {
  const hasFilters = Boolean(search.trim() || status || categoryId || minBudget || maxBudget || budgetLabel);
  const categoryName = category?.find((item) => item.id === categoryId)?.name;
  const chipClass = "inline-flex max-w-full items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 outline-none transition hover:bg-brand-100 focus-visible:ring-4 focus-visible:ring-brand-600/20";

  return (
    <section aria-label="Search and filter orders" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_4px_24px_-8px_rgb(16_24_40/0.12)] sm:p-6">
      {/* 1. Search. */}
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
      >
        <label htmlFor="orders-search" className="sr-only">Search orders by title</label>
        <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 transition focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/10 sm:flex-nowrap">
          <SearchIcon className="ml-2 size-5 shrink-0 text-gray-400 sm:ml-3" />
          <input
            id="orders-search"
            type="search"
            value={search}
            maxLength={100}
            placeholder="Try “React”, “logo design” or “website”…"
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 min-w-0 flex-1 border-0 bg-transparent py-2 pr-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 sm:text-[15px] [&::-webkit-search-cancel-button]:appearance-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 outline-none transition hover:bg-gray-200 hover:text-gray-700 focus-visible:ring-4 focus-visible:ring-brand-600/20"
            >
              <CloseIcon className="size-4" />
            </button>
          )}
          <button type="submit" className="btn btn-primary h-11 w-full shrink-0 shadow-sm sm:w-auto sm:px-7">
            Search projects
            <SearchIcon className="size-4" />
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-5 lg:flex-row lg:items-end">
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
          {/* 2. Status. */}
          <div className="min-w-0">
            <label htmlFor="orders-status" className="mb-2 block text-xs font-bold tracking-wide text-gray-500">PROJECT STATUS</label>
            <div className="relative">
              <span className="input-icon"><FilterIcon className="size-4" /></span>
              <select
                id="orders-status"
                value={status}
                onChange={(event) => onStatusChange(event.target.value)}
                className={`input h-11 pl-10 text-sm shadow-none ${status ? "border-brand-300 bg-brand-50/40 font-semibold text-brand-800" : "border-gray-200"}`}
              >
                <option value="">All statuses</option>
                {Object.entries(ORDER_STATUS).map(([value, style]) => (
                  <option key={value} value={value}>{style.label}</option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* 3. Category. */}
          <div className="min-w-0">
            <label htmlFor="orders-category" className="mb-2 block text-xs font-bold tracking-wide text-gray-500">CATEGORY</label>
            <div className="relative">
              <span className="input-icon"><LayersIcon className="size-4" /></span>
              <select
                id="orders-category"
                value={categoryId ?? ""}
                onChange={(event) => onCategoryChange(event.target.value)}
                disabled={!category}
                aria-invalid={categoryError ? true : undefined}
                aria-describedby={categoryError ? "orders-category-error" : undefined}
                className={`input h-11 pl-10 text-sm shadow-none ${categoryId ? "border-brand-300 bg-brand-50/40 font-semibold text-brand-800" : "border-gray-200"}`}
              >
                <option value="">{!category && !categoryError ? "Loading categories…" : "All categories"}</option>
                {category?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <button type="button" onClick={onReset} disabled={!hasFilters} className="btn btn-ghost h-11 shrink-0 text-gray-500 lg:ml-2">
          <RefreshIcon className="size-4" />
          Reset filters
        </button>
      </div>

      {categoryError && (
        <div id="orders-category-error" role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-red-600">
          <span>{categoryError}</span>
          {onRetryCategories && <button type="button" onClick={onRetryCategories} className="link rounded outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">Try again</button>}
        </div>
      )}

      {/* 4. Budget: apply both amounts together. */}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onBudgetApply();
        }}
        className="mt-5 border-t border-gray-100 pt-5"
      >
        <fieldset>
          <legend className="mb-3 text-xs font-bold tracking-wide text-gray-500">BUDGET RANGE</legend>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <label htmlFor="orders-min-budget" className="mb-1.5 block text-xs font-medium text-gray-600">Minimum</label>
              <div className="relative">
                <span aria-hidden="true" className="input-icon text-sm font-semibold">$</span>
                <input
                  id="orders-min-budget"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={minBudget}
                  onChange={(event) => onMinBudgetChange(event.target.value)}
                  placeholder="No minimum"
                  aria-invalid={budgetError ? true : undefined}
                  aria-describedby={budgetError ? "orders-budget-error" : "orders-budget-hint"}
                  className="input h-11 border-gray-200 pl-9 text-sm shadow-none"
                />
              </div>
            </div>
            <div className="min-w-0">
              <label htmlFor="orders-max-budget" className="mb-1.5 block text-xs font-medium text-gray-600">Maximum</label>
              <div className="relative">
                <span aria-hidden="true" className="input-icon text-sm font-semibold">$</span>
                <input
                  id="orders-max-budget"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={maxBudget}
                  onChange={(event) => onMaxBudgetChange(event.target.value)}
                  placeholder="No maximum"
                  aria-invalid={budgetError ? true : undefined}
                  aria-describedby={budgetError ? "orders-budget-error" : "orders-budget-hint"}
                  className="input h-11 border-gray-200 pl-9 text-sm shadow-none"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-secondary h-11 text-brand-700 hover:border-brand-300 hover:bg-brand-50">
              Apply budget
            </button>
          </div>
          {budgetError ? (
            <p id="orders-budget-error" role="alert" className="field-error">{budgetError}</p>
          ) : (
            <p id="orders-budget-hint" className="mt-2 text-xs text-gray-400">USD · Enter whole amounts. Leave either field empty for no limit.</p>
          )}
        </fieldset>
      </form>

      {/* Selected filters can be removed individually. */}
      {(status || categoryId || budgetLabel) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <span className="mr-1 text-xs font-medium text-gray-400">Selected</span>
          {status && (
            <button type="button" onClick={() => onStatusChange("")} aria-label={`Remove status filter: ${ORDER_STATUS[status].label}`} className={chipClass}>
              {ORDER_STATUS[status].label}
              <CloseIcon className="size-3.5 shrink-0" />
            </button>
          )}
          {categoryId && (
            <button type="button" onClick={() => onCategoryChange("")} aria-label={`Remove category filter: ${categoryName ?? categoryId}`} className={chipClass}>
              <span className="truncate">{categoryName ?? `Category ${categoryId}`}</span>
              <CloseIcon className="size-3.5 shrink-0" />
            </button>
          )}
          {budgetLabel && (
            <button type="button" onClick={onBudgetClear} aria-label={`Remove budget filter: ${budgetLabel}`} className={chipClass}>
              <span className="truncate">{budgetLabel}</span>
              <CloseIcon className="size-3.5 shrink-0" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
