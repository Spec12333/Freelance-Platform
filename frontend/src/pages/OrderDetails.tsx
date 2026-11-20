import { isAxiosError } from "axios";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDeleteOrder, useOrder } from "@/hooks/useOrders";
import { getErrorMessage } from "@/api/client";
import StatusBadge from "@/components/ui/StatusBadge";
import MyProposal from "@/components/proposals/MyProposal";
import OrderProposals from "@/components/proposals/OrderProposals";
import OrderActions from "@/components/orders/OrderActions";
import OrderChat from "@/components/chat/OrderChat";
import OrderReviews from "@/components/reviews/OrderReviews";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChatIcon,
  LayersIcon,
  StarIcon,
} from "@/components/ui/icons";
import { formatDate, formatMoney, formatRating } from "@/utils/format";
import { useAuthStore } from "@/store/auth";

// Load one order and present its brief, budget and client.
export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);
  const isValidId = Number.isSafeInteger(orderId) && orderId > 0;
  const { data: order, isPending, isError, error, refetch } = useOrder(orderId);
  const currentUser = useAuthStore((state) => state.user);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteOrder = useDeleteOrder();
  const canEdit =
    currentUser?.role === "CLIENT" &&
    currentUser.id === order?.clientId &&
    order.status === "OPEN";

  // Navigate only after the server confirms deletion.
  const handleDelete = async () => {
    if (!order || !canEdit || deleteOrder.isPending) return;
    try {
      await deleteOrder.mutateAsync(order.id);
      setIsDeleteOpen(false);
      navigate("/orders", { replace: true });
    } catch {
      // The modal displays the mutation error and allows retry.
    }
  };
  const backLink = (
    <Link
      to="/orders"
      className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-gray-500 outline-none transition hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20"
    >
      <ArrowLeftIcon className="size-4" />
      Back to projects
    </Link>
  );

  // A missing order is different from an unavailable server.
  const isNotFound =
    !isValidId || (isAxiosError(error) && error.response?.status === 404);
  if (isNotFound) {
    return (
      <div className="space-y-6">
        {backLink}
        <h1 className="sr-only">Order not found</h1>
        <EmptyState
          title="Order not found"
          description="This project doesn't exist or is no longer available. Explore the marketplace to find another one."
          action={{
            label: "Explore projects",
            onClick: () => navigate("/orders"),
          }}
        />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        {backLink}
        <div className="card flex min-h-80 items-center justify-center p-6">
          <Spinner label="Loading project details…" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        {backLink}
        <ErrorMessage
          title="We couldn't load this project"
          message={getErrorMessage(error)}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }


  // Freelancers can view their proposal even after the project closes.
  const canViewMyProposal = currentUser?.role === "FREELANCER"
    && currentUser.id !== order.clientId;

  return (
    <div className="space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-3 text-sm"
      >
        {backLink}
        <span aria-hidden="true" className="text-gray-300">
          /
        </span>
        <span aria-current="page" className="text-gray-400">
          Project #{order.id}
        </span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* Project brief. */}
          <article className="card min-w-0 overflow-hidden">
            <header className="border-b border-gray-100 p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-gray-500">
                  <LayersIcon className="size-4 shrink-0" />
                  <span className="[overflow-wrap:anywhere]">
                    {order.category.name}
                  </span>
                </span>
                <StatusBadge status={order.status} />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="min-w-0 flex-1 font-display text-4xl leading-[1.1] tracking-tight text-ink [overflow-wrap:anywhere] sm:text-[46px]">
                  {order.title}
                </h1>
                {canEdit && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link to={`/orders/${orderId}/edit`} className="btn btn-secondary">Edit Order</Link>
                    <button type="button" onClick={() => { deleteOrder.reset(); setIsDeleteOpen(true); }} className="btn btn-danger">Delete project</button>
                  </div>
                )}
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
                <CalendarIcon className="size-4 shrink-0 text-gray-400" />
                <span>
                  Posted{" "}
                  <time dateTime={order.createdAt}>
                    {formatDate(order.createdAt)}
                  </time>
                </span>
                <span aria-hidden="true" className="text-gray-300">
                  ·
                </span>
                <span>Project #{order.id}</span>
              </p>
            </header>

            <section aria-labelledby="project-description" className="p-6 sm:p-8">
              <h2
                id="project-description"
                className="font-display text-2xl tracking-tight text-ink"
              >
                About the project
              </h2>
              {/* Preserve the client's paragraphs and line breaks. */}
              <p className="mt-5 text-[15px] leading-7 whitespace-pre-wrap text-gray-600 [overflow-wrap:anywhere]">
                {order.description}
              </p>
            </section>

            <footer className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4 text-xs text-gray-500 sm:px-8">
              <BriefcaseIcon className="size-4 shrink-0 text-gray-400" />
              <span>
                Last updated{" "}
                <time dateTime={order.updatedAt}>
                  {formatDate(order.updatedAt)}
                </time>
              </span>
            </footer>
          </article>

          <OrderReviews key={`reviews-${currentUser?.id}-${order.id}`} order={order} />

          <OrderChat key={`chat-${currentUser?.id}-${order.id}`} order={order} />

          <OrderProposals
            key={`proposals-${currentUser?.id}-${order.id}`}
            orderId={order.id}
            clientId={order.clientId}
            orderStatus={order.status}
          />

          {canViewMyProposal && (
            <MyProposal
              key={`${currentUser?.id}-${order.id}`}
              orderId={order.id}
              orderStatus={order.status}
            />
          )}
        </div>

        <aside aria-label="Project information" className="min-w-0 space-y-6">
          <OrderActions key={`actions-${currentUser?.id}-${order.id}`} order={order} />

          {/* Budget and project facts. */}
          <section aria-labelledby="project-budget" className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="project-budget"
                className="text-xs font-bold uppercase tracking-wider text-gray-500"
              >
                Project budget
              </h2>
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-xl bg-gray-50 text-gray-400 ring-1 ring-gray-100"
              >
                <BriefcaseIcon className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-5xl tracking-tight text-ink [overflow-wrap:anywhere]">
              {formatMoney(order.budget)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              USD · Total project budget
            </p>

            <dl className="mt-6 space-y-5 border-t border-gray-100 pt-6">
              <div className="flex items-start gap-3">
                <CalendarIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <dt className="text-xs text-gray-500">Deadline</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-800">
                    {/* A deadline is optional in the API. */}
                    {order.deadline ? (
                      <time dateTime={order.deadline}>
                        {formatDate(order.deadline)}
                      </time>
                    ) : (
                      "No deadline set"
                    )}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LayersIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <dt className="text-xs text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-800 [overflow-wrap:anywhere]">
                    {order.category.name}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ChatIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Proposals received</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-800">
                    {order.proposalsCount}{" "}
                    {order.proposalsCount === 1 ? "proposal" : "proposals"}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Client details from the order response. */}
          <section aria-labelledby="project-client" className="card p-6">
            <h2
              id="project-client"
              className="text-base font-bold text-gray-900"
            >
              About the client
            </h2>
            <div className="mt-5 flex items-start gap-3">
              <Avatar user={order.client} />
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
                  {order.client.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">Project owner</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm">
              <StarIcon
                className={`size-4 shrink-0 ${order.client.rating === null ? "text-gray-300" : "text-brand-600"}`}
              />
              <span className="font-semibold text-gray-800">
                {formatRating(order.client.rating)}
              </span>
              {order.client.rating !== null && (
                <span className="text-xs text-gray-500">Client rating</span>
              )}
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={isDeleteOpen}
        title="Delete this project?"
        description={`“${order.title}” and all its proposals, messages and reviews will be permanently deleted. This cannot be undone.`}
        isBusy={deleteOrder.isPending}
        onClose={() => setIsDeleteOpen(false)}
      >
        {deleteOrder.isError && <p role="alert" className="alert-error mt-5">{getErrorMessage(deleteOrder.error)}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" autoFocus disabled={deleteOrder.isPending} onClick={() => setIsDeleteOpen(false)} className="btn btn-secondary">Cancel</button>
          <button type="button" disabled={deleteOrder.isPending || !canEdit} onClick={() => { void handleDelete(); }} className="btn btn-danger">
            {deleteOrder.isPending ? "Deleting…" : "Delete project"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
