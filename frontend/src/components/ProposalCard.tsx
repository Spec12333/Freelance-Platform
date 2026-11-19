import { Link } from "react-router-dom";
import type { Proposal } from "@/types/models";
import { formatDateTime, formatMoney, formatRating } from "@/utils/format";
import StatusBadge from "./StatusBadge";
import Avatar from "./Avatar";
import { ArrowUpRightIcon, CalendarIcon, StarIcon } from "./ui/icons";

type ProposalCardProps = {
  proposal: Proposal;
  onChoose?: () => void;
  isChoosing?: boolean;
  disabled?: boolean;
};

// Present an offer; fetching, viewed flags and actions belong to the parent.
export default function ProposalCard({ proposal, onChoose, isChoosing = false, disabled = false }: ProposalCardProps) {
  const freelancer = proposal.freelancer;
  const isNew = !proposal.viewedByClient;

  return (
    <article
      aria-labelledby={`proposal-freelancer-${proposal.id}`}
      className={`card min-w-0 overflow-hidden ${isNew ? "border-amber-200" : ""}`}
    >
      {/* Freelancer details and proposal status. */}
      <header className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar user={freelancer} />
          <div className="min-w-0">
            <h3 id={`proposal-freelancer-${proposal.id}`} className="text-base font-bold leading-snug text-gray-900">
              <Link
                to={`/freelancers/${freelancer.id}`}
                className="group rounded-md outline-none transition hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20 [overflow-wrap:anywhere]"
              >
                {freelancer.name}
                <ArrowUpRightIcon className="ml-1 inline size-3.5 align-middle text-gray-400 transition group-hover:text-brand-600" />
              </Link>
            </h3>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500">
              {/* A null rating means the freelancer has no ratings yet. */}
              {freelancer.rating !== null && <StarIcon className="size-3.5 shrink-0 text-brand-600" />}
              <span>
                {freelancer.rating !== null && <span className="sr-only">Freelancer rating: </span>}
                {formatRating(freelancer.rating)}
              </span>
              <span className="text-gray-400">
                ({freelancer.reviewsCount} {freelancer.reviewsCount === 1 ? "review" : "reviews"})
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isNew && <span className="badge bg-amber-50 text-amber-700 ring-amber-600/20">New</span>}
          <StatusBadge status={proposal.status} />
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {/* Use shared helpers for money and the local submission date. */}
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">Proposed price</dt>
            <dd className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {formatMoney(proposal.price)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-gray-500">Submitted</dt>
            <dd className="mt-2 flex items-start gap-2 text-sm font-semibold leading-relaxed text-gray-700">
              <CalendarIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
              <time dateTime={proposal.createdAt}>{formatDateTime(proposal.createdAt)}</time>
            </dd>
          </div>
        </dl>

        <div className="border-t border-gray-100 pt-5">
          <h4 className="text-sm font-bold text-gray-900">Cover letter</h4>
          {/* Keep the full letter and preserve paragraphs for the client. */}
          <p className="mt-3 text-[15px] leading-7 whitespace-pre-wrap text-gray-600 [overflow-wrap:anywhere]">
            {proposal.coverLetter}
          </p>
        </div>
      </div>

      {/* The parent supplies this action only when selection is allowed. */}
      {onChoose && (
        <footer className="flex justify-end border-t border-gray-100 bg-gray-50/60 p-5 sm:px-6">
          <button type="button" onClick={onChoose} disabled={disabled || isChoosing} className="btn btn-primary w-full sm:w-auto">
            {isChoosing ? "Choosing…" : "Choose freelancer"}
          </button>
        </footer>
      )}
    </article>
  );
}
