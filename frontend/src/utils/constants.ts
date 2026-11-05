import type { OrderStatus, ProposalStatus } from "@/types/models";

type StatusStyle = {
  label: string;
  className: string;
};

// Order labels and colours from docs/DESIGN.md.
export const ORDER_STATUS: Record<OrderStatus, StatusStyle> = {
  OPEN: {
    label: "Open",
    className: "bg-brand-50 text-brand-700 ring-brand-600/20",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  REVIEW: {
    label: "In review",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-gray-100 text-gray-700 ring-gray-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

// Proposal labels and colours from docs/DESIGN.md.
export const PROPOSAL_STATUS: Record<ProposalStatus, StatusStyle> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-brand-50 text-brand-700 ring-brand-600/20",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-gray-100 text-gray-600 ring-gray-500/20",
  },
};
