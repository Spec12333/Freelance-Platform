// FreelanceHub wordmark. "light" is for dark backgrounds.

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

export default function Logo({ variant = "dark", className = "" }: LogoProps) {
  const light = variant === "light";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`grid size-9 place-items-center rounded-xl shadow-sm ${
          light ? "bg-white text-brand-700" : "bg-brand-600 text-white"
        }`}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" className="size-6">
          <path
            d="M11 23V9h10M11 16h8"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-gray-900"}`}>
        Freelance<span className={light ? "text-brand-300" : "text-brand-600"}>Hub</span>
      </span>
    </span>
  );
}
