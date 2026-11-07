// Page switcher built around the { items, total, page, pages } response shape.
import { ArrowLeftIcon } from "./icons";

type PaginationProps = {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export default function Pagination({
  page,
  pages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  // Hide navigation only when there is no second page.
  if (pages <= 1) return null;

  // Keep the list short even when the server reports many pages.
  let start = Math.max(2, page - 1);
  let end = Math.min(pages - 1, page + 1);
  if (pages <= 7 || page <= 3) end = Math.min(pages - 1, pages <= 7 ? 6 : 5);
  if (pages <= 7 || page >= pages - 2) start = Math.max(2, pages <= 7 ? 2 : pages - 4);

  const visiblePages = [1];
  for (let number = start; number <= end; number += 1) visiblePages.push(number);
  visiblePages.push(pages);

  // Ignore clicks on the current page and refuse out-of-range navigation.
  const changePage = (nextPage: number) => {
    if (!disabled && nextPage >= 1 && nextPage <= pages && nextPage !== page) {
      onPageChange(nextPage);
    }
  };

  return (
    <nav aria-label="Orders pagination" className="card flex items-center justify-between gap-2 p-3 sm:gap-4 sm:p-4">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => changePage(page - 1)}
        className="btn btn-secondary btn-sm shrink-0 px-3"
        aria-label="Previous page"
      >
        <ArrowLeftIcon className="size-4" />
        Previous
      </button>

      <p aria-live="polite" aria-atomic="true" className="text-center text-xs text-gray-500 sm:sr-only">
        Page <span className="font-bold text-gray-900">{page}</span> of {pages}
      </p>

      <div className="hidden items-center gap-1 sm:flex">
        {visiblePages.map((number, index) => (
          <span key={number} className="flex items-center gap-1">
            {index > 0 && number - visiblePages[index - 1] > 1 && (
              <span aria-hidden="true" className="grid size-9 place-items-center text-sm text-gray-400">…</span>
            )}
            <button
              type="button"
              aria-label={`Page ${number}`}
              aria-current={page === number ? "page" : undefined}
              disabled={disabled}
              onClick={() => changePage(number)}
              className={`btn btn-sm min-w-9 px-2.5 ${page === number ? "btn-primary" : "btn-ghost"}`}
            >
              {number}
            </button>
          </span>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || page >= pages}
        onClick={() => changePage(page + 1)}
        className="btn btn-secondary btn-sm shrink-0 px-3"
        aria-label="Next page"
      >
        Next
        <ArrowLeftIcon className="size-4 rotate-180" />
      </button>
    </nav>
  );
}
