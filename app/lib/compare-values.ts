/** Missing/non-finite values never win; highlight every tied best value. */
export function isBestValue(
  value: number | null,
  values: (number | null)[],
  lower = false,
): boolean {
  const valid = values.filter(
    (item): item is number => item !== null && Number.isFinite(item),
  );
  return (
    value !== null &&
    Number.isFinite(value) &&
    valid.length >= 2 &&
    value === (lower ? Math.min(...valid) : Math.max(...valid))
  );
}
