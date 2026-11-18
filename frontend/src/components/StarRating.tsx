import { useId, useState } from "react";
import { StarIcon } from "./ui/icons";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  label?: string;
  describedBy?: string;
  invalid?: boolean;
  size?: "sm" | "md";
};

// Read-only stars support fractions; editable stars use native radio controls.
export default function StarRating({ value, onChange, onBlur, disabled = false, label = "Overall rating", describedBy, invalid, size = "md" }: StarRatingProps) {
  const name = useId();
  const [hovered, setHovered] = useState(0);
  const rating = Math.max(0, Math.min(5, value));
  const starClass = size === "sm" ? "size-3.5" : "size-4";

  if (!onChange) {
    return (
      <span role="img" aria-label={`${rating} out of 5 stars`} className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} aria-hidden="true" className="relative inline-flex text-gray-200">
            <StarIcon className={starClass} />
            <span className="absolute inset-y-0 left-0 overflow-hidden text-brand-600" style={{ width: `${Math.max(0, Math.min(1, rating - star + 1)) * 100}%` }}><StarIcon className={`${starClass} max-w-none`} /></span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <fieldset role="radiogroup" aria-label={label} aria-describedby={describedBy} aria-invalid={invalid} disabled={disabled} onMouseLeave={() => setHovered(0)} className="flex w-fit max-w-full gap-1 sm:gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <label key={star} onMouseEnter={() => { if (!disabled) setHovered(star); }} className={`relative ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
          <input type="radio" name={name} value={star} checked={value === star} onChange={() => { setHovered(0); onChange(star); }} onBlur={onBlur} aria-label={`${star} ${star === 1 ? "star" : "stars"}`} className="peer sr-only" />
          <span className={`grid size-11 place-items-center rounded-xl border transition duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand-700 motion-reduce:transition-none ${star <= (hovered || rating) ? "border-brand-200 bg-brand-50 text-brand-600" : "border-gray-200 bg-white text-gray-300"}`}><StarIcon className="size-7" /></span>
        </label>
      ))}
    </fieldset>
  );
}
