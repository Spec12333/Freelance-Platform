import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/api/client";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  LayersIcon,
} from "@/components/ui/icons";
import { useGetCategories } from "@/hooks/useCategories";
import { useCreateOrder } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/auth";
import type { ApiErrorBody, CreateOrderBody } from "@/types/api";
import NotFound from "./NotFound";

// The date input holds local time; the request sends ISO or null.
type OrderFormValues = {
  title: string;
  description: string;
  categoryId: number;
  budget: number;
  deadline: string;
};

const FORM_FIELDS = ["title", "description", "categoryId", "budget", "deadline"] as const;

// Create and publish a project for the current client.
export default function CreateOrder() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [serverError, setServerError] = useState("");

  // Load category options and prepare the create mutation.
  const categories = useGetCategories();
  const createOrder = useCreateOrder();

  // Start with empty fields; zero means no category is selected.
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    defaultValues: { title: "", description: "", categoryId: 0, deadline: "" },
  });

  // Keep the form locked until the request and cache updates finish.
  const isSaving = isSubmitting || createOrder.isPending;

  const handleCreate: SubmitHandler<OrderFormValues> = async (data) => {
    if (currentUser?.role !== "CLIENT" || createOrder.isPending) return;
    setServerError("");

    // Trim text and convert the optional local deadline for the API.
    const body: CreateOrderBody = {
      title: data.title.trim(),
      description: data.description.trim(),
      categoryId: data.categoryId,
      budget: data.budget,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
    };

    try {
      // The hook refreshes related queries after the order is created.
      const order = await createOrder.mutateAsync(body);
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (error) {
      // Match API validation messages to the form's field names.
      if (isAxiosError<ApiErrorBody>(error)) {
        for (const detail of error.response?.data?.details ?? []) {
          const field = FORM_FIELDS.find((name) => name === detail.field);
          if (field) {
            setError(field, { type: "server", message: detail.message });
          }
        }
      }
      setServerError(getErrorMessage(error));
    }
  };

  const backLink = (
    <Link
      to="/orders"
      aria-disabled={isSaving || undefined}
      tabIndex={isSaving ? -1 : undefined}
      className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-gray-500 outline-none transition hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20 ${isSaving ? "pointer-events-none opacity-60" : ""}`}
    >
      <ArrowLeftIcon className="size-4" />
      Back to projects
    </Link>
  );

  // The route also restricts this page to clients.
  if (currentUser?.role !== "CLIENT") {
    return <NotFound code={403} inline />;
  }

  if (categories.isPending) {
    return (
      <div className="space-y-6">
        {backLink}
        <div className="card p-8">
          <Spinner label="Preparing your project form…" />
        </div>
      </div>
    );
  }

  if (categories.isError) {
    return (
      <div className="space-y-6">
        {backLink}
        <ErrorMessage
          title="We couldn't load categories"
          message={getErrorMessage(categories.error)}
          onRetry={() => { void categories.refetch(); }}
        />
      </div>
    );
  }

  // A project needs an existing category before it can be published.
  if (categories.data.length === 0) {
    return (
      <div className="space-y-6">
        {backLink}
        <EmptyState
          title="No categories available yet"
          description="A category is needed to publish your project. Please try again later."
          action={{ label: "Try again", onClick: () => { void categories.refetch(); } }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {backLink}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
            <BriefcaseIcon className="size-4" /> Your workspace
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Post a project
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-500">
            Share your idea. Set clear expectations. Find the right freelancer.
          </p>
        </div>
        <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500">
          New project
        </span>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          noValidate
          onSubmit={handleSubmit(handleCreate)}
          aria-busy={isSaving}
          className="card min-w-0 overflow-hidden"
        >
          <fieldset disabled={isSaving} className="min-w-0">
            {/* 1. Project title, category and description. */}
            <section aria-labelledby="create-project-details" className="space-y-6 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-xs font-bold text-gray-500">01</span>
                <div>
                  <h2 id="create-project-details" className="text-lg font-bold tracking-tight text-gray-900">
                    Tell us about your project
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Help freelancers understand what you have in mind.</p>
                </div>
              </div>

              <div>
                <label htmlFor="create-order-title" className="field-label">Project title</label>
                <input
                  id="create-order-title"
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Build a landing page for a creative studio"
                  className="input"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "create-title-error" : "create-title-hint"}
                  {...register("title", {
                    required: "Please enter a project title.",
                    validate: (value) => (value.trim().length >= 5 && value.trim().length <= 120) || "Use between 5 and 120 characters.",
                  })}
                />
                {errors.title ? (
                  <p id="create-title-error" className="field-error">{errors.title.message}</p>
                ) : (
                  <p id="create-title-hint" className="field-hint">Be specific about what you need. 5–120 characters.</p>
                )}
              </div>

              <div>
                <label htmlFor="create-order-category" className="field-label">Category</label>
                <div className="relative">
                  <span className="input-icon"><LayersIcon className="size-4" /></span>
                  <select
                    id="create-order-category"
                    className="input pl-10"
                    aria-invalid={!!errors.categoryId}
                    aria-describedby={errors.categoryId ? "create-category-error" : "create-category-hint"}
                    {...register("categoryId", {
                      // Select values must become numeric IDs for the request.
                      valueAsNumber: true,
                      validate: (value) => categories.data.some((category) => category.id === value) || "Please choose an available category.",
                    })}
                  >
                    <option value={0} disabled>Select a category</option>
                    {categories.data.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.categoryId ? (
                  <p id="create-category-error" className="field-error">{errors.categoryId.message}</p>
                ) : (
                  <p id="create-category-hint" className="field-hint">Choose the category that best fits your project.</p>
                )}
              </div>

              <div>
                <label htmlFor="create-order-description" className="field-label">Project description</label>
                <textarea
                  id="create-order-description"
                  rows={9}
                  maxLength={5000}
                  placeholder="Describe your goals, expected deliverables and any requirements."
                  className="input h-auto min-h-52 resize-y py-3 leading-relaxed"
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? "create-description-error" : "create-description-hint"}
                  {...register("description", {
                    required: "Please describe your project.",
                    validate: (value) => (value.trim().length >= 20 && value.trim().length <= 5000) || "Use between 20 and 5,000 characters.",
                  })}
                />
                {errors.description ? (
                  <p id="create-description-error" className="field-error">{errors.description.message}</p>
                ) : (
                  <p id="create-description-hint" className="field-hint">Include goals, deliverables and requirements. 20–5,000 characters.</p>
                )}
              </div>
            </section>

            {/* 2. Whole-dollar budget and optional future deadline. */}
            <section aria-labelledby="create-project-budget" className="space-y-6 border-t border-gray-100 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-xs font-bold text-gray-500">02</span>
                <div>
                  <h2 id="create-project-budget" className="text-lg font-bold tracking-tight text-gray-900">Budget & timeline</h2>
                  <p className="mt-1 text-sm text-gray-500">Let freelancers know your budget and preferred deadline.</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor="create-order-budget" className="field-label">Project budget</label>
                  <div className="relative">
                    <span aria-hidden="true" className="input-icon text-sm font-semibold">$</span>
                    <input
                      id="create-order-budget"
                      type="number"
                      min={1}
                      max={1_000_000}
                      step={1}
                      placeholder="e.g. 500"
                      className="input pl-9"
                      aria-invalid={!!errors.budget}
                      aria-describedby={errors.budget ? "create-budget-error" : "create-budget-hint"}
                      {...register("budget", {
                        valueAsNumber: true,
                        required: "Please enter a budget.",
                        min: { value: 1, message: "The minimum budget is $1." },
                        max: { value: 1_000_000, message: "The maximum budget is $1,000,000." },
                        validate: (value) => Number.isInteger(value) || "Enter a whole-dollar amount.",
                      })}
                    />
                  </div>
                  {errors.budget ? (
                    <p id="create-budget-error" className="field-error">{errors.budget.message}</p>
                  ) : (
                    <p id="create-budget-hint" className="field-hint">USD · Whole amounts from $1 to $1,000,000.</p>
                  )}
                </div>

                <div className="min-w-0">
                  <label htmlFor="create-order-deadline" className="field-label">
                    Deadline <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="create-order-deadline"
                    type="datetime-local"
                    step={60}
                    className="input min-w-0 max-w-full text-sm"
                    aria-invalid={!!errors.deadline}
                    aria-describedby={errors.deadline ? "create-deadline-error" : "create-deadline-hint"}
                    {...register("deadline", {
                      validate: (value) => !value || new Date(value).getTime() > Date.now() || "Choose a future date and time.",
                    })}
                  />
                  {errors.deadline ? (
                    <p id="create-deadline-error" className="field-error">{errors.deadline.message}</p>
                  ) : (
                    <p id="create-deadline-hint" className="field-hint">Your local time. Leave empty for no deadline.</p>
                  )}
                </div>
              </div>
            </section>
          </fieldset>

          {/* 3. Validate, publish and open the created project. */}
          <footer className="space-y-4 border-t border-gray-100 bg-gray-50/60 p-6 sm:px-8">
            {serverError && <p role="alert" className="alert-error">{serverError}</p>}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" className="max-w-xs text-xs leading-relaxed text-gray-500">
                {isSaving ? "Publishing your project…" : "Your project will be open for proposals once published."}
              </p>
              <div className="flex gap-3">
                <button type="button" disabled={isSaving} onClick={() => navigate("/orders")} className="btn btn-secondary flex-1 sm:flex-none">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary flex-1 sm:flex-none">
                  {isSaving ? "Publishing…" : "Post project"}
                </button>
              </div>
            </div>
          </footer>
        </form>

        <aside aria-labelledby="create-project-tips" className="card min-w-0 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/60 p-6">
            <span aria-hidden="true" className="mb-4 grid size-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-500">
              <BriefcaseIcon className="size-5" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">A little guidance</p>
            <h2 id="create-project-tips" className="mt-3 text-lg leading-snug font-bold tracking-tight text-gray-900">
              A great project starts with a clear brief.
            </h2>
          </div>
          <ol className="space-y-5 p-6">
            <li className="flex gap-3">
              <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">1</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Describe the outcome</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">Explain what you want to achieve and what the finished work should include.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">2</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Share useful details</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">Mention your preferred tools, references and any important requirements.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">3</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Set clear expectations</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">Choose a budget and timeline that fit the scope of your project.</p>
              </div>
            </li>
          </ol>
          <div className="mx-6 mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">What happens next?</p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">Your project appears in the marketplace, where freelancers can discover it and send proposals.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
