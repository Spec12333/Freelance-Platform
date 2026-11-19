type RateRange = {
  minRate?: number;
  maxRate?: number;
  error: string;
};

// Use the same hourly-rate rules for input drafts and URL parameters.
export const parseRateRange = (minValue: string, maxValue: string): RateRange => {
  const minRate = minValue.trim() === "" ? undefined : Number(minValue);
  const maxRate = maxValue.trim() === "" ? undefined : Number(maxValue);

  if (minRate !== undefined && (!Number.isSafeInteger(minRate) || minRate < 0)) {
    return { error: "Minimum rate must be a whole number of 0 or more." };
  }
  if (maxRate !== undefined && (!Number.isSafeInteger(maxRate) || maxRate < 0)) {
    return { error: "Maximum rate must be a whole number of 0 or more." };
  }
  if (minRate !== undefined && maxRate !== undefined && minRate > maxRate) {
    return { error: "Maximum rate cannot be less than minimum rate." };
  }
  return { minRate, maxRate, error: "" };
};
