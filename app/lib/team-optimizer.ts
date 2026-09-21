export type CandidateMetrics = {
  totalDps: number;
  totalEffectiveHealth: number;
  weakestEffectiveHp: number;
  synergyScore: number;
};
export type OptimizationGoal = "damage" | "balanced" | "survivability" | "support";

/**
 * Internal ordering only. A ranking is NOT a 0–100 team score and must not be
 * displayed as one. Compare calculated damage, the WEAKEST member and the
 * shared composition-synergy score. No minimum eHP requirement gates teams;
 * summed HP cannot disguise an unprotected support.
 */
export function rankTeamCandidates<T extends CandidateMetrics>(candidates: T[], goal: OptimizationGoal): T[] {
  if (!candidates.length) return [];
  const maxDps = Math.max(1, ...candidates.map((t) => t.totalDps));
  const maxWeakest = Math.max(1, ...candidates.map((t) => t.weakestEffectiveHp));
  const maxHp = Math.max(1, ...candidates.map((t) => t.totalEffectiveHealth));
  const weights = goal === "damage" ? [0.79, 0.13, 0.08]
    : goal === "survivability" ? [0.15, 0.68, 0.17]
    : goal === "support" ? [0.21, 0.25, 0.54]
    : [0.46, 0.36, 0.18];
  const value = (team: T): number => {
    const dps = Math.sqrt(Math.max(0, team.totalDps) / maxDps);
    const weak = Math.sqrt(Math.max(0, team.weakestEffectiveHp) / maxWeakest);
    const total = Math.sqrt(Math.max(0, team.totalEffectiveHealth) / maxHp);
    // 85% of survival value is the weakest teammate, not the carry's total HP.
    const survival = weak * 0.85 + total * 0.15;
    return dps * weights[0] + survival * weights[1] + team.synergyScore / 100 * weights[2];
  };
  return [...candidates].sort((a, b) => {
    return value(b) - value(a) || b.weakestEffectiveHp - a.weakestEffectiveHp;
  });
}

export type GearGain = { memberIndex: number; copyId: string; gain: number };

/**
 * A tiny exact maximum-weight matching for up to three teammates and one type
 * of physical gear. A member only needs its best N copies: with N members,
 * at most N-1 of those copies can be occupied by the other members.
 * "No equipment" remains an option, so negative upgrades are never forced.
 */
export function chooseUniqueGear<T extends GearGain>(choices: T[], memberCount: number): T[] {
  if (memberCount <= 0) return [];
  const byMember = Array.from({ length: memberCount }, (_, memberIndex) => choices
    .filter((choice) => choice.memberIndex === memberIndex && Number.isFinite(choice.gain) && choice.gain > 0)
    .sort((a, b) => b.gain - a.gain || a.copyId.localeCompare(b.copyId))
    .slice(0, memberCount));
  const used = new Set<string>();
  const current: T[] = [];
  let best: T[] = [];
  let bestGain = 0;
  const search = (memberIndex: number, gain: number) => {
    if (memberIndex === memberCount) {
      if (gain > bestGain + 1e-10) { bestGain = gain; best = [...current]; }
      return;
    }
    search(memberIndex + 1, gain);
    for (const choice of byMember[memberIndex]) {
      if (used.has(choice.copyId)) continue;
      used.add(choice.copyId);
      current.push(choice);
      search(memberIndex + 1, gain + choice.gain);
      current.pop();
      used.delete(choice.copyId);
    }
  };
  search(0, 0);
  return best;
}
