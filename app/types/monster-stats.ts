export type DummeeStatData = {
    monsterId: "dummee";
    growthType: "dummee";

    pvpBaseHealthELevel1?: number;
    pvpBaseDamageELevel1?: number;
    baseHealthELevel1: number;
    baseDamageELevel1: number;
    baseCritChance: number;
    isEvolved?: boolean;
};

export type StandardMonsterStatData = {
    monsterId: string;
    growthType: "standard";

    pvpBaseHealthELevel1?: number;
    pvpBaseDamageELevel1?: number;
    baseHealthELevel1: number;
    baseDamageELevel1: number;
    baseCritChance: number;
    isEvolved?: boolean;
};

export type MonsterStatData =
    | DummeeStatData
    | StandardMonsterStatData;