import type { SkillId } from "../data/skills";

export type Rank = "SS" | "S" | "A" | "B" | "C" | "D" | "E";
export type CombatContext = "standard" | "spire" | "rift" | "dungeon";
export type Mutation =
    | "huge"
    | "huge-x"
    | "shiny"
    | "shiny-x"
    | "bloodlit"
    | "bloodlit-x"
    | "fairy"
    | "fairy-x";
export type Passive =
    | "vitalSurge"
    | "criticalChance"
    | "criticalDamage"
    | "hardCarapace"
    | "sacredBeetle"
    | "fortuneSpirit"
    | "mentorSpirit"
    | "captureBoon"
    | "bossSlayer"
    | "bossResistance"
    | "spireDominance"
    | "spireGuard"
    | "riftDominance"
    | "riftGuard"
    | "trialPower"
    | "dungeonGuard"
    | "lastBlessing"
    | "marigonFortuneSpirit"
    | "potentialSeeker"
    | "dragonsCurse"
    | "mutationCatalyst";

export type PassiveEffectStat =
    | "damage"
    | "incomingDamage"
    | "critChance"
    | "critDamage"
    | "bossDamage"
    | "bossIncomingDamage"
    | "spireDamage"
    | "spireIncomingDamage"
    | "riftDamage"
    | "riftIncomingDamage"
    | "dungeonDamage"
    | "dungeonIncomingDamage"
    | "coinGain"
    | "xpGain"
    | "rankLuck"
    | "healthRestore"
    | "mutationRate"
    | "stunImmunity";

export type PassiveEffect = {
  stat: PassiveEffectStat;
  value: number | boolean;
};

export type MonsterPassive = {
  id: Passive;
  effects: PassiveEffect[];
  values?: number[];
  condition?: number | string;
};

export type Build = {
  monsterId: string | null;
  level: number;
  rank: Rank | null;
  enhancement: number;
  healthGeneticPotential: number;
  damageGeneticPotential: number;
  evolutionPercent: number;
  mutations: Mutation[];
  traitId: string | null;
  targetStatused: boolean;
  targetIsBoss: boolean;


  selectedSkillId: SkillId | null;

  weaponId: string | null;
  armorId: string | null;
  weaponAttributeIds: string[];
  armorAttributeIds: string[];
  currentHpPercent: number;
  combatContext: CombatContext;
  preDungeonLevel: number | null;
  teammateMonsterIds: [string | null, string | null];

  accountMultipliers: {
    completedAchievementIds: string[];
  };
};

type BuildDefaults = Partial<
    Pick<Build, "monsterId" | "evolutionPercent">
>;

export function createDefaultBuild(
    defaults: BuildDefaults | null = null,
): Build {
  return {
    monsterId: defaults?.monsterId ?? null,
    level: 1,
    rank: defaults?.monsterId ? "E" : null,
    enhancement: 0,
    healthGeneticPotential: 6,
    damageGeneticPotential: 6,
    evolutionPercent: defaults?.evolutionPercent ?? 100,
    mutations: [],
    traitId: null,
    targetStatused: false,
    targetIsBoss: false,
    selectedSkillId: null,
    weaponId: null,
    armorId: null,
    weaponAttributeIds: [],
    armorAttributeIds: [],
    currentHpPercent: 100,
    combatContext: "standard",
    preDungeonLevel: null,
    teammateMonsterIds: [null, null],
    accountMultipliers: {
      completedAchievementIds: [],
    },
  };
}