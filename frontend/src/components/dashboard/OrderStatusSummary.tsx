import StatusBadge from "@/components/ui/StatusBadge";
import type { OrderStatus } from "@/types/models";
import { ORDER_STATUS } from "@/utils/constants";

type OrderStatusSummaryProps = {
  counts: Record<OrderStatus, number>;
};

// The API always includes every status, even when its count is zero.
export default function OrderStatusSummary({ counts }: OrderStatusSummaryProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <section aria-labelledby="dashboard-status-heading" className="card p-6">
      <p className="eyebrow text-brand-700">The full picture</p>
      <div className="mt-3 flex items-center justify-between gap-4"><h2 id="dashboard-status-heading" className="font-display text-2xl tracking-tight text-ink">Projects by status</h2><span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-gray-600">{total} total</span></div>
      <dl className="mt-6 space-y-5">
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((status) => (
          <div key={status}>
            <div className="flex items-center justify-between gap-3"><dt><StatusBadge status={status} /></dt><dd className="text-sm font-semibold text-ink">{counts[status]}</dd></div>
            <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${total === 0 ? 0 : counts[status] / total * 100}%` }} /></div>
          </div>
        ))}
      </dl>
    </section>
  );
}
