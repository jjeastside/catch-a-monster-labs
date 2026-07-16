export const MIN_EVOLUTION_PERCENT = 100;
export const MAX_EVOLUTION_PERCENT = 220;
export const EVOLUTION_STEP = 0.01;

export function clampEvolutionPercent(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return MIN_EVOLUTION_PERCENT;
  }

  const clamped = Math.min(
    MAX_EVOLUTION_PERCENT,
    Math.max(MIN_EVOLUTION_PERCENT, value),
  );

  return Math.round(clamped * 100) / 100;
}

export function getEvolutionMultiplier(
  evolutionPercent: number,
): number {
  const validPercent =
    clampEvolutionPercent(evolutionPercent);

  return validPercent / 100;
}

export function getEvolutionBarFill(
  evolutionPercent: number,
): number {
  const validPercent =
    clampEvolutionPercent(evolutionPercent);

  const progress =
    (validPercent - MIN_EVOLUTION_PERCENT) /
    (MAX_EVOLUTION_PERCENT - MIN_EVOLUTION_PERCENT);

  // The in-game bar starts half full at EM 100%.
  return 50 + progress * 50;
}
