// Formatting helpers for money, dates, time and ratings.

// Format whole-dollar amounts, e.g. "$1,500".
export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format a date in the user's timezone, e.g. "Nov 6, 2026".
export const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
};

// Format local time in 24-hour notation, e.g. "14:35".
export const formatTime = (value: string): string => {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
};

// Show one decimal place or "No ratings" when no rating exists.
export const formatRating = (value: number | null): string => {
  if (value === null) {
    return "No ratings";
  }
  return value.toFixed(1);
};

// Format the full date and local time together.
export const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));
};

// Describe a date relative to now, e.g. "5 minutes ago".
export const formatRelativeTime = (value: string): string => {
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  const diff = new Date(value).getTime() - Date.now();

  const minutes = Math.round(diff / (1000 * 60));
  const hours = Math.round(diff / (1000 * 60 * 60));
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }

  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }

  return formatter.format(days, "day");
};
