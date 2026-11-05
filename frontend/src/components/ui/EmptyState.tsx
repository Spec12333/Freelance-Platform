import { InboxIcon } from "./icons";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

// Empty list card; the parent supplies the text and optional action.
export default function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`card flex flex-col items-center px-6 py-12 text-center sm:py-16 ${className}`}>
      <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200">
        <InboxIcon className="size-8" />
      </span>

      <p className="max-w-md break-words text-xl font-bold tracking-tight text-gray-900">
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-md break-words text-[15px] leading-relaxed text-gray-500">
          {description}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn btn-primary mt-6 w-full sm:w-auto"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
