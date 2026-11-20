import { Link } from "react-router-dom";
import type { Order } from "@/types/models";
import { formatDate, formatMoney, formatRating } from "@/utils/format";
import StatusBadge from "@/components/ui/StatusBadge";
import { ArrowUpRightIcon, CalendarIcon, StarIcon } from "@/components/ui/icons";
import Avatar from "@/components/ui/Avatar";

type OrderCardProps = {
  order: Order;
};

// Present an order; fetching and actions belong to the parent page.
export default function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="group/card card min-w-0 p-6 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_12px_30px_-20px_rgb(21_44_25/0.25)] motion-reduce:transform-none motion-reduce:transition-none sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 rounded-full bg-cream px-3 py-1.5 text-[10px] font-semibold text-gray-600 [overflow-wrap:anywhere]">
          {order.category.name}
        </p>
        <StatusBadge status={order.status} />
      </div>

      <h2 className="mt-5 text-xl font-semibold leading-snug tracking-tight text-gray-900 sm:text-[22px]">
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
          <dd className="mt-1 font-display text-[28px] tracking-tight text-gray-900">
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
          <Avatar user={order.client} className="size-9 text-xs" />
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-gray-800">{order.client.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              {order.client.rating !== null && <StarIcon className="size-3.5 text-brand-600" />}
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
