import { useState } from "react";
import { getErrorMessage } from "@/api/client";
import { useAcceptProposal, useGetProposals } from "@/hooks/useProposals";
import { useAuthStore } from "@/store/auth";
import type { OrderStatus, Proposal } from "@/types/models";
import { formatMoney } from "@/utils/format";
import ProposalCard from "@/components/proposals/ProposalCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import { RefreshIcon } from "@/components/ui/icons";

type OrderProposalsProps = {
  orderId: number;
  clientId: number;
  orderStatus: OrderStatus;
};

// Load and display a project's proposals for its author.
export default function OrderProposals({ orderId, clientId, orderStatus }: OrderProposalsProps) {
  const currentUser = useAuthStore((state) => state.user);
  const canView = currentUser?.role === "CLIENT" && currentUser.id === clientId;
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const acceptProposal = useAcceptProposal();

  // Keep the hook unconditional; enabled controls private API access.
  const {
    data: proposals, isPending, isError, error, refetch, isFetching,
  } = useGetProposals(orderId, { enabled: canView });

  // Read the selected offer from the latest list after any refresh.
  const selectedProposal = proposals?.find((proposal) => proposal.id === selectedProposalId);
  const canChoose = canView && orderStatus === "OPEN";
  const canConfirm = canChoose && selectedProposal?.status === "PENDING"
    && !isFetching && !isError && !acceptProposal.isPending;

  const handleChoose = (proposal: Proposal) => {
    if (!canChoose || proposal.status !== "PENDING" || isFetching || acceptProposal.isPending) return;
    acceptProposal.reset();
    setSelectedProposalId(proposal.id);
  };

  const handleClose = () => {
    if (acceptProposal.isPending) return;
    setSelectedProposalId(null);
    acceptProposal.reset();
  };

  const handleAccept = async () => {
    if (!canConfirm || !selectedProposal) return;
    try {
      // The server accepts this offer and rejects the other pending ones.
      await acceptProposal.mutateAsync(selectedProposal.id);
      setSelectedProposalId(null);
    } catch {
      // Keep the confirmation open and display the mutation error.
    }
  };

  if (!canView) return null;

  const confirmation = (
    <Modal
      open={selectedProposalId !== null}
      title="Choose this freelancer?"
      description={selectedProposal
        ? `Choosing ${selectedProposal.freelancer.name} will start this project and reject the other pending proposals.`
        : "This proposal is no longer available. Close this dialog and review the updated list."}
      isBusy={acceptProposal.isPending}
      onClose={handleClose}
    >
      {selectedProposal && (
        <dl className="mt-5 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div><dt className="text-xs text-gray-500">Freelancer</dt><dd className="mt-1 text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">{selectedProposal.freelancer.name}</dd></div>
          <div><dt className="text-xs text-gray-500">Proposed price</dt><dd className="mt-1 text-xl font-bold text-gray-900">{formatMoney(selectedProposal.price)}</dd></div>
        </dl>
      )}
      {acceptProposal.isError && <p role="alert" className="alert-error mt-5">{getErrorMessage(acceptProposal.error)}</p>}
      {selectedProposal && !acceptProposal.isPending && (!canChoose || selectedProposal.status !== "PENDING") && (
        <p role="status" className="mt-4 text-sm text-gray-500">This proposal can no longer be selected.</p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" autoFocus onClick={handleClose} disabled={acceptProposal.isPending} className="btn btn-secondary">Cancel</button>
        <button type="button" onClick={() => { void handleAccept(); }} disabled={!canConfirm} className="btn btn-primary">
          {acceptProposal.isPending ? "Choosing…" : "Confirm selection"}
        </button>
      </div>
    </Modal>
  );

  // The response preserves the viewed flags from before this visit.
  const newCount = proposals?.filter((proposal) => !proposal.viewedByClient).length ?? 0;
  const header = (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={`order-proposals-heading-${orderId}`} className="text-xl font-bold tracking-tight text-gray-900">
            Proposals
          </h2>
          {proposals && !isError && (
            <>
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{proposals.length}</span>
              {newCount > 0 && <span className="badge bg-amber-50 text-amber-700 ring-amber-600/20">{newCount} new</span>}
            </>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Compare offers and see how freelancers would approach your project.
        </p>
      </div>
      {proposals && !isError && (
        <button type="button" onClick={() => { void refetch(); }} disabled={isFetching || acceptProposal.isPending} className="btn btn-secondary btn-sm">
          <RefreshIcon className={`size-4 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      )}
    </header>
  );

  if (isPending) {
    return (
      <section aria-labelledby={`order-proposals-heading-${orderId}`} className="space-y-5">
        {header}
        <div className="card p-6"><Spinner label="Loading proposals…" /></div>
        {confirmation}
      </section>
    );
  }

  if (isError) {
    return (
      <section aria-labelledby={`order-proposals-heading-${orderId}`} className="space-y-5">
        {header}
        <ErrorMessage title="We couldn't load proposals" message={getErrorMessage(error)} onRetry={() => { void refetch(); }} />
        {confirmation}
      </section>
    );
  }

  return (
    <section aria-labelledby={`order-proposals-heading-${orderId}`} aria-busy={isFetching} className="space-y-5">
      {header}
      {acceptProposal.isSuccess && (
        <div role="status" className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-bold text-brand-800">Freelancer selected</p>
          <p className="mt-1 text-sm leading-relaxed text-brand-700">
            {acceptProposal.data.proposal.freelancer.name} is now assigned to this project. The project is in progress.
          </p>
        </div>
      )}
      {proposals.length === 0 ? (
        <EmptyState
          title="No proposals yet"
          description="Freelancer offers for this project will appear here. Use Refresh to check for new proposals."
        />
      ) : (
        // Cards only present data; this component owns the request.
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onChoose={canChoose && proposal.status === "PENDING" ? () => handleChoose(proposal) : undefined}
              isChoosing={acceptProposal.isPending && acceptProposal.variables === proposal.id}
              disabled={isFetching || acceptProposal.isPending}
            />
          ))}
        </div>
      )}
      {confirmation}
    </section>
  );
}
