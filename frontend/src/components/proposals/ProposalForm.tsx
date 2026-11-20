import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { getErrorMessage } from "@/api/client";
import { useCreateProposal, useUpdateProposal } from "@/hooks/useProposals";
import { useAuthStore } from "@/store/auth";
import type { ApiErrorBody, CreateProposalBody, UpdateProposalBody } from "@/types/api";
import type { Proposal } from "@/types/models";
import { formatMoney } from "@/utils/format";
import StatusBadge from "@/components/ui/StatusBadge";
import { BriefcaseIcon, MailIcon } from "@/components/ui/icons";

type ProposalFormProps = {
  orderId: number;
  proposal?: Proposal;
  onCancel?: () => void;
  onSaved?: () => void;
};

const FORM_FIELDS = ["price", "coverLetter"] as const;

// Reuse the same fields for creating and editing an offer.
export default function ProposalForm({ orderId, proposal, onCancel, onSaved }: ProposalFormProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [serverError, setServerError] = useState("");
  const createProposal = useCreateProposal();
  const updateProposal = useUpdateProposal();
  const isEditing = Boolean(proposal);
  const mutation = isEditing ? updateProposal : createProposal;

  // Edit mode starts with the saved offer; creation starts empty.
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, dirtyFields, isDirty },
  } = useForm<CreateProposalBody>({
    defaultValues: { price: proposal?.price, coverLetter: proposal?.coverLetter ?? "" },
  });

  const isSending = isSubmitting || mutation.isPending;
  const isValidId = Number.isSafeInteger(orderId) && orderId > 0;

  // A 409 means this offer can no longer be sent or edited.
  const isConflict = isAxiosError(mutation.error)
    && mutation.error.response?.status === 409;

  const handleSend: SubmitHandler<CreateProposalBody> = async (data) => {
    if (!isValidId || currentUser?.role !== "FREELANCER"
      || mutation.isPending || isConflict || mutation.isSuccess) return;
    setServerError("");

    const body: CreateProposalBody = {
      price: data.price,
      coverLetter: data.coverLetter.trim(),
    };

    try {
      // Edits update the existing proposal; they never create a second one.
      if (proposal) {
        const changes: UpdateProposalBody = {};
        if (dirtyFields.price) changes.price = body.price;
        if (dirtyFields.coverLetter) changes.coverLetter = body.coverLetter;
        if (Object.keys(changes).length === 0) return;
        await updateProposal.mutateAsync({ id: proposal.id, body: changes });
        onSaved?.();
      } else {
        await createProposal.mutateAsync({ id: orderId, body });
      }
    } catch (error) {
      // Show API validation messages under the matching fields.
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

  // The page also checks the role and order status before rendering this form.
  if (currentUser?.role !== "FREELANCER" || !isValidId) return null;

  // The parent closes edit mode; creation shows a confirmation if still mounted.
  if (mutation.isSuccess) {
    return (
      <section aria-label="Proposal confirmation" className="card p-6 sm:p-8">
        <div className="flex items-start gap-4" role="status">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <MailIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">{isEditing ? "Your proposal has been updated" : "Your proposal is on its way"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {isEditing ? "Your updated offer is ready for the client to review." : "The client has received your proposal. You can have one active proposal per project."}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-500">
            Your offer <span className="ml-2 text-lg font-bold text-gray-900">{formatMoney(mutation.data.price)}</span>
          </p>
          <StatusBadge status={mutation.data.status} />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`proposal-heading-${orderId}`} className="card min-w-0 overflow-hidden">
      <header className="border-b border-gray-100 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-500">
            <BriefcaseIcon className="size-5" />
          </span>
          <div>
            <h2 id={`proposal-heading-${orderId}`} className="text-xl font-bold tracking-tight text-gray-900">
              {isEditing ? "Edit your proposal" : "Make your next move"}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
              {isEditing ? "Update your offer before the client makes a decision." : "Share your approach and tell the client why you're a great fit."}
            </p>
          </div>
        </div>
      </header>

      <form noValidate onSubmit={handleSubmit(handleSend)} aria-busy={isSending}>
        <fieldset disabled={isSending || isConflict} className="min-w-0 space-y-6 p-6 sm:p-8">
          {/* 1. Offer a whole-dollar price for the project. */}
          <div>
            <label htmlFor={`proposal-price-${orderId}`} className="field-label">Your proposed price</label>
            <div className="relative sm:max-w-xs">
              <span aria-hidden="true" className="input-icon text-sm font-semibold">$</span>
              <input
                id={`proposal-price-${orderId}`}
                type="number"
                min={1}
                max={1_000_000}
                step={1}
                placeholder="e.g. 500"
                className="input pl-9"
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? `proposal-price-error-${orderId}` : `proposal-price-hint-${orderId}`}
                {...register("price", {
                  // Numeric inputs still need conversion for the API.
                  valueAsNumber: true,
                  required: "Please enter your proposed price.",
                  min: { value: 1, message: "The minimum price is $1." },
                  max: { value: 1_000_000, message: "The maximum price is $1,000,000." },
                  validate: (value) => Number.isInteger(value) || "Enter a whole-dollar amount.",
                })}
              />
            </div>
            {errors.price ? (
              <p id={`proposal-price-error-${orderId}`} className="field-error">{errors.price.message}</p>
            ) : (
              <p id={`proposal-price-hint-${orderId}`} className="field-hint">Your total price in USD. Whole amounts from $1 to $1,000,000.</p>
            )}
          </div>

          {/* 2. Explain the approach and relevant experience. */}
          <div>
            <label htmlFor={`proposal-letter-${orderId}`} className="field-label">Cover letter</label>
            <textarea
              id={`proposal-letter-${orderId}`}
              rows={7}
              maxLength={3000}
              placeholder="Introduce yourself, share relevant experience and explain how you would approach this project."
              className="input h-auto min-h-48 resize-y py-3 leading-relaxed"
              aria-invalid={!!errors.coverLetter}
              aria-describedby={errors.coverLetter ? `proposal-letter-error-${orderId}` : `proposal-letter-hint-${orderId}`}
              {...register("coverLetter", {
                required: "Please write a cover letter.",
                validate: (value) => (value.trim().length >= 5 && value.trim().length <= 3000) || "Use between 5 and 3,000 characters.",
              })}
            />
            {errors.coverLetter ? (
              <p id={`proposal-letter-error-${orderId}`} className="field-error">{errors.coverLetter.message}</p>
            ) : (
              <p id={`proposal-letter-hint-${orderId}`} className="field-hint">Keep it relevant to this project. 5–3,000 characters.</p>
            )}
          </div>
        </fieldset>

        {/* 3. Keep the draft on errors and lock the form while saving. */}
        <footer className="space-y-4 border-t border-gray-100 bg-gray-50/60 p-6 sm:px-8">
          {serverError && <p role="alert" className="alert-error">{serverError}</p>}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p role="status" className="max-w-xs text-xs leading-relaxed text-gray-500">
              {isSending
                ? isEditing ? "Saving your changes…" : "Sending your proposal…"
                : isEditing ? "You can edit a pending proposal while the project is open." : "One active proposal per project. Review your offer before sending."}
            </p>
            <div className="flex gap-3">
              {isEditing && onCancel && (
                <button type="button" onClick={onCancel} disabled={isSending} className="btn btn-secondary flex-1 sm:flex-none">Cancel</button>
              )}
              <button type="submit" disabled={isSending || isConflict || (isEditing && !isDirty)} className="btn btn-primary flex-1 shrink-0 sm:flex-none">
                <MailIcon className="size-4" />
                {isEditing ? isSending ? "Saving…" : "Save changes" : isSending ? "Sending…" : "Send proposal"}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </section>
  );
}
