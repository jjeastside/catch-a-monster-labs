export type Rank = "SS" | "S" | "A" | "B" | "C" | "D" | "E";
export type Mutation = "huge" | "shiny" | "bloodlit" | "fairy";

export type Build = {
  monsterId: string | null;
  level: number;
  rank: Rank | null;
  enhancement: number;
  healthGeneticPotential: number;
  damageGeneticPotential: number;
  evolutionMultiplier: number;
  mutations: Mutation[];
  selectedSkillId: string | null;
  pawId: string | null;
  ringId: string | null;
  accountMultipliers: {
    indexMania: boolean;
    petQuestAchievement: boolean;
    pathOfProgress: boolean;
  };
};

type BuildDefaults = Partial<
    Pick<Build, "monsterId" | "evolutionMultiplier">
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
    evolutionMultiplier: defaults?.evolutionMultiplier ?? 1,
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