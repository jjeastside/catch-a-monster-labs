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

/** Normalize older per-member selections and share the strongest active effects. */
export function applyTeamCombatConditions(builds: Build[]): Build[] {
  const members = builds.filter(build => build.monsterId);
  const options = getTeamCombatOptions(members);
  const requested = Math.max(0, ...members.filter(build => build.vulnerabilityActive).map(build => build.enemyVulnerabilityPercent ?? 0));
  const vulnerabilityPercent = options.vulnerabilityPercentages.includes(requested) ? requested
    : Math.max(0, ...options.vulnerabilityPercentages);
  const rallyingWarCryActive = options.damageIncreasePercent > 0 && members.some(build => build.rallyingWarCryActive);
  const vulnerabilityActive = vulnerabilityPercent > 0 && members.some(build => build.vulnerabilityActive);
  const targetStatused = members.some(build => build.targetStatused);
  const targetIsBoss = members.some(build => build.targetIsBoss);
  return builds.map(build => ({ ...build, rallyingWarCryActive, vulnerabilityActive, targetStatused, targetIsBoss,
    enemyVulnerabilityPercent: vulnerabilityPercent,
    teamCombatEffects: { damageIncreasePercent: options.damageIncreasePercent, vulnerabilityPercent },
  }));
}
