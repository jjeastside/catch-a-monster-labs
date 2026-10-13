export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

const STAT_UNITS = [
  { threshold: 1_000_000_000_000_000, suffix: "Qd" },
  { threshold: 1_000_000_000_000, suffix: "T" },
  { threshold: 1_000_000_000, suffix: "B" },
  { threshold: 1_000_000, suffix: "M" },
  { threshold: 100_000, suffix: "K" },
] as const;

function roundToSignificantFigures(value: number, figures = 4): number {
  if (value === 0 || !Number.isFinite(value)) return value;

  // toPrecision avoids floating-point rounding drift at unit boundaries
  // (for example, 999,995,000 should round to 1B at five digits).
  return Number(value.toPrecision(figures));
}

/**
 * The game exposes one extra digit when the displayed stat is in the hundreds
 * place. Examples: 213.21, 312.21K, 512.12M. Other magnitudes keep the normal
 * four-significant-digit display.
 */
export function getStatDisplayFigures(value: number): number {
  if (!Number.isFinite(value) || value === 0) return 4;

  const absoluteValue = Math.abs(value);
  const unit = STAT_UNITS.find(({ threshold }) => absoluteValue >= threshold);
  const scaledValue = unit
    ? absoluteValue / (unit.suffix === "K" ? 1_000 : unit.threshold)
    : absoluteValue;

  return scaledValue >= 100 && scaledValue < 1_000 ? 5 : 4;
}

export function formatStatNumber(value: number, figures?: number): string {
  if (!Number.isFinite(value)) return "—";

  const resolvedFigures = figures ?? getStatDisplayFigures(value);
  const roundedValue = roundToSignificantFigures(value, resolvedFigures);
  const absoluteValue = Math.abs(roundedValue);
  const unit = STAT_UNITS.find(({ threshold }) => absoluteValue >= threshold);

  if (!unit) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: Math.max(
        0,
        resolvedFigures - Math.floor(Math.log10(absoluteValue || 1)) - 1,
      ),
    }).format(roundedValue);
  }

  // Keep the existing K display threshold, but K always represents 1,000.
  const scaledValue = roundedValue / (unit.suffix === "K" ? 1_000 : unit.threshold);
  const scaledMagnitude = Math.floor(Math.log10(Math.abs(scaledValue)));

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.max(0, resolvedFigures - scaledMagnitude - 1),
  }).format(scaledValue)}${unit.suffix}`;
}
