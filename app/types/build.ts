export type Rank = "SS" | "S" | "A" | "B" | "C" | "D" | "E";
export type Mutation = "huge" | "shiny" | "bloodlit" | "fairy";

export type Build = {
  monsterId: string | null;
  level: number;
  rank: Rank | null;
  enhancement: number;
  geneticPotential: number;
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

type BuildMonster = Pick<Build, "monsterId" | "rank" | "evolutionMultiplier">;

export function createDefaultBuild(monster: BuildMonster | null = null): Build {
  return {
    monsterId: monster?.monsterId ?? null,
    level: 1,
    rank: monster?.rank ?? null,
    enhancement: 0,
    geneticPotential: 0,
    evolutionMultiplier: monster?.evolutionMultiplier ?? 1,
    mutations: [],
    selectedSkillId: null,
    pawId: null,
    ringId: null,
    accountMultipliers: { indexMania: false, petQuestAchievement: false, pathOfProgress: false },
  };
}
