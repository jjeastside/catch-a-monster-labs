import type { MonsterStatData } from "../types/monster-stats";

export const monsterStats: MonsterStatData[] = [
    {
        monsterId: "dummee",
        growthType: "dummee",
    },
    {
        monsterId: "leaflet",
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