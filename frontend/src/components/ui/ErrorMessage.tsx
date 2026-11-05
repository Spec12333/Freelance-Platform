import { AlertCircleIcon, RefreshIcon } from "./icons";

type ErrorMessageProps = {
  message: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
};

// Show the actual error; the parent handles the optional retry action.
export default function ErrorMessage({
  message,
  title = "Unable to load",
  onRetry,
  className = "",
}: ErrorMessageProps) {
  return (
    <div className={`card p-6 sm:p-8 ${className}`}>
      <div role="alert" className="flex flex-col items-start gap-4 sm:flex-row">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
          <AlertCircleIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold tracking-tight text-gray-900">{title}</p>
          <p className="mt-2 break-words text-sm leading-relaxed text-red-700">{message}</p>
        </div>
      </div>

      {onRetry && (
        <div className="mt-5 sm:pl-15">
          <button type="button" onClick={onRetry} className="btn btn-primary w-full sm:w-auto">
            <RefreshIcon className="size-4" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
