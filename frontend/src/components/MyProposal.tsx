import { useState } from "react";
import { isAxiosError } from "axios";
import { getErrorMessage } from "@/api/client";
import { useDeleteProposal, useGetMyProposals } from "@/hooks/useProposals";
import { useAuthStore } from "@/store/auth";
import type { OrderStatus } from "@/types/models";
import { formatDateTime, formatMoney } from "@/utils/format";
import ProposalForm from "./ProposalForm";
import StatusBadge from "./StatusBadge";
import ErrorMessage from "./ui/ErrorMessage";
import Spinner from "./ui/Spinner";
import Modal from "./ui/Modal";
import { MailIcon } from "./ui/icons";

type MyProposalProps = {
  orderId: number;
  orderStatus: OrderStatus;
};

// Show the current freelancer's proposal or an application form.
export default function MyProposal({ orderId, orderStatus }: MyProposalProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteProposal = useDeleteProposal();

  // The API filters by both the signed-in freelancer and this order.
  const myProposals = useGetMyProposals({ orderId });
  const proposal = myProposals.data?.items.find((item) => item.orderId === orderId);

  // Keep confirmation open on errors so the freelancer can retry.
  const handleDelete = async () => {
    if (!proposal || deleteProposal.isPending || orderStatus !== "OPEN"
      || proposal.status !== "PENDING" || proposal.freelancerId !== currentUser?.id) return;
    try {
      await deleteProposal.mutateAsync(proposal.id);
      setIsDeleteOpen(false);
    } catch (error) {
      // Another request may have already removed this proposal.
      if (isAxiosError(error) && error.response?.status === 404) setIsDeleteOpen(false);
    }
  };

  if (currentUser?.role !== "FREELANCER") return null;

  // Wait for a fresh check before showing an empty application form.
  if (myProposals.isPending || (!proposal && myProposals.isFetching)) {
    return (
      <div className="card p-6 sm:p-8">
        <Spinner label="Checking your proposal…" />
      </div>
    );
  }

  // A failed check must not be treated as "you haven't applied".
  if (myProposals.isError) {
    return (
      <ErrorMessage
        title="We couldn't check your proposal"
        message={getErrorMessage(myProposals.error)}
        onRetry={() => { void myProposals.refetch(); }}
      />
    );
  }

  // Keep existing proposals visible in every order status.
  if (proposal) {
    const canEdit = orderStatus === "OPEN" && proposal.status === "PENDING"
      && proposal.freelancerId === currentUser.id;

    // Mount the shared form with saved values; Cancel discards its draft.
    if (isEditing && canEdit) {
      return (
        <ProposalForm
          key={proposal.id}
          orderId={orderId}
          proposal={proposal}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      );
    }

    return (
      <section aria-labelledby={`my-proposal-heading-${orderId}`} className="card min-w-0 overflow-hidden">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-6 sm:p-8">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-500">
              <MailIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id={`my-proposal-heading-${orderId}`} className="text-xl font-bold tracking-tight text-gray-900">
                Your proposal
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">You have already applied to this project.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={proposal.status} />
            {canEdit && (
              <>
                <button type="button" onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">Edit proposal</button>
                <button type="button" onClick={() => { deleteProposal.reset(); setIsDeleteOpen(true); }} className="btn btn-danger btn-sm">Delete proposal</button>
              </>
            )}
          </div>
        </header>

        <div className="space-y-6 p-6 sm:p-8">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Your offer</dt>
              <dd className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900">{formatMoney(proposal.price)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-gray-500">Sent on</dt>
              <dd className="mt-2 text-sm font-semibold leading-relaxed text-gray-700">
                <time dateTime={proposal.createdAt}>{formatDateTime(proposal.createdAt)}</time>
              </dd>
            </div>
          </dl>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-900">Your cover letter</h3>
            <p className="mt-3 text-[15px] leading-7 whitespace-pre-wrap text-gray-600 [overflow-wrap:anywhere]">
              {proposal.coverLetter}
            </p>
          </div>
        </div>

        <footer className="border-t border-gray-100 bg-gray-50/60 px-6 py-4 text-xs leading-relaxed text-gray-500 sm:px-8">
          One active proposal per project. Pending proposals can be edited or deleted while the project is open.
        </footer>

        <Modal
          open={isDeleteOpen}
          title="Delete your proposal?"
          description="Your offer and cover letter will be permanently deleted. You can send a new proposal while the project is open."
          isBusy={deleteProposal.isPending}
          onClose={() => setIsDeleteOpen(false)}
        >
          {deleteProposal.isError && <p role="alert" className="alert-error mt-5">{getErrorMessage(deleteProposal.error)}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" autoFocus disabled={deleteProposal.isPending} onClick={() => setIsDeleteOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="button" disabled={deleteProposal.isPending || !canEdit} onClick={() => { void handleDelete(); }} className="btn btn-danger">
              {deleteProposal.isPending ? "Deleting…" : "Delete proposal"}
            </button>
          </div>
        </Modal>
      </section>
    );
  }

  // No proposal exists; only open projects accept a new one.
  if (orderStatus !== "OPEN") return null;

  return <ProposalForm orderId={orderId} />;
}
