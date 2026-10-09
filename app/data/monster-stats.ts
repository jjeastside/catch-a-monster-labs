import type { MonsterStatData } from "../types/monster-stats";
import { GENERATED_MONSTERS } from "./generated/monsters";

export const monsterStats: MonsterStatData[] = GENERATED_MONSTERS.map(
    (monster): MonsterStatData => {
        const shared = {
            isEvolved: monster.isEvolved === true,
            pvpBaseHealthELevel1: monster.pvpBaseHealthELevel1,
            pvpBaseDamageELevel1: monster.pvpBaseDamageELevel1,
            baseHealthELevel1: monster.baseHealthELevel1,
            baseDamageELevel1: monster.baseDamageELevel1,
            baseCritChance: monster.baseCritChance,
        };

        return monster.growthType === "dummee"
            ? { ...shared, monsterId: "dummee", growthType: "dummee" }
            : { ...shared, monsterId: monster.id, growthType: "standard" };
    },
);

export function getMonsterStatData(monsterId: string): MonsterStatData | null {
    return monsterStats.find((statData) => statData.monsterId === monsterId) ?? null;
}