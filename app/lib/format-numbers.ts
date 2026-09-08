export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function roundToSignificantFigures(value: number, figures = 4): number {
  if (value === 0 || !Number.isFinite(value)) return value;

  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const precision = figures - magnitude - 1;
  const factor = 10 ** precision;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatStatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";

  const roundedValue = roundToSignificantFigures(value);
  const absoluteValue = Math.abs(roundedValue);
  const units = [
    { threshold: 1_000_000_000_000_000, suffix: "Qd" },
    { threshold: 1_000_000_000_000, suffix: "T" },
    { threshold: 1_000_000_000, suffix: "B" },
    { threshold: 1_000_000, suffix: "M" },
    { threshold: 100_000, suffix: "K" },
  ];
  const unit = units.find(({ threshold }) => absoluteValue >= threshold);

  if (!unit) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: Math.max(
        0,
        4 - Math.floor(Math.log10(absoluteValue || 1)) - 1,
      ),
    }).format(roundedValue);
  }

  // Keep the existing K display threshold, but K always represents 1,000.
  const scaledValue = roundedValue / (unit.suffix === "K" ? 1_000 : unit.threshold);
  const scaledMagnitude = Math.floor(Math.log10(Math.abs(scaledValue)));

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.max(0, 4 - scaledMagnitude - 1),
  }).format(scaledValue)}${unit.suffix}`;
}
