/**
 * A roster-relative shortlist guard, not an in-game survival prediction.
 * Players can override it with an explicit encounter-tested minimum eHP.
 */
export const DEFAULT_MIN_EHP_FRACTION = 0.15;

export function parseMinimumEffectiveHp(value: string): number | undefined {
  const text = value.trim();
  if (!text) return undefined; // Empty = automatic roster-relative floor.
  const match = /^([0-9]+(?:\.[0-9]+)?)\s*([kmbtq]?)$/i.exec(text.replace(/,/g, ""));
  if (!match) return NaN;
  const unit = { "": 1, k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 }[match[2].toLowerCase() as "" | "k" | "m" | "b" | "t" | "q"];
  const amount = Number(match[1]) * unit;
  return Number.isFinite(amount) && amount >= 0 ? amount : NaN;
}

export function minimumRosterEffectiveHp(ownedEffectiveHealth: number[], customMinimum?: number): number {
  if (customMinimum !== undefined && Number.isFinite(customMinimum) && customMinimum >= 0) return customMinimum;
  return Math.max(0, ...ownedEffectiveHealth.filter((value) => Number.isFinite(value) && value > 0)) * DEFAULT_MIN_EHP_FRACTION;
}

export type TeamReadiness = {
  minimumEffectiveHp: number;
  readyCount: number;
  memberCount: number;
  coverage: number;
  allReady: boolean;
  weakestEffectiveHp: number;
};

export function assessTeamReadiness(effectiveHealth: number[], minimumEffectiveHp: number): TeamReadiness {
  const floor = Number.isFinite(minimumEffectiveHp) ? Math.max(0, minimumEffectiveHp) : 0;
  const members = effectiveHealth.map((value) => Number.isFinite(value) ? Math.max(0, value) : 0);
  const readyCount = members.filter((value) => value > 0 && value >= floor).length;
  return {
    minimumEffectiveHp: floor,
    readyCount,
    memberCount: members.length,
    coverage: members.length ? members.reduce((sum, value) =>
      sum + (floor > 0 ? Math.min(1, value / floor) : Number(value > 0)), 0) / members.length : 0,
    allReady: members.length > 0 && readyCount === members.length,
    weakestEffectiveHp: members.length ? Math.min(...members) : 0,
  };
}

/** A weak support must not inherit the carry's survivability through total HP. */
export function readinessAdjustedFit(baseFit: number, readiness: TeamReadiness): number {
  return Math.max(0, Math.min(1, baseFit)) * (0.2 + 0.8 * readiness.coverage);
}

/** Any full ready team precedes unready teams; in a sparse roster show best available with a warning. */
export function compareTeamReadiness(
  a: { readiness: TeamReadiness; score: number },
  b: { readiness: TeamReadiness; score: number },
): number {
  if (a.readiness.allReady !== b.readiness.allReady) return a.readiness.allReady ? -1 : 1;
  if (!a.readiness.allReady && a.readiness.readyCount !== b.readiness.readyCount)
    return b.readiness.readyCount - a.readiness.readyCount;
  return b.score - a.score;
}
