import type { MonsterStatData } from "../types/monster-stats";

export const monsterStats: MonsterStatData[] = [
    {
        monsterId: "dummee",
        growthType: "dummee",
        baseHealthELevel1: 53,
        baseDamageELevel1: 8,
    },
    {
        monsterId: "leafet",
        growthType: "standard",
        baseHealthELevel1: 43.5,
        baseDamageELevel1: 7.25,
    },
    {
        monsterId: "wattoad",
        growthType: "standard",
        baseHealthELevel1: 63.07,
        baseDamageELevel1: 10.51,
    },
    {
        monsterId: "treemo",
        growthType: "standard",
        baseHealthELevel1: 163.1,
        baseDamageELevel1: 15.24,
    },
    {
        monsterId: "flamix",
        growthType: "standard",
        baseHealthELevel1: 236.5,
        baseDamageELevel1: 22.1,
    },
    {
        monsterId: "puffu",
        growthType: "standard",
        baseHealthELevel1: 342.9,
        baseDamageELevel1: 32,
    },
    {
        monsterId: "candlechick",
        growthType: "standard",
        baseHealthELevel1: 342.9,
        baseDamageELevel1: 32,
    },
    {
        monsterId: "flaragflora",
        growthType: "standard",
        baseHealthELevel1: 117500,
        baseDamageELevel1: 15800,
    },
];

export function getMonsterStatData(
    monsterId: string,
): MonsterStatData | null {
    return (
        monsterStats.find(
            (statData) => statData.monsterId === monsterId,
        ) ?? null
    );
}