import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { getSkill, getSkillTotalMultiplier } from "../data/skills";
import type { GeneratedMonster, Monster } from "../types/monster";

export type MonsterComparisonMode = "dps" | "damage" | "health";
export type PassiveCompareMode = "none" | "always" | "conditional";

export type MonsterComparisonStats = {
    damage: number;
    health: number;
    dps: number;
    expectedCritMultiplier: number;
};

const generatedMonsterById = new Map(
    GENERATED_MONSTERS.map((monster) => [monster.id, monster]),
);

function getIncludedPassiveEffects(
    monster: Monster,
    passiveMode: PassiveCompareMode,
) {
    if (passiveMode === "none") {
        return [];
    }

    return (monster.passives ?? [])
        .filter(
            (passive) =>
                passive.condition == null ||
                (passiveMode === "conditional" && passive.id === "vitalSurge"),
        )
        .flatMap((passive) => passive.effects);
}

/**
 * Standardized monster comparison used by both the Monster Browser and
 * Monster Database.
 *
 * Reference preset:
 * - Base E-rank / Level 1 values from GENERATED_MONSTERS
 * - 100% Evolution Multiplier by default for evolved forms
 * - No gear, traits, mutations, account bonuses, or combat-context bonuses
 * - "always" passive mode includes unconditional self passives
 * - DPS uses expected crit damage and sums every damaging skill's DPS,
 *   assuming each skill is used immediately whenever its cooldown ends
 */
export function getMonsterComparisonStats(
    monster: GeneratedMonster,
    evolutionPercent = 100,
    passiveMode: PassiveCompareMode = "always",
): MonsterComparisonStats {
    const evolutionMultiplier = monster.isEvolved ? evolutionPercent / 100 : 1;
    const baseDamage = monster.baseDamageELevel1 * evolutionMultiplier;
    const health = monster.baseHealthELevel1 * evolutionMultiplier;

    const includedPassiveEffects = getIncludedPassiveEffects(monster, passiveMode);

    const passiveDamageBonus = includedPassiveEffects.reduce(
        (total, effect) =>
            effect.stat === "damage" && typeof effect.value === "number"
                ? total + effect.value
                : total,
        0,
    );

    const passiveCritChanceBonus = includedPassiveEffects.reduce(
        (total, effect) =>
            effect.stat === "critChance" && typeof effect.value === "number"
                ? total + effect.value
                : total,
        0,
    );

    const passiveCritDamageBonus = includedPassiveEffects.reduce(
        (total, effect) =>
            effect.stat === "critDamage" && typeof effect.value === "number"
                ? total + effect.value
                : total,
        0,
    );

    const damage = baseDamage * (1 + passiveDamageBonus / 100);

    const critChance = Math.min(
        1,
        Math.max(0, monster.baseCritChance + passiveCritChanceBonus) / 100,
    );
    const critDamageMultiplier = 2 + passiveCritDamageBonus / 100;
    const expectedCritMultiplier =
        1 + critChance * (critDamageMultiplier - 1);

    const dps = monster.skillIds.reduce((total, skillId) => {
        const skill = getSkill(skillId);

        if (
            !skill ||
            skill.cooldown === null ||
            skill.cooldown <= 0 ||
            skill.damageInstances.length === 0
        ) {
            return total;
        }

        return (
            total +
            (damage * getSkillTotalMultiplier(skill) * expectedCritMultiplier) /
                skill.cooldown
        );
    }, 0);

    return {
        damage,
        health,
        dps,
        expectedCritMultiplier,
    };
}

export function getMonsterComparisonValue(
    monster: Monster,
    mode: "index" | MonsterComparisonMode,
    evolutionPercent = 100,
    passiveMode: PassiveCompareMode = "always",
): number {
    const data = generatedMonsterById.get(monster.id);

    if (!data) return 0;
    if (mode === "index") return data.indexPosition;

    return getMonsterComparisonStats(
        data,
        evolutionPercent,
        passiveMode,
    )[mode];
}
