import { monsters } from "../data/monsters";
import { getEnemyVulnerability, getRallyingWarCryTeamDamageIncrease, getSkill } from "../data/skills";
import { getTrait } from "../data/traits";
import { getTraitEffectValue } from "./calculations/traits";
import type { Build } from "../types/build";

const monsterById = new Map(monsters.map(monster => [monster.id, monster]));

/** Effects belong to the team or enemy, so use one strongest source per category. */
export function getTeamCombatOptions(builds: Build[]) {
  let damageIncreasePercent = 0;
  const vulnerabilityPercentages = new Set<number>();
  let hasStatusCondition = false;
  let hasBossCondition = false;
  for (const build of builds) {
    const monster = build.monsterId ? monsterById.get(build.monsterId) : null;
    if (!monster) continue;
    damageIncreasePercent = Math.max(damageIncreasePercent, getRallyingWarCryTeamDamageIncrease(monster.skillIds));
    const vulnerability = getEnemyVulnerability(monster.skillIds);
    if (vulnerability > 0) {
      vulnerabilityPercentages.add(vulnerability);
      vulnerabilityPercentages.add(vulnerability * (1 + getTraitEffectValue(build.traitId, "vulnerabilityEffectiveness") / 100));
    }
    hasStatusCondition ||= !!getTrait(build.traitId)?.effects.some(effect => effect.condition === "targetStatused")
      || monster.skillIds.some(id => getSkill(id)?.statusEffects?.some(effect => effect.type === "burn" || effect.type === "poison"));
    hasBossCondition ||= !!monster.passives?.some(passive => passive.effects.some(effect => effect.stat === "bossDamage" || effect.stat === "bossIncomingDamage"));
  }
  return { damageIncreasePercent, vulnerabilityPercentages: [...vulnerabilityPercentages].sort((a, b) => a - b), hasStatusCondition, hasBossCondition };
}

export type TeamCombatSelection = Pick<Build,
  "rallyingWarCryActive" | "vulnerabilityActive" | "targetStatused" | "targetIsBoss" | "enemyVulnerabilityPercent">;

export function getTeamCombatSelection(builds: Build[]): TeamCombatSelection {
  const members = builds.filter(build => build.monsterId);
  return {
    rallyingWarCryActive: members.some(build => build.rallyingWarCryActive),
    vulnerabilityActive: members.some(build => build.vulnerabilityActive),
    targetStatused: members.some(build => build.targetStatused),
    targetIsBoss: members.some(build => build.targetIsBoss),
    enemyVulnerabilityPercent: Math.max(0, ...members.filter(build => build.vulnerabilityActive)
      .map(build => build.enemyVulnerabilityPercent ?? 0)),
  };
}

/** Share selected conditions, resolving effect strength against this lineup. */
export function applyTeamCombatConditions(builds: Build[], selection = getTeamCombatSelection(builds)): Build[] {
  const options = getTeamCombatOptions(builds);
  const requested = selection.enemyVulnerabilityPercent ?? 0;
  const vulnerabilityPercent = options.vulnerabilityPercentages.includes(requested) ? requested
    : Math.max(0, ...options.vulnerabilityPercentages);
  return builds.map(build => ({
    ...build, ...selection,
    rallyingWarCryActive: options.damageIncreasePercent > 0 && selection.rallyingWarCryActive,
    vulnerabilityActive: vulnerabilityPercent > 0 && selection.vulnerabilityActive,
    enemyVulnerabilityPercent: vulnerabilityPercent,
    teamCombatEffects: { damageIncreasePercent: options.damageIncreasePercent, vulnerabilityPercent },
  }));
}
