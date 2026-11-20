import { useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "@/api/client";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/auth";
import type { Order } from "@/types/models";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { ArrowUpRightIcon, BriefcaseIcon } from "@/components/ui/icons";

type OrderActionsProps = {
  order: Order;
};

type ActionStatus = "REVIEW" | "COMPLETED" | "CANCELLED";

// Each action explains the exact status change before confirmation.
const actions = {
  REVIEW: {
    title: "Submit work for review?",
    description: "Confirm that your work is ready. The project will move to review so the client can check it and mark it as complete.",
    label: "Submit for review",
    pendingLabel: "Submitting…",
    successMessage: "Work submitted. The project is now waiting for the client's review.",
  },
  COMPLETED: {
    title: "Complete this project?",
    description: "Confirm that you have reviewed and accepted the work. The project will be marked as completed. This action cannot be undone.",
    label: "Complete project",
    pendingLabel: "Completing…",
    successMessage: "Project completed. Thank you for working together!",
  },
  CANCELLED: {
    title: "Cancel this project?",
    description: "The project will stay in your history, and pending proposals will be rejected. This action cannot be undone.",
    label: "Cancel project",
    pendingLabel: "Cancelling…",
    successMessage: "Project cancelled. It remains available in your project history.",
  },
};

// Show the next step only to the client or the assigned freelancer.
export default function OrderActions({ order }: OrderActionsProps) {
  const currentUser = useAuthStore((state) => state.user);
  const updateStatus = useUpdateOrderStatus();
  const [selectedAction, setSelectedAction] = useState<{
    status: ActionStatus;
    fromStatus: Order["status"];
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const isClient = currentUser?.role === "CLIENT" && currentUser.id === order.clientId;
  const isFreelancer = currentUser?.role === "FREELANCER" && currentUser.id === order.freelancerId;
  const canSubmit = isFreelancer && order.status === "IN_PROGRESS";
  const canComplete = isClient && order.status === "REVIEW";
  const canCancel = isClient && (order.status === "OPEN" || order.status === "IN_PROGRESS");

  const isAllowed = (status: ActionStatus) => {
    if (status === "REVIEW") return canSubmit;
    if (status === "COMPLETED") return canComplete;
    return canCancel;
  };

  const handleOpen = (status: ActionStatus) => {
    if (!isAllowed(status) || updateStatus.isPending) return;
    updateStatus.reset();
    setSuccessMessage("");
    // Remember the current status so a refreshed project needs a new confirmation.
    setSelectedAction({ status, fromStatus: order.status });
  };

  const handleClose = () => {
    if (updateStatus.isPending) return;
    setSelectedAction(null);
    updateStatus.reset();
  };

  const canConfirm = selectedAction !== null && isAllowed(selectedAction.status)
    && selectedAction.fromStatus === order.status;
  const action = selectedAction ? actions[selectedAction.status] : null;

  const handleConfirm = async () => {
    if (!selectedAction || !action || !canConfirm || updateStatus.isPending) return;
    try {
      // Update the UI only after the backend confirms the transition.
      await updateStatus.mutateAsync({ id: order.id, status: selectedAction.status });
      setSuccessMessage(action.successMessage);
      setSelectedAction(null);
    } catch {
      // Keep the dialog open so the user can read the error and retry.
    }
  };

  if (!isClient && !isFreelancer) return null;

  const descriptions = {
    OPEN: "Compare proposals and choose a freelancer to start your project.",
    IN_PROGRESS: isFreelancer
      ? "Working on this project? When your work is ready, send it to the client for review."
      : "Your freelancer is working on the project. You can complete it once they submit the work for review.",
    REVIEW: isClient
      ? "Your freelancer has submitted the work. Review the result and complete the project when you are happy with it."
      : "Your work is waiting for the client's review. The client will mark the project as complete after accepting it.",
    COMPLETED: "This project is complete. No further status changes are available.",
    CANCELLED: "This project has been cancelled. Its details remain available for reference.",
  };

  return (
    <section aria-labelledby={`order-actions-heading-${order.id}`} aria-busy={updateStatus.isPending} className="card min-w-0 overflow-hidden">
      <header className="flex items-start gap-3 border-b border-gray-100 p-6">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <BriefcaseIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id={`order-actions-heading-${order.id}`} className="text-base font-bold text-gray-900">Project progress</h2>
          <p className="mt-1 text-xs text-gray-500">{isClient ? "Manage your project" : "Your next step"}</p>
        </div>
      </header>

      <div className="space-y-5 p-6">
        <StatusBadge status={order.status} />
        <p className="text-sm leading-relaxed text-gray-500">{descriptions[order.status]}</p>

        {order.freelancer && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-500">Assigned freelancer</p>
            <Link to={`/freelancers/${order.freelancer.id}`} className="mt-2 inline-flex max-w-full items-start gap-2 rounded-md text-sm font-bold text-gray-900 outline-none transition hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20">
              <span className="[overflow-wrap:anywhere]">{order.freelancer.name}</span>
              <ArrowUpRightIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
            </Link>
          </div>
        )}

        {successMessage && <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-brand-800">{successMessage}</p>}

        {/* Match the backend's participant and status rules. */}
        {(canSubmit || canComplete || canCancel) && (
          <div className="space-y-3 border-t border-gray-100 pt-5">
            {canSubmit && <button type="button" onClick={() => handleOpen("REVIEW")} disabled={updateStatus.isPending} className="btn btn-primary w-full">Submit for review</button>}
            {canComplete && <button type="button" onClick={() => handleOpen("COMPLETED")} disabled={updateStatus.isPending} className="btn btn-primary w-full">Complete project</button>}
            {canCancel && <button type="button" onClick={() => handleOpen("CANCELLED")} disabled={updateStatus.isPending} className="btn btn-danger w-full">Cancel project</button>}
          </div>
        )}
      </div>

      <Modal
        open={selectedAction !== null}
        title={action?.title ?? "Confirm project action"}
        description={action?.description ?? ""}
        isBusy={updateStatus.isPending}
        onClose={handleClose}
      >
        <p className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold text-gray-800 [overflow-wrap:anywhere]">{order.title}</p>
        {updateStatus.isError && <p role="alert" className="alert-error mt-5">{getErrorMessage(updateStatus.error)}</p>}
        {selectedAction && !canConfirm && !updateStatus.isPending && <p role="status" className="mt-4 text-sm text-gray-500">The project has changed. Close this dialog and review its current status.</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" autoFocus onClick={handleClose} disabled={updateStatus.isPending} className="btn btn-secondary">Keep current status</button>
          <button type="button" onClick={() => { void handleConfirm(); }} disabled={!canConfirm || updateStatus.isPending} className={`btn ${selectedAction?.status === "CANCELLED" ? "btn-danger" : "btn-primary"}`}>
            {updateStatus.isPending ? action?.pendingLabel : action?.label}
          </button>
        </div>
      </Modal>
    </section>
  );
}
