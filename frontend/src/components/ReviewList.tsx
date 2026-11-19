import type { Review } from "@/types/models";
import { formatDate, formatDateTime } from "@/utils/format";
import StarRating from "./StarRating";
import Avatar from "./Avatar";
import { ShieldIcon } from "./ui/icons";

type ReviewListProps = {
  reviews: Review[];
  currentUserId?: number;
  clientId?: number;
};

// Render supplied reviews; this component never fetches or submits data.
export default function ReviewList({ reviews, currentUserId, clientId }: ReviewListProps) {
  return (
    <ol aria-label="Project reviews" className="divide-y divide-gray-200 px-6 sm:px-8">
      {reviews.map((review) => {
        return (
          <li key={review.id} className="py-7">
            <article>
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={review.author} />
                  <div className="min-w-0"><p className="font-semibold text-ink [overflow-wrap:anywhere]">{review.author.name}</p><p className="mt-1 text-xs text-gray-500">{clientId === undefined ? "Project feedback" : review.authorId === clientId ? "Client feedback" : "Freelancer feedback"}</p></div>
                </div>
                <time dateTime={review.createdAt} title={formatDateTime(review.createdAt)} className="text-xs text-gray-400">{formatDate(review.createdAt)}</time>
              </header>
              <div className="mt-5 flex flex-wrap items-center gap-3"><StarRating value={review.rating} /><span className="text-sm font-semibold text-ink">{review.rating.toFixed(1)}</span>{review.authorId === currentUserId && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-800">Your review</span>}</div>
              {review.comment ? <p className="mt-4 text-[15px] leading-7 whitespace-pre-wrap text-gray-600 [overflow-wrap:anywhere]">{review.comment}</p> : <p className="mt-4 text-sm italic text-gray-400">No written feedback.</p>}
              <p className="mt-5 flex items-center gap-1.5 text-[11px] text-gray-500"><ShieldIcon className="size-3.5 text-brand-600" />Verified collaboration</p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
