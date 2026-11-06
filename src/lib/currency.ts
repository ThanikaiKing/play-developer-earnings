export function formatCurrency(
  amount: number,
  currency: string = "INR",
  options?: { hideDecimals?: boolean; compact?: boolean }
): string {
  const isINR = currency === "INR";
  const absAmount = Math.abs(amount);

  let formatted = "";
  if (options?.compact && absAmount >= 1000) {
    if (absAmount >= 10000000) {
      formatted = (absAmount / 10000000).toFixed(2) + " Cr";
    } else if (absAmount >= 100000) {
      formatted = (absAmount / 100000).toFixed(2) + " L";
    } else if (absAmount >= 1000) {
      formatted = (absAmount / 1000).toFixed(1) + "k";
    }
  } else {
    formatted = absAmount.toLocaleString("en-IN", {
      minimumFractionDigits: options?.hideDecimals ? 0 : 2,
      maximumFractionDigits: options?.hideDecimals ? 0 : 2,
    });
  }

  const prefix = isINR ? "₹" : `${currency} `;
  const sign = amount < 0 ? "-" : "";

  return `${sign}${prefix}${formatted}`;
}

export function formatPercent(rate: number): string {
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(1)}%`;
}

