export type DummeeStatData = {
    monsterId: "dummee";
    growthType: "dummee";

    baseHealthELevel1: number;
    baseDamageELevel1: number;
};

export type StandardMonsterStatData = {
    monsterId: string;
    growthType: "standard";

    baseHealthELevel1: number;
    baseDamageELevel1: number;
};

export type MonsterStatData =
    | DummeeStatData
    | StandardMonsterStatData;