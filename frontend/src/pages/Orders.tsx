// Order filters: search, status, category, budget, then pagination.
import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { useGetCategories } from "@/hooks/useCategories";
import { getErrorMessage } from "@/api/client";
import type { OrderStatus } from "@/types/models";
import { ORDER_STATUS } from "@/utils/constants";
import { parseBudgetRange } from "@/utils/budget";
import { formatMoney } from "@/utils/format";
import OrderCard from "@/components/OrderCard";
import OrdersFilters from "@/components/OrderFilters";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { ArrowUpRightIcon, BriefcaseIcon } from "@/components/ui/icons";

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Shared URL update for the two dropdown filters.
  const updateFilter = (name: "status" | "categoryId", value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      next.set("page", "1");
      return next;
    });
  };

  // 1. Search: apply typing after 400 ms, or immediately on submit.
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const applySearch = useCallback((value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value.trim()) next.set("search", value.trim());
      else next.delete("search");
      next.set("page", "1");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    setSearchInput(search);
  }, [search, location.key]);

  useEffect(() => {
    if (searchInput.trim() === search.trim()) return;
    const timeout = window.setTimeout(() => applySearch(searchInput), 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, location.key, applySearch]);

  const handleSearchSubmit = () => applySearch(searchInput);

  // 2. Status: accept only known order statuses.
  const statusParam = searchParams.get("status") ?? "";
  const status = Object.hasOwn(ORDER_STATUS, statusParam)
    ? (statusParam as OrderStatus)
    : undefined;
  const handleStatusChange = (value: string) => updateFilter("status", value);

  // 3. Category: load options and validate the selected ID.
  const categories = useGetCategories();
  const categoryParam = searchParams.get("categoryId") ?? "";
  const parsedCategoryId = Number(categoryParam);
  const categoryId = Number.isSafeInteger(parsedCategoryId) && parsedCategoryId > 0
    ? parsedCategoryId
    : undefined;
  const handleCategoryChange = (value: string) => updateFilter("categoryId", value);

  // 4. Budget: keep input drafts separate from applied URL values.
  const minBudgetParam = searchParams.get("minBudget") ?? "";
  const maxBudgetParam = searchParams.get("maxBudget") ?? "";
  const appliedBudget = parseBudgetRange(minBudgetParam, maxBudgetParam);
  const { minBudget, maxBudget } = appliedBudget;
  const [minBudgetInput, setMinBudgetInput] = useState(minBudgetParam);
  const [maxBudgetInput, setMaxBudgetInput] = useState(maxBudgetParam);
  const [budgetError, setBudgetError] = useState("");

  // Restore applied amounts on back/forward navigation.
  useEffect(() => {
    setMinBudgetInput(minBudgetParam);
    setMaxBudgetInput(maxBudgetParam);
    setBudgetError("");
  }, [minBudgetParam, maxBudgetParam]);

  const handleMinBudgetChange = (value: string) => {
    setMinBudgetInput(value);
    setBudgetError("");
  };
  const handleMaxBudgetChange = (value: string) => {
    setMaxBudgetInput(value);
    setBudgetError("");
  };

  const handleBudgetApply = () => {
    const range = parseBudgetRange(minBudgetInput, maxBudgetInput);
    setBudgetError(range.error);
    if (range.error) return;

    // Apply both bounds together; an empty bound removes its restriction.
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (range.minBudget !== undefined) next.set("minBudget", String(range.minBudget));
      else next.delete("minBudget");
      if (range.maxBudget !== undefined) next.set("maxBudget", String(range.maxBudget));
      else next.delete("maxBudget");
      next.set("page", "1");
      return next;
    });
    setMinBudgetInput(range.minBudget === undefined ? "" : String(range.minBudget));
    setMaxBudgetInput(range.maxBudget === undefined ? "" : String(range.maxBudget));
  };

  const handleBudgetClear = () => {
    setMinBudgetInput("");
    setMaxBudgetInput("");
    setBudgetError("");
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("minBudget");
      next.delete("maxBudget");
      next.set("page", "1");
      return next;
    });
  };

  const budgetLabel = minBudget !== undefined && maxBudget !== undefined
    ? `${formatMoney(minBudget)} – ${formatMoney(maxBudget)}`
    : minBudget !== undefined ? `From ${formatMoney(minBudget)}`
    : maxBudget !== undefined ? `Up to ${formatMoney(maxBudget)}` : undefined;

  // 5. Pagination: preserve all applied filters when changing pages.
  const pageParam = searchParams.get("page");
  const parsedPage = Number(pageParam);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const handlePageChange = useCallback((newPage: number, replace = false) => {
    if (!Number.isSafeInteger(newPage) || newPage < 1) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(newPage));
      return next;
    }, { replace });
  }, [setSearchParams]);

  useEffect(() => {
    if (pageParam !== null && pageParam !== String(page)) handlePageChange(page, true);
  }, [pageParam, page, handlePageChange]);

  // Fetch only applied, valid filters; editing a budget does not send requests.
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useOrders({
    page,
    search: search.trim() || undefined,
    status,
    categoryId,
    minBudget,
    maxBudget,
  }, { enabled: !appliedBudget.error });

  // Correct out-of-range pages only after receiving their actual response.
  useEffect(() => {
    if (appliedBudget.error || !data || isFetching || isPlaceholderData || isError) return;
    if (page > data.pages) handlePageChange(data.pages, true);
  }, [appliedBudget.error, data, isFetching, isPlaceholderData, isError, page, handlePageChange]);

  // Reset every filter in one URL update.
  const handleResetFilters = () => {
    setSearchInput("");
    setMinBudgetInput("");
    setMaxBudgetInput("");
    setBudgetError("");
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const key of ["search", "status", "categoryId", "minBudget", "maxBudget"]) next.delete(key);
      next.set("page", "1");
      return next;
    });
  };

  const isDebouncing = searchInput.trim() !== search.trim();
  const isUpdating = isDebouncing || isFetching;
  const hasActiveFilters = Boolean(search.trim() || status || categoryId || minBudgetParam || maxBudgetParam);

  // Keep the page heading visible while the list loads or shows an error.
  const header = (
    <div className="space-y-7">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            <BriefcaseIcon className="size-4" />
            Freelance marketplace
          </p>
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-[42px]">
            Great work starts here<span className="text-brand-600">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-500">
            Big ideas. Clear briefs. Find the project that brings out your best.
          </p>
        </div>

        {data && !isError && (
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:mb-1">
            <span
              className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700"
              aria-hidden="true"
            >
              <BriefcaseIcon className="size-5" />
            </span>
            <div>
              <p className="text-3xl leading-none font-extrabold tracking-tight text-gray-900">
                {data.total}
              </p>
              <p className="mt-1.5 text-xs font-medium text-gray-500">
                {isPlaceholderData
                  ? "Updating results…"
                  : hasActiveFilters
                    ? data.total === 1
                      ? "matching project"
                      : "matching projects"
                    : data.total === 1
                      ? "project to explore"
                      : "projects to explore"}
              </p>
            </div>
          </div>
        )}
      </header>

      <OrdersFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        status={status ?? ""}
        onStatusChange={handleStatusChange}
        categoryId={categoryId}
        category={categories.data}
        onCategoryChange={handleCategoryChange}
        minBudget={minBudgetInput}
        maxBudget={maxBudgetInput}
        onMinBudgetChange={handleMinBudgetChange}
        onMaxBudgetChange={handleMaxBudgetChange}
        onBudgetApply={handleBudgetApply}
        onBudgetClear={handleBudgetClear}
        budgetError={budgetError || appliedBudget.error}
        budgetLabel={budgetLabel}
        onReset={handleResetFilters}
        categoryError={
          categories.isError ? getErrorMessage(categories.error) : undefined
        }
        onRetryCategories={() => {
          void categories.refetch();
        }}
      />
    </div>
  );

  // Invalid URL budgets stay editable and never reach the API.
  if (appliedBudget.error) {
    return <div className="space-y-8">{header}</div>;
  }

  if (isPending) {
    return (
      <div className="space-y-8">
        {header}
        <div className="card">
          <Spinner label="Finding the latest orders…" className="min-h-72" />
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="space-y-8">
        {header}
        <ErrorMessage
          title="We couldn't load the orders"
          message={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {header}

      <section aria-labelledby="orders-heading" aria-busy={isUpdating}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="orders-heading"
              className="flex items-center gap-3 text-xl font-bold tracking-tight text-gray-900"
            >
              {hasActiveFilters ? "Your search results" : "Explore projects"}
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold tracking-normal text-gray-600">
                {data.total}
              </span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters
                ? "Projects that match what you’re looking for."
                : "Browse the latest projects from clients looking for your skills."}
            </p>
          </div>
          <p
            role="status"
            className="flex min-h-5 items-center gap-2 text-xs font-medium text-gray-500"
          >
            {isUpdating ? (
              <>
                <span
                  aria-hidden="true"
                  className="size-3.5 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600 motion-reduce:animate-none"
                />
                Updating results…
              </>
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {data.items.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {data.total}
                </span>
                {" · Newest first"}
              </>
            )}
          </p>
        </div>

        {/* Keep the previous results visible while their replacement loads. */}
        <div
          className={`transition-opacity duration-200 motion-reduce:transition-none ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}
        >
          {data.items.length === 0 ? (
            <EmptyState
              title={
                hasActiveFilters
                  ? "No projects match just yet"
                  : "The next project could start with you"
              }
              description={
                hasActiveFilters
                  ? "Try a different keyword or clear your filters to explore more projects."
                  : "There are no orders on this page. New projects appear once clients post them."
              }
              action={
                hasActiveFilters
                  ? { label: "Clear all filters", onClick: handleResetFilters }
                  : undefined
              }
            />
          ) : (
            <div className="grid items-start gap-5 lg:grid-cols-2">
              {data.items.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </section>

      {data.items.length > 0 && (
        <p className="flex items-center justify-center gap-2 text-center text-xs leading-relaxed text-gray-500">
          <ArrowUpRightIcon className="size-4 shrink-0" />
          Select a project title to read the full brief and view its details.
        </p>
      )}
      <Pagination
        page={data.page}
        pages={data.pages}
        onPageChange={handlePageChange}
        disabled={isDebouncing || isPlaceholderData}
      />
    </div>
  );
}
