import { useForm, type SubmitHandler } from "react-hook-form";
import type { CreateMessageBody } from "@/types/api";
import { ArrowUpRightIcon } from "@/components/ui/icons";

type MessageInputProps = {
  orderId: number;
  onSend: (body: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
  error?: string;
};

// Validate the draft; the parent owns sending and server errors.
export default function MessageInput({ orderId, onSend, isSending, disabled = false, error }: MessageInputProps) {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<CreateMessageBody>({
    defaultValues: { body: "" },
  });
  const body = watch("body");
  const isBusy = isSending || isSubmitting;

  const handleSend: SubmitHandler<CreateMessageBody> = async (data) => {
    if (disabled || isBusy) return;
    try {
      await onSend(data.body.trim());
      // Clear only after the server confirms that the message was saved.
      reset({ body: "" });
    } catch {
      // Preserve the draft; the parent displays the API error.
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleSend)} aria-busy={isBusy} className="border-t border-gray-100 bg-white p-5 sm:p-6">
      <fieldset disabled={disabled || isBusy} className="min-w-0 space-y-3">
        <label htmlFor={`message-body-${orderId}`} className="field-label">Your message</label>
        <textarea
          id={`message-body-${orderId}`}
          rows={3}
          maxLength={2000}
          placeholder="Discuss the details, ask a question or share an update…"
          className="input h-auto min-h-28 resize-y py-3 leading-relaxed"
          aria-invalid={!!errors.body}
          aria-describedby={`message-hint-${orderId}${errors.body ? ` message-error-${orderId}` : ""}`}
          {...register("body", {
            validate: (value) => (value.trim().length >= 1 && value.trim().length <= 2000)
              || "Write a message between 1 and 2,000 characters.",
          })}
        />
        {errors.body && <p id={`message-error-${orderId}`} className="field-error">{errors.body.message}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p id={`message-hint-${orderId}`} className="text-xs text-gray-400">Enter adds a new line · {body.length.toLocaleString("en-US")} / 2,000</p>
          <button type="submit" disabled={disabled || isBusy || !body.trim()} className="btn btn-primary w-full sm:w-auto">
            <ArrowUpRightIcon className="size-4" />
            {isBusy ? "Sending…" : "Send message"}
          </button>
        </div>
      </fieldset>
      {error && <p role="alert" className="alert-error mt-4">{error}</p>}
    </form>
  );
}
