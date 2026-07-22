import type { SkillId } from "../data/skills";

export type Rank = "SS" | "S" | "A" | "B" | "C" | "D" | "E";
export type Mutation = "huge" | "shiny" | "bloodlit" | "fairy";

export type Build = {
  monsterId: string | null;
  level: number;
  rank: Rank | null;
  enhancement: number;
  healthGeneticPotential: number;
  damageGeneticPotential: number;
  evolutionPercent: number;
  mutations: Mutation[];

  selectedSkillId: SkillId | null;

  pawId: string | null;
  ringId: string | null;

  accountMultipliers: {
    indexMania: boolean;
    petQuestAchievement: boolean;
    pathOfProgress: boolean;
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
    healthGeneticPotential: 0,
    damageGeneticPotential: 0,
    evolutionPercent: defaults?.evolutionPercent ?? 100,
    mutations: [],
    selectedSkillId: null,
    pawId: null,
    ringId: null,
    accountMultipliers: {
      indexMania: false,
      petQuestAchievement: false,
      pathOfProgress: false,
    },
  };
}