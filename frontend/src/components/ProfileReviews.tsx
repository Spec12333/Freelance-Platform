import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useFreelancersReviews } from "@/hooks/useFreelancers";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/api/client";
import type { PublicProfile } from "@/types/models";
import ReviewList from "./ReviewList";
import Pagination from "./ui/Pagination";
import ErrorMessage from "./ui/ErrorMessage";
import Spinner from "./ui/Spinner";
import { RefreshIcon, StarIcon } from "./ui/icons";

const REVIEWS_PER_PAGE = 5;

type ProfileReviewsProps = {
  profile: PublicProfile;
  updatedAt: number;
};

// Page only reviews received by this user; the profile already includes page one.
export default function ProfileReviews({ profile, updatedAt }: ProfileReviewsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  const parsedPage = Number(searchParams.get("page") ?? 1);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    && Number.isSafeInteger((parsedPage - 1) * REVIEWS_PER_PAGE) ? parsedPage : 1;
  const reviews = useFreelancersReviews(profile.id, { page, limit: REVIEWS_PER_PAGE }, {
    initialData: page === 1 ? {
      items: profile.reviews,
      total: profile.reviewsCount,
      page: 1,
      pages: Math.max(1, Math.ceil(profile.reviewsCount / REVIEWS_PER_PAGE)),
    } : undefined,
    // Keep the original fetch time so old embedded reviews can be refreshed.
    initialDataUpdatedAt: page === 1 ? updatedAt : undefined,
  });

  const handlePageChange = (nextPage: number) => {
    if (reviews.isFetching || nextPage === page) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage === 1) next.delete("page");
      else next.set("page", String(nextPage));
      return next;
    });
  };

  const handleRefresh = () => {
    // Refresh the aggregate rating/count as well as the visible review page.
    void Promise.all([
      client.invalidateQueries({ queryKey: ["freelancers", "detail", profile.id], exact: true }),
      client.invalidateQueries({ queryKey: ["freelancers", "reviews", profile.id] }),
    ]);
  };

  // A direct URL may point beyond the last page, including after data changes.
  useEffect(() => {
    if (!reviews.data || reviews.isFetching || reviews.isPlaceholderData || page <= reviews.data.pages) return;
    const lastPage = reviews.data.pages;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (lastPage === 1) next.delete("page");
      else next.set("page", String(lastPage));
      return next;
    }, { replace: true });
  }, [page, reviews.data, reviews.isFetching, reviews.isPlaceholderData, setSearchParams]);

  const title = profile.role === "FREELANCER" ? "What clients say." : profile.role === "CLIENT" ? "What freelancers say." : "Words from collaborators.";
  const pages = reviews.data?.pages ?? Math.max(1, Math.ceil(profile.reviewsCount / REVIEWS_PER_PAGE));

  return (
    <section id="profile-reviews" aria-labelledby="profile-reviews-heading" aria-busy={reviews.isFetching} className="scroll-mt-36 space-y-4">
      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-gray-200 p-6 sm:p-8">
          <div><p className="eyebrow text-brand-700">Reputation, built together</p><h2 id="profile-reviews-heading" className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">{title}</h2><p className="mt-3 text-sm text-gray-500">Feedback from completed collaborations.</p></div>
          <button type="button" onClick={handleRefresh} disabled={reviews.isFetching} className="btn btn-ghost btn-sm text-gray-500"><RefreshIcon className={`size-4 ${reviews.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />Refresh reviews</button>
        </header>

        {reviews.isPending ? <div className="p-8"><Spinner label="Loading reviews…" /></div>
          : reviews.isError ? <div className="p-6"><ErrorMessage title="We couldn't load reviews" message={getErrorMessage(reviews.error)} onRetry={() => { void reviews.refetch(); }} /></div>
          : reviews.data.total === 0 ? (
            <div className="px-6 py-12 text-center sm:px-8"><span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full bg-cream text-brand-700"><StarIcon className="size-5" /></span><h3 className="mt-5 font-display text-2xl text-ink">The first story is still to come.</h3><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">No reviews yet. Feedback will appear here after a completed project.</p></div>
          ) : page > reviews.data.pages && !reviews.isPlaceholderData ? <div className="p-8"><Spinner label="Finding the latest review page…" /></div>
            : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/60 px-6 py-3 text-xs text-gray-500 sm:px-8"><p>{reviews.data.total} {reviews.data.total === 1 ? "review" : "reviews"} · Newest first</p><p role="status">{reviews.isFetching ? "Updating reviews…" : `${reviews.data.items.length} on this page`}</p></div>
                <div className={`transition-opacity motion-reduce:transition-none ${reviews.isPlaceholderData ? "opacity-50" : "opacity-100"}`}><ReviewList reviews={reviews.data.items} currentUserId={currentUserId} /></div>
              </>
            )}
      </div>
      <Pagination page={page} pages={pages} onPageChange={handlePageChange} disabled={reviews.isFetching || reviews.isPlaceholderData} ariaLabel="Reviews pagination" />
    </section>
  );
}
