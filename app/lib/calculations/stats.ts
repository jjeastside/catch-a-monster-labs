import type { Build } from "../../types/build";
import type { MonsterStatData } from "../../types/monster-stats";
import {
    getSkill,
    getSkillTotalMultiplier,
} from "../../data/skills";

import {
    dummeeDamageAtLevel,
    dummeeHealthAtLevel,
    standardGrowth,
} from "./growth";

import {
    createStatMultipliers,
    type StatMultipliers,
} from "./multiplier-context";

export type CalculatedStats = {
    health: number;
    damage: number;

    critChance: number;
    critMultiplier: number;
    criticalDamage: number;

    skillMultiplier: number;
    skillDamage: number;

    rankMultiplier: number;
    enhancementMultiplier: number;

    healthGeneticMultiplier: number;
    damageGeneticMultiplier: number;
    evolutionMultiplier: number;

    mutationHealthMultiplier: number;
    mutationDamageMultiplier: number;

    healthTotalMultiplier: number;
    damageTotalMultiplier: number;

    growthValue: number;
    growthLabel: "multiplier" | "result";

    eRankHealth: number;
    eRankDamage: number;

    rankedHealth: number;
    rankedDamage: number;
};

type StatsBuild = Pick<
    Build,
    | "level"
    | "rank"
    | "enhancement"
    | "healthGeneticPotential"
    | "damageGeneticPotential"
    | "evolutionPercent"
    | "mutations"
    | "selectedSkillId"
>;

function validateLevel(level: number): void {
    if (!Number.isInteger(level) || level < 1 || level > 100) {
        throw new RangeError(
            "Level must be an integer from 1 through 100.",
        );
    }
}

function createCalculatedStats(
    eRankHealth: number,
    eRankDamage: number,
    growthValue: number,
    growthLabel: CalculatedStats["growthLabel"],
    multipliers: StatMultipliers,
): CalculatedStats {
    const rankedHealth =
        eRankHealth * multipliers.rank;

    const rankedDamage =
        eRankDamage * multipliers.rank;

    const health =
        eRankHealth *
        multipliers.healthTotal;

    const damage =
        eRankDamage *
        multipliers.damageTotal;

    const criticalDamage =
        damage *
        multipliers.critMultiplier;

    const skill =
        getSkill(multipliers.build.selectedSkillId);

    const skillMultiplier =
        skill
            ? getSkillTotalMultiplier(skill)
            : 1;

    const skillDamage =
        damage * skillMultiplier;

    return {
        health,
        damage,

        critChance:
            multipliers.critChance,

        critMultiplier:
            multipliers.critMultiplier,

        criticalDamage,

        skillMultiplier,
        skillDamage,

        rankMultiplier:
            multipliers.rank,

        enhancementMultiplier:
            multipliers.enhancement,

        healthGeneticMultiplier:
            multipliers.healthGenetic,

        damageGeneticMultiplier:
            multipliers.damageGenetic,

        evolutionMultiplier:
            multipliers.evolution,

        mutationHealthMultiplier:
            multipliers.mutationHealth,

        mutationDamageMultiplier:
            multipliers.mutationDamage,

        healthTotalMultiplier:
            multipliers.healthTotal,

        damageTotalMultiplier:
            multipliers.damageTotal,

        growthValue,
        growthLabel,

        eRankHealth,
        eRankDamage,

        rankedHealth,
        rankedDamage,
    };
}

function calculateDummeeStats(
    statData: Extract<
        MonsterStatData,
        { growthType: "dummee" }
    >,
    level: number,
    multipliers: StatMultipliers,
): CalculatedStats {
    const eRankHealth =
        dummeeHealthAtLevel(
            level,
            statData.baseHealthELevel1,
        );

    const eRankDamage =
        dummeeDamageAtLevel(
            eRankHealth,
            statData.baseHealthELevel1,
            statData.baseDamageELevel1,
        );

    return createCalculatedStats(
        eRankHealth,
        eRankDamage,
        eRankHealth,
        "result",
        multipliers,
    );
}

function calculateStandardStats(
    statData: Extract<
        MonsterStatData,
        { growthType: "standard" }
    >,
    level: number,
    multipliers: StatMultipliers,
): CalculatedStats {
    const growthValue =
        standardGrowth(level);

    const eRankHealth =
        statData.baseHealthELevel1 *
        growthValue;

    const eRankDamage =
        statData.baseDamageELevel1 *
        growthValue;

    return createCalculatedStats(
        eRankHealth,
        eRankDamage,
        growthValue,
        "multiplier",
        multipliers,
    );
}

export function calculateStats(
    statData: MonsterStatData | null,
    build: StatsBuild,
): CalculatedStats | null {
    validateLevel(build.level);

    if (!statData) {
        return null;
    }

    const multipliers =
        createStatMultipliers(build);

    if (!multipliers) {
        return null;
    }

    if (statData.growthType === "dummee") {
        return calculateDummeeStats(
            statData,
            build.level,
            multipliers,
        );
    }

    return calculateStandardStats(
        statData,
        build.level,
        multipliers,
    );
}