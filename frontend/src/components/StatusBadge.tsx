import type { OrderStatus, ProposalStatus } from "@/types/models";
import { ORDER_STATUS, PROPOSAL_STATUS } from "@/utils/constants";

const STATUS_STYLES = { ...ORDER_STATUS, ...PROPOSAL_STATUS };

type StatusBadgeProps = {
  status: OrderStatus | ProposalStatus;
  className?: string;
};

// Display an order or proposal status using the shared labels and colours.
export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <span className={`badge gap-1.5 whitespace-nowrap ${style.className} ${className}`}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {style.label}
    </span>
  );
}
