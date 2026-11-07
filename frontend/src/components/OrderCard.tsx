import { Link } from "react-router-dom";
import type { Order } from "@/types/models";
import { formatDate, formatMoney, formatRating } from "@/utils/format";
import StatusBadge from "./StatusBadge";
import { ArrowUpRightIcon, CalendarIcon, StarIcon, UserIcon } from "./ui/icons";

type OrderCardProps = {
  order: Order;
};

// Present an order; fetching and actions belong to the parent page.
export default function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="card min-w-0 p-5 transition-[border-color,box-shadow] duration-200 hover:border-brand-300 hover:shadow-[0_8px_24px_-12px_rgb(5_51_33/0.2)] motion-reduce:transition-none sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 break-words text-xs font-semibold text-gray-500">
          {order.category.name}
        </p>
        <StatusBadge status={order.status} />
      </div>

      <h2 className="mt-4 text-lg font-bold leading-snug tracking-tight text-gray-900 sm:text-xl">
        <Link
          to={`/orders/${order.id}`}
          className="group rounded-md break-words outline-none transition hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20"
        >
          {order.title}
          <ArrowUpRightIcon className="ml-1.5 inline size-4 align-middle text-gray-400 transition group-hover:text-brand-600" />
        </Link>
      </h2>

      <p className="mt-2 line-clamp-2 break-words text-[15px] leading-relaxed text-gray-500">
        {order.description}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium text-gray-500">Budget</dt>
          <dd className="mt-1 text-xl font-bold tracking-tight text-gray-900">
            {formatMoney(order.budget)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-gray-500">Deadline</dt>
          <dd className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <CalendarIcon className="size-4 shrink-0 text-gray-400" />
            {/* An absent deadline must not be passed to the date formatter. */}
            {order.deadline ? (
              <time dateTime={order.deadline}>{formatDate(order.deadline)}</time>
            ) : (
              "No deadline"
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-gray-500">Proposals</dt>
          <dd className="mt-2 text-sm font-semibold text-gray-700">
            {order.proposalsCount} {order.proposalsCount === 1 ? "proposal" : "proposals"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500" aria-hidden="true">
            <UserIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-gray-800">{order.client.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              {order.client.rating !== null && <StarIcon className="size-3.5 text-amber-400" />}
              <span>
                {order.client.rating !== null && <span className="sr-only">Client rating: </span>}
                {formatRating(order.client.rating)}
              </span>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Posted <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
        </p>
      </div>
    </article>
  );
}
