// packages/wallet/src/lib/format.ts
export function microalgosToAlgos(micro: number | bigint): number {
  const n = typeof micro === 'bigint' ? Number(micro) : micro;
  return n / 1_000_000;
}

export function algosToMicroalgos(algo: number): number {
  return Math.round(algo * 1_000_000);
}

/**
 * Format amount to string with decimals for UI.
 * decimals: asset decimals (ALGO -> 6)
 */
export function formatAmount(amount: number, decimals = 6): string {
    if (amount == null) return '0';
  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: Math.min(2, decimals),
    maximumFractionDigits: Math.max(2, decimals)
  });
}
