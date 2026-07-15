import type { Rank } from "../../types/build";
import type { MonsterStatData } from "../../types/monster-stats";

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

    growthValue: number;
    growthLabel: "multiplier" | "result";

    eRankHealth: number;
    eRankDamage: number;
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
): CalculatedStats {
    const eRankHealth = dummeeHealthAtLevel(level);
    const eRankDamage = dummeeDamageAtLevel(eRankHealth);

    return {
        health: eRankHealth * rankMultiplier,
        damage: eRankDamage * rankMultiplier,
        rankMultiplier,
        growthValue: eRankHealth,
        growthLabel: "result",
        eRankHealth,
        eRankDamage,
    };
}

function calculateStandardStats(
    statData: Extract<
        MonsterStatData,
        { growthType: "standard" }
    >,
    level: number,
    rankMultiplier: number,
): CalculatedStats {
    const growthValue = standardGrowth(level);

    const eRankHealth =
        statData.baseHealthELevel1 * growthValue;

    const eRankDamage =
        statData.baseDamageELevel1 * growthValue;

    return {
        health: eRankHealth * rankMultiplier,
        damage: eRankDamage * rankMultiplier,
        rankMultiplier,
        growthValue,
        growthLabel: "multiplier",
        eRankHealth,
        eRankDamage,
    };
}

export function calculateStats(
    statData: MonsterStatData | null,
    level: number,
    rank: Rank,
): CalculatedStats | null {
    validateLevel(level);

    if (!statData) {
        return null;
    }

    const rankMultiplier = getRankMultiplier(rank);

    if (statData.growthType === "dummee") {
        return calculateDummeeStats(
            level,
            rankMultiplier,
        );
    }

    return calculateStandardStats(
        statData,
        level,
        rankMultiplier,
    );
}