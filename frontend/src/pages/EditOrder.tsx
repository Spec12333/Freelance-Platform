import { isAxiosError } from "axios";
import { useEffect, useRef } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon, BriefcaseIcon, ChevronDownIcon, LayersIcon } from "@/components/ui/icons";
import { useGetCategories } from "@/hooks/useCategories";
import { useOrder, useUpdateOrder } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/auth";
import type { ApiErrorBody, UpdateOrderBody } from "@/types/api";
import { formatDate, formatMoney } from "@/utils/format";
import NotFound from "./NotFound";

// The date input uses a local string; the API accepts ISO or null.
type OrderFormValues = {
  title: string;
  description: string;
  categoryId: number;
  budget: number;
  deadline: string;
};

const FORM_FIELDS = ["title", "description", "categoryId", "budget", "deadline"] as const;

// Convert an API timestamp to the browser's local date and time.
const toLocalDateTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString().slice(0, 16);
};

// Edit an open order owned by the current client.
export default function EditOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);
  const isValidId = Number.isSafeInteger(orderId) && orderId > 0;
  const { data: order, isPending, isError, error, refetch } = useOrder(orderId);
  const categories = useGetCategories();
  const currentUser = useAuthStore((state) => state.user);
  const updateOrder = useUpdateOrder();
  const initializedOrderId = useRef<number | null>(null);
  const {
    register, handleSubmit, reset, setError, clearErrors,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<OrderFormValues>({
    defaultValues: { title: "", description: "", categoryId: 0, budget: 0, deadline: "" },
  });
  const isSaving = isSubmitting || updateOrder.isPending;

  // Fill once per order so background refetches do not erase edits.
  useEffect(() => {
    if (!order || initializedOrderId.current === order.id) return;
    reset({
      title: order.title,
      description: order.description,
      categoryId: order.categoryId,
      budget: order.budget,
      deadline: toLocalDateTime(order.deadline),
    });
    initializedOrderId.current = order.id;
  }, [order, reset]);

  const handleSave: SubmitHandler<OrderFormValues> = async (data) => {
    if (!order || updateOrder.isPending || currentUser?.role !== "CLIENT"
      || currentUser.id !== order.clientId || order.status !== "OPEN") return;
    clearErrors();

    // PATCH only changed fields; an unchanged past deadline stays untouched.
    const body: UpdateOrderBody = {};
    if (dirtyFields.title) body.title = data.title.trim();
    if (dirtyFields.description) body.description = data.description.trim();
    if (dirtyFields.categoryId) body.categoryId = data.categoryId;
    if (dirtyFields.budget) body.budget = data.budget;
    if (dirtyFields.deadline) body.deadline = data.deadline ? new Date(data.deadline).toISOString() : null;
    if (Object.keys(body).length === 0) return;

    try {
      await updateOrder.mutateAsync({ id: orderId, body });
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (saveError) {
      // Attach API validation messages to their matching fields.
      if (isAxiosError<ApiErrorBody>(saveError)) {
        let focusField = true;
        for (const detail of saveError.response?.data?.details ?? []) {
          const field = FORM_FIELDS.find((name) => name === detail.field);
          if (field) {
            setError(field, { type: "server", message: detail.message }, { shouldFocus: focusField });
            focusField = false;
          }
        }
      }
      setError("root.server", { message: getErrorMessage(saveError) });
    }
  };

  const backLink = (
    <Link
      to={isValidId ? `/orders/${orderId}` : "/orders"}
      aria-disabled={isSaving || undefined}
      tabIndex={isSaving ? -1 : undefined}
      className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-gray-500 outline-none transition hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20 ${isSaving ? "pointer-events-none opacity-60" : ""}`}
    >
      <ArrowLeftIcon className="size-4" />
      Back to project
    </Link>
  );

  if (!isValidId || (isAxiosError(error) && error.response?.status === 404)) {
    return (
      <div className="space-y-6">
        <h1 className="sr-only">Order not found</h1>
        <EmptyState title="Order not found" description="This project doesn't exist or is no longer available."
          action={{ label: "Explore projects", onClick: () => navigate("/orders") }} />
      </div>
    );
  }
  if (isPending) {
    return <div className="space-y-6">{backLink}<div className="card p-8"><Spinner label="Loading your project…" /></div></div>;
  }
  if (isError) {
    return <div className="space-y-6">{backLink}<ErrorMessage title="We couldn't load this project" message={getErrorMessage(error)} onRetry={() => { void refetch(); }} /></div>;
  }
  if (currentUser?.role !== "CLIENT" || currentUser.id !== order.clientId) {
    return <div className="space-y-6">{backLink}<NotFound code={403} inline /></div>;
  }
  if (order.status !== "OPEN") {
    return <div className="space-y-6">{backLink}<EmptyState title="This project can't be edited" description="You can edit a project only while its status is Open."
      action={{ label: "View project", onClick: () => navigate(`/orders/${orderId}`) }} /></div>;
  }
  if (categories.isPending) {
    return <div className="space-y-6">{backLink}<div className="card p-8"><Spinner label="Loading categories…" /></div></div>;
  }
  if (categories.isError) {
    return <div className="space-y-6">{backLink}<ErrorMessage title="We couldn't load categories" message={getErrorMessage(categories.error)} onRetry={() => { void categories.refetch(); }} /></div>;
  }

  return (
    <div className="space-y-7">
      {backLink}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
            <BriefcaseIcon className="size-4" /> Your workspace
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Edit your project</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-500">Fine-tune your brief so the right freelancers can find you.</p>
        </div>
        <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500">Project #{order.id}</span>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form noValidate onSubmit={handleSubmit(handleSave)} aria-busy={isSaving} className="card min-w-0 overflow-hidden">
          <fieldset disabled={isSaving} className="min-w-0">
            {/* 1. Project details and category. */}
            <section aria-labelledby="edit-project-details" className="space-y-6 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-xs font-bold text-gray-500">01</span>
                <div>
                  <h2 id="edit-project-details" className="text-lg font-bold tracking-tight text-gray-900">Project details</h2>
                  <p className="mt-1 text-sm text-gray-500">A clear title and a thoughtful brief go a long way.</p>
                </div>
              </div>

              <div>
                <label htmlFor="edit-order-title" className="field-label">Project title</label>
                <input id="edit-order-title" className="input" maxLength={120} placeholder="e.g. Build a landing page for a creative studio"
                  aria-invalid={!!errors.title} aria-describedby={errors.title ? "edit-title-error" : "edit-title-hint"}
                  {...register("title", {
                    required: "Please enter a project title.",
                    validate: (value) => (value.trim().length >= 5 && value.trim().length <= 120) || "Use between 5 and 120 characters.",
                  })} />
                {errors.title ? <p id="edit-title-error" className="field-error">{errors.title.message}</p>
                  : <p id="edit-title-hint" className="field-hint">Be specific about what you need. 5–120 characters.</p>}
              </div>

              <div>
                <label htmlFor="edit-order-category" className="field-label">Category</label>
                <div className="relative">
                  <span className="input-icon"><LayersIcon className="size-4" /></span>
                  <select id="edit-order-category" className="input pl-10" aria-invalid={!!errors.categoryId}
                    aria-describedby={errors.categoryId ? "edit-category-error" : undefined}
                    {...register("categoryId", {
                      valueAsNumber: true,
                      required: "Please choose a category.",
                      validate: (value) => categories.data.some((category) => category.id === value) || "Choose an available category.",
                    })}>
                    <option value="" disabled>Select a category</option>
                    {categories.data.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.categoryId && <p id="edit-category-error" className="field-error">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label htmlFor="edit-order-description" className="field-label">Project description</label>
                <textarea id="edit-order-description" rows={9} maxLength={5000} className="input h-auto min-h-52 resize-y py-3 leading-relaxed"
                  placeholder="Describe your goals, deliverables and anything a freelancer should know."
                  aria-invalid={!!errors.description} aria-describedby={errors.description ? "edit-description-error" : "edit-description-hint"}
                  {...register("description", {
                    required: "Please describe your project.",
                    validate: (value) => (value.trim().length >= 20 && value.trim().length <= 5000) || "Use between 20 and 5,000 characters.",
                  })} />
                {errors.description ? <p id="edit-description-error" className="field-error">{errors.description.message}</p>
                  : <p id="edit-description-hint" className="field-hint">Include your goals, expected results and requirements. 20–5,000 characters.</p>}
              </div>
            </section>

            {/* 2. Budget and optional local deadline. */}
            <section aria-labelledby="edit-project-budget" className="space-y-6 border-t border-gray-100 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-xs font-bold text-gray-500">02</span>
                <div>
                  <h2 id="edit-project-budget" className="text-lg font-bold tracking-tight text-gray-900">Budget & timeline</h2>
                  <p className="mt-1 text-sm text-gray-500">Set expectations before the work begins.</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor="edit-order-budget" className="field-label">Project budget</label>
                  <div className="relative">
                    <span aria-hidden="true" className="input-icon text-sm font-semibold">$</span>
                    <input id="edit-order-budget" type="number" min={1} max={1_000_000} step={1} className="input pl-9"
                      aria-invalid={!!errors.budget} aria-describedby={errors.budget ? "edit-budget-error" : "edit-budget-hint"}
                      {...register("budget", {
                        valueAsNumber: true,
                        required: "Please enter a budget.",
                        min: { value: 1, message: "The minimum budget is $1." },
                        max: { value: 1_000_000, message: "The maximum budget is $1,000,000." },
                        validate: (value) => Number.isInteger(value) || "Enter a whole-dollar amount.",
                      })} />
                  </div>
                  {errors.budget ? <p id="edit-budget-error" className="field-error">{errors.budget.message}</p>
                    : <p id="edit-budget-hint" className="field-hint">USD · Whole amounts only.</p>}
                </div>

                <div className="min-w-0">
                  <label htmlFor="edit-order-deadline" className="field-label">Deadline <span className="font-normal text-gray-400">(optional)</span></label>
                  <input id="edit-order-deadline" type="datetime-local" step={60} className="input min-w-0 max-w-full text-sm"
                    aria-invalid={!!errors.deadline} aria-describedby={errors.deadline ? "edit-deadline-error" : "edit-deadline-hint"}
                    {...register("deadline", {
                      validate: (value) => !dirtyFields.deadline || !value || new Date(value).getTime() > Date.now() || "Choose a future date and time.",
                    })} />
                  {errors.deadline ? <p id="edit-deadline-error" className="field-error">{errors.deadline.message}</p>
                    : <p id="edit-deadline-hint" className="field-hint">Your local time. Clear to remove.</p>}
                </div>
              </div>
            </section>
          </fieldset>

          {/* 3. Save only after validation succeeds. */}
          <footer className="space-y-4 border-t border-gray-100 bg-gray-50/60 p-6 sm:px-8">
            {errors.root?.server && <p role="alert" className="alert-error">{errors.root.server.message}</p>}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" className="text-xs text-gray-500">{isSaving ? "Saving your changes…" : isDirty ? "You have unsaved changes." : "Make a change to enable saving."}</p>
              <div className="flex gap-3">
                <button type="button" disabled={isSaving} onClick={() => navigate(`/orders/${orderId}`)} className="btn btn-secondary flex-1 sm:flex-none">Cancel</button>
                <button type="submit" disabled={!isDirty || isSaving} className="btn btn-primary flex-1 sm:flex-none">{isSaving ? "Saving…" : "Save changes"}</button>
              </div>
            </div>
          </footer>
        </form>

        <aside aria-label="Published project" className="card min-w-0 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/60 p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Published project</p>
            <StatusBadge status={order.status} />
            <h2 className="mt-4 text-lg leading-snug font-bold tracking-tight text-gray-900 [overflow-wrap:anywhere]">{order.title}</h2>
            <p className="mt-2 text-xs text-gray-500">Posted <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time></p>
          </div>
          <dl className="space-y-5 p-6">
            <div><dt className="text-xs text-gray-500">Current budget</dt><dd className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{formatMoney(order.budget)}</dd></div>
            <div><dt className="text-xs text-gray-500">Category</dt><dd className="mt-1 text-sm font-semibold text-gray-800 [overflow-wrap:anywhere]">{order.category.name}</dd></div>
            <div><dt className="text-xs text-gray-500">Project owner</dt><dd className="mt-1 text-sm font-semibold text-gray-800 [overflow-wrap:anywhere]">{order.client.name}</dd></div>
          </dl>
          <div className="mx-6 mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">A clear brief makes a difference.</p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">Keep your goals, deliverables and budget up to date so freelancers know what to expect.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
