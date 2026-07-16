import type { Build } from "../../types/build";
import type { MonsterStatData } from "../../types/monster-stats";

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

    rankMultiplier: number;
    enhancementMultiplier: number;

    healthGeneticMultiplier: number;
    damageGeneticMultiplier: number;
    evolutionMultiplier: number;

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

    return {
        health:
            eRankHealth *
            multipliers.healthTotal,

        damage:
            eRankDamage *
            multipliers.damageTotal,

        rankMultiplier: multipliers.rank,
        enhancementMultiplier:
        multipliers.enhancement,

        healthGeneticMultiplier:
        multipliers.healthGenetic,

        damageGeneticMultiplier:
        multipliers.damageGenetic,

        evolutionMultiplier:
        multipliers.evolution,

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
    level: number,
    multipliers: StatMultipliers,
): CalculatedStats {
    const eRankHealth =
        dummeeHealthAtLevel(level);

    const eRankDamage =
        dummeeDamageAtLevel(eRankHealth);

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
    const growthValue = standardGrowth(level);

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