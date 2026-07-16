import type { Build } from "../../types/build";
import type { MonsterStatData } from "../../types/monster-stats";

import { getEnhancementMultiplier } from "./enhancements";
import { getGeneticPotentialMultiplier } from "./genetic-potential";
import {
    dummeeDamageAtLevel,
    dummeeHealthAtLevel,
    standardGrowth,
} from "./growth";
import { getRankMultiplier } from "./ranks";

export type CalculatedStats = {
    health: number;
    damage: number;

    rankMultiplier: number;
    enhancementMultiplier: number;

    healthGeneticMultiplier: number;
    damageGeneticMultiplier: number;

    healthTotalMultiplier: number;
    damageTotalMultiplier: number;

    growthValue: number;
    growthLabel: "multiplier" | "result";

    eRankHealth: number;
    eRankDamage: number;

    rankedHealth: number;
    rankedDamage: number;
};

function validateLevel(level: number): void {
    if (!Number.isInteger(level) || level < 1 || level > 100) {
        throw new RangeError(
            "Level must be an integer from 1 through 100.",
        );
    }
}

function calculateDummeeStats(
    level: number,
    rankMultiplier: number,
    enhancementMultiplier: number,
    healthGeneticMultiplier: number,
    damageGeneticMultiplier: number,
): CalculatedStats {
    const eRankHealth = dummeeHealthAtLevel(level);
    const eRankDamage = dummeeDamageAtLevel(eRankHealth);

    const rankedHealth = eRankHealth * rankMultiplier;
    const rankedDamage = eRankDamage * rankMultiplier;

    const healthTotalMultiplier =
        rankMultiplier *
        enhancementMultiplier *
        healthGeneticMultiplier;

    const damageTotalMultiplier =
        rankMultiplier *
        enhancementMultiplier *
        damageGeneticMultiplier;

    return {
        health:
            rankedHealth *
            enhancementMultiplier *
            healthGeneticMultiplier,

        damage:
            rankedDamage *
            enhancementMultiplier *
            damageGeneticMultiplier,

        rankMultiplier,
        enhancementMultiplier,
        healthGeneticMultiplier,
        damageGeneticMultiplier,

        healthTotalMultiplier,
        damageTotalMultiplier,

        growthValue: eRankHealth,
        growthLabel: "result",

        eRankHealth,
        eRankDamage,

        rankedHealth,
        rankedDamage,
    };
}

function calculateStandardStats(
    statData: Extract<
        MonsterStatData,
        { growthType: "standard" }
    >,
    level: number,
    rankMultiplier: number,
    enhancementMultiplier: number,
    healthGeneticMultiplier: number,
    damageGeneticMultiplier: number,
): CalculatedStats {
    const growthValue = standardGrowth(level);

    const eRankHealth =
        statData.baseHealthELevel1 * growthValue;

    const eRankDamage =
        statData.baseDamageELevel1 * growthValue;

    const rankedHealth = eRankHealth * rankMultiplier;
    const rankedDamage = eRankDamage * rankMultiplier;

    const healthTotalMultiplier =
        rankMultiplier *
        enhancementMultiplier *
        healthGeneticMultiplier;

    const damageTotalMultiplier =
        rankMultiplier *
        enhancementMultiplier *
        damageGeneticMultiplier;

    return {
        health:
            rankedHealth *
            enhancementMultiplier *
            healthGeneticMultiplier,

        damage:
            rankedDamage *
            enhancementMultiplier *
            damageGeneticMultiplier,

        rankMultiplier,
        enhancementMultiplier,
        healthGeneticMultiplier,
        damageGeneticMultiplier,

        healthTotalMultiplier,
        damageTotalMultiplier,

        growthValue,
        growthLabel: "multiplier",

        eRankHealth,
        eRankDamage,

        rankedHealth,
        rankedDamage,
    };
}

export function calculateStats(
    statData: MonsterStatData | null,
    build: Pick<
        Build,
        | "level"
        | "rank"
        | "enhancement"
        | "healthGeneticPotential"
        | "damageGeneticPotential"
    >,
): CalculatedStats | null {
    validateLevel(build.level);

    if (!statData || !build.rank) {
        return null;
    }

    const rankMultiplier = getRankMultiplier(build.rank);

    const enhancementMultiplier =
        getEnhancementMultiplier(build.enhancement);

    const healthGeneticMultiplier =
        getGeneticPotentialMultiplier(
            build.healthGeneticPotential,
        );

    const damageGeneticMultiplier =
        getGeneticPotentialMultiplier(
            build.damageGeneticPotential,
        );

    if (statData.growthType === "dummee") {
        return calculateDummeeStats(
            build.level,
            rankMultiplier,
            enhancementMultiplier,
            healthGeneticMultiplier,
            damageGeneticMultiplier,
        );
    }

    return calculateStandardStats(
        statData,
        build.level,
        rankMultiplier,
        enhancementMultiplier,
        healthGeneticMultiplier,
        damageGeneticMultiplier,
    );
}