import { monsters } from "../../data/monsters";
import {
  getSkill,
  getSkillTotalMultiplier,
  getActiveRallyingWarCryDamageIncrease,
  getEnemyVulnerability,
  getActiveEnemyVulnerability,
} from "../../data/skills";
import { calculateSkillAttributeEffects } from "./attributes";
import { calculateCombatDamage } from "./combat";
import { getMutationCooldownMultiplier } from "./mutations";
import {
  getTraitDamageMultiplier,
  getTraitCooldownMultiplier,
  getTraitEffectValue,
} from "./traits";
import type { CalculatedStats } from "./stats";
import type { Build, MonsterPassive } from "../../types/build";
import type { Monster } from "../../types/monster";

export function calculateSkillSummary(
  monster: Monster,
  skill: NonNullable<ReturnType<typeof getSkill>>,
  stats: CalculatedStats,
  build: Build,
  effectivePassives: MonsterPassive[],
) {
  const totalMultiplier = getSkillTotalMultiplier(skill);

  const attributeEffects = calculateSkillAttributeEffects(build, skill.element);

  const accountRiftDamageMultiplier =
    build.combatContext === "rift" ? stats.accountRiftDamageMultiplier : 1;

  const traitDamageMultiplier = getTraitDamageMultiplier(build.traitId, {
    targetStatused: build.targetStatused,
  });
  const teammateSkillIdGroups = build.teammateMonsterIds.flatMap(
    (monsterId) => {
      const teammate = monsters.find((candidate) => candidate.id === monsterId);
      return teammate ? [teammate.skillIds] : [];
    },
  );
  const rallyingWarCryDamageIncrease = getActiveRallyingWarCryDamageIncrease(
    monster.skillIds,
    teammateSkillIdGroups,
  );
  const rallyingWarCryMultiplier = build.rallyingWarCryActive
    ? 1 + rallyingWarCryDamageIncrease / 100
    : 1;
  const ownVulnerability = getEnemyVulnerability(monster.skillIds);
  const activeVulnerability = getActiveEnemyVulnerability(
    monster.skillIds,
    teammateSkillIdGroups,
  );
  const vulnerabilityEffectiveness =
    ownVulnerability >= activeVulnerability
      ? getTraitEffectValue(build.traitId, "vulnerabilityEffectiveness")
      : 0;
  const effectiveVulnerability =
    activeVulnerability * (1 + vulnerabilityEffectiveness / 100);
  const vulnerabilityMultiplier = build.vulnerabilityActive
    ? 1 + effectiveVulnerability / 100
    : 1;

  const combatDamage = calculateCombatDamage({
    monster,
    baseDamage:
      stats.damage *
      totalMultiplier *
      traitDamageMultiplier *
      rallyingWarCryMultiplier *
      vulnerabilityMultiplier *
      attributeEffects.skillDamageMultiplier *
      accountRiftDamageMultiplier,
    critMultiplier: stats.critMultiplier,
    combatContext: build.combatContext,
    targetIsBoss: build.targetIsBoss,
    currentHpPercent: build.currentHpPercent,
    passives: effectivePassives,
  });

  const cooldownMultiplier =
    getMutationCooldownMultiplier(build.mutations) *
    getTraitCooldownMultiplier(build.traitId);

  const displayedCooldown =
    skill.cooldown === null ? null : skill.cooldown * cooldownMultiplier;

  const critChance = Math.min(Math.max(stats.critChance / 100, 0), 1);

  const expectedDamage =
    combatDamage.normalDamage * (1 - critChance) +
    combatDamage.criticalDamage * critChance;

  const damaging = skill.damageInstances.length > 0;
  return {
    combatDamage,
    normalDamage: damaging ? combatDamage.normalDamage : null,
    criticalDamage: damaging ? combatDamage.criticalDamage : null,
    cooldown: displayedCooldown,
    dps:
      damaging && displayedCooldown !== null && displayedCooldown > 0
        ? expectedDamage / displayedCooldown
        : null,
  };
}

export function calculateSkillDps(
  ...args: Parameters<typeof calculateSkillSummary>
): number | null {
  return calculateSkillSummary(...args).dps;
}
