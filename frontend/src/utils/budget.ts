type BudgetRange = {
  minBudget?: number;
  maxBudget?: number;
  error: string;
};

// Validate form values and URL parameters with the same rules.
export const parseBudgetRange = (minValue: string, maxValue: string): BudgetRange => {
  const minBudget = minValue.trim() === "" ? undefined : Number(minValue);
  const maxBudget = maxValue.trim() === "" ? undefined : Number(maxValue);

  if (minBudget !== undefined && (!Number.isSafeInteger(minBudget) || minBudget < 0)) {
    return { error: "Minimum budget must be a whole number of 0 or more." };
  }
  if (maxBudget !== undefined && (!Number.isSafeInteger(maxBudget) || maxBudget < 0)) {
    return { error: "Maximum budget must be a whole number of 0 or more." };
  }
  if (minBudget !== undefined && maxBudget !== undefined && maxBudget < minBudget) {
    return { error: "Maximum budget cannot be less than minimum budget." };
  }

  return { minBudget, maxBudget, error: "" };
};
