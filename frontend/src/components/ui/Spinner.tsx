// Loading indicator with an accessible label and reduced-motion support.
type SpinnerProps = {
  label?: string;
  className?: string;
};

export default function Spinner({
  label = "Loading…",
  className = "",
}: SpinnerProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        fill="none"
        className="size-10 animate-spin text-brand-600 motion-reduce:animate-none"
      >
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" opacity="0.15" />
        <path
          d="M20 4a16 16 0 0 1 16 16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
    </div>
  );
}
