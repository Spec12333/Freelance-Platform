import { useOrderReviews } from "@/hooks/useReviews";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/api/client";
import type { Order } from "@/types/models";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import { ArrowUpRightIcon, RefreshIcon, ShieldIcon } from "@/components/ui/icons";

// Load public feedback and let each participant review a completed project once.
export default function OrderReviews({ order }: { order: Order }) {
  const currentUser = useAuthStore((state) => state.user);
  const reviews = useOrderReviews(order.id, { enabled: order.status === "COMPLETED" });
  const ownReview = reviews.data?.find((review) => review.authorId === currentUser?.id);
  const isParticipant = (currentUser?.role === "CLIENT" && currentUser.id === order.clientId)
    || (currentUser?.role === "FREELANCER" && currentUser.id === order.freelancerId);

  if (order.status !== "COMPLETED") return null;

  return (
    <section aria-labelledby={`order-reviews-heading-${order.id}`} className="card min-w-0 overflow-hidden">
      <header className="relative overflow-hidden bg-brand-950 p-6 text-white sm:p-8">
        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0"><p className="eyebrow text-lime">Good work deserves good words</p><h2 id={`order-reviews-heading-${order.id}`} className="mt-4 font-display text-4xl tracking-tight sm:text-[42px]">The work is done.<br /><span className="text-lime">Tell the story.</span></h2><p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">Two perspectives on one collaboration. Feedback from the people who made it happen.</p></div>
          <ArrowUpRightIcon aria-hidden="true" className="mt-1 hidden size-12 shrink-0 text-lime sm:block" />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {reviews.data && <p className="inline-flex rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80">{reviews.data.length} of 2 reviews published</p>}
          <button type="button" onClick={() => { void reviews.refetch(); }} disabled={reviews.isFetching} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-white/75 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-lime disabled:opacity-50"><RefreshIcon className={`size-3.5 ${reviews.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />Refresh feedback</button>
        </div>
      </header>

      {reviews.isPending ? <div className="p-8"><Spinner label="Loading project feedback…" /></div>
        : reviews.isError && !reviews.data ? <div className="p-6"><ErrorMessage title="We couldn't load reviews" message={getErrorMessage(reviews.error)} onRetry={() => { void reviews.refetch(); }} /></div>
        : (
          <>
            {reviews.isError && <p role="alert" className="border-b border-amber-100 bg-amber-50 px-6 py-4 text-sm text-amber-800 sm:px-8">Feedback could not be refreshed. Your draft is saved. Use Refresh feedback to try again.</p>}
            {ownReview && <div role="status" className="flex items-start gap-3 border-b border-brand-100 bg-brand-50 px-6 py-4 text-sm text-brand-800 sm:px-8"><ShieldIcon className="mt-0.5 size-5 shrink-0" /><p><span className="font-semibold">Your feedback is published.</span> Thank you for sharing your experience.</p></div>}
            {reviews.data.length > 0 ? <ReviewList reviews={reviews.data} currentUserId={currentUser?.id} clientId={order.clientId} />
              : <div className="p-6 sm:p-8"><p className="text-base font-semibold text-ink">Every collaboration has a story.</p><p className="mt-2 text-sm leading-relaxed text-gray-500">No reviews yet. Feedback from this project's client and freelancer will appear here.</p></div>}
            {/* Check cached results once on mount, then preserve the draft on refresh. */}
            {isParticipant && !ownReview && (!reviews.isFetchedAfterMount ? <div className="border-t border-gray-200 p-6"><Spinner label="Checking your review…" /></div> : <ReviewForm order={order} disabled={reviews.isError} />)}
          </>
        )}
    </section>
  );
}
