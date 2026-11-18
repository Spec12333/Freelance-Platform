import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { isAxiosError } from "axios";
import { useCreateReview } from "@/hooks/useReviews";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/api/client";
import type { ApiErrorBody, CreateReviewBody } from "@/types/api";
import type { Order } from "@/types/models";
import StarRating from "./StarRating";
import { ArrowUpRightIcon, ShieldIcon } from "./ui/icons";

type ReviewFormProps = {
  order: Order;
  disabled?: boolean;
};

const RATING_LABELS = ["Choose your rating", "Needs improvement", "Fair", "Good", "Very good", "Excellent"];

// Validate and send feedback; the parent checks whether a review already exists.
export default function ReviewForm({ order, disabled = false }: ReviewFormProps) {
  const currentUser = useAuthStore((state) => state.user);
  const createReview = useCreateReview(order.id);
  const { control, register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<CreateReviewBody>({
    defaultValues: { rating: 0, comment: "" },
  });
  const rating = watch("rating");
  const comment = watch("comment") ?? "";
  const isSending = isSubmitting || createReview.isPending;
  const isClient = currentUser?.role === "CLIENT" && currentUser.id === order.clientId;
  const isFreelancer = currentUser?.role === "FREELANCER" && currentUser.id === order.freelancerId;
  const canReview = order.status === "COMPLETED" && (isClient || isFreelancer);
  const targetName = isClient ? order.freelancer?.name : order.client.name;
  const isConflict = isAxiosError(createReview.error) && [403, 404, 409].includes(createReview.error.response?.status ?? 0);

  const handleSend: SubmitHandler<CreateReviewBody> = async (data) => {
    if (!canReview || disabled || createReview.isPending || createReview.isSuccess || isConflict) return;
    try {
      // The backend chooses targetId from the order; only rating/comment are sent.
      await createReview.mutateAsync({ rating: data.rating, comment: data.comment?.trim() || null });
    } catch (error) {
      if (isAxiosError<ApiErrorBody>(error)) {
        for (const detail of error.response?.data?.details ?? []) {
          if (detail.field === "rating" || detail.field === "comment") setError(detail.field, { type: "server", message: detail.message });
        }
      }
      // Keep the rating and comment available after a failed request.
    }
  };

  if (!canReview) return null;

  return (
    <form noValidate onSubmit={handleSubmit(handleSend)} aria-label="Leave a review" aria-busy={isSending} className="border-t border-gray-200 bg-cream p-6 sm:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-brand-700">Your perspective matters</p>
          <h3 className="mt-3 font-display text-3xl leading-tight tracking-tight text-ink [overflow-wrap:anywhere]">How was working with {targetName ?? "your collaborator"}?</h3>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-gray-500">Celebrate what went well. Share what could be better. Your honest feedback helps the next collaboration.</p>
        </div>
      </div>

      <fieldset disabled={isSending || isConflict || disabled} className="min-w-0 space-y-6">
        <div>
          <p id={`review-rating-label-${order.id}`} className="field-label">Overall experience <span className="text-brand-600">*</span></p>
          <Controller
            name="rating"
            control={control}
            rules={{ validate: (value) => (Number.isInteger(value) && value >= 1 && value <= 5) || "Choose a rating from 1 to 5 stars." }}
            render={({ field }) => <StarRating value={field.value} onChange={field.onChange} onBlur={field.onBlur} disabled={isSending || isConflict || disabled} label="Overall experience" invalid={!!errors.rating} describedBy={errors.rating ? `review-rating-error-${order.id}` : `review-rating-hint-${order.id}`} />}
          />
          {errors.rating ? <p id={`review-rating-error-${order.id}`} className="field-error">{errors.rating.message}</p>
            : <p id={`review-rating-hint-${order.id}`} className="mt-3 text-sm font-medium text-brand-800">{RATING_LABELS[rating]}</p>}
        </div>

        <div>
          <label htmlFor={`review-comment-${order.id}`} className="field-label">A few words about the experience <span className="ml-1 font-normal text-gray-400">(optional)</span></label>
          <textarea id={`review-comment-${order.id}`} rows={4} maxLength={500} placeholder="What stood out? Think communication, quality of work and collaboration." className="input h-auto min-h-32 resize-y py-3 leading-relaxed"
            aria-invalid={!!errors.comment} aria-describedby={errors.comment ? `review-comment-error-${order.id}` : `review-comment-hint-${order.id}`}
            {...register("comment", { validate: (value) => (value?.trim().length ?? 0) <= 500 || "Use no more than 500 characters." })} />
          <div className="mt-2 flex justify-between gap-3 text-xs text-gray-400"><p id={`review-comment-hint-${order.id}`}>Keep it thoughtful and relevant.</p><span className="shrink-0">{comment.length} / 500</span></div>
          {errors.comment && <p id={`review-comment-error-${order.id}`} className="field-error">{errors.comment.message}</p>}
        </div>
      </fieldset>

      {createReview.isError && <p role="alert" className="alert-error mt-5">{getErrorMessage(createReview.error)}</p>}
      <div className="mt-7 flex flex-col gap-5 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex max-w-xs items-start gap-2 text-xs leading-relaxed text-gray-500"><ShieldIcon className="mt-0.5 size-4 shrink-0 text-brand-600" />One review per person. Your feedback is public and cannot be edited.</p>
        <button type="submit" disabled={isSending || isConflict || disabled || createReview.isSuccess} className="btn btn-primary shrink-0">{isSending ? "Publishing…" : "Publish review"}<ArrowUpRightIcon className="size-4" /></button>
      </div>
    </form>
  );
}
