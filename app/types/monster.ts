export type MonsterSkill = {
  id: string;
  name: string;
};

export type Monster = {
  id: string;
  name: string;
  element: string;
  island: string;
  defaultRank: "SS" | "S" | "A" | "B" | "C" | "D" | "E";
  artworkPath: string;
  evolved: boolean;
  evolutionMultiplier: number;
  growthType: string;
  baseHealth: number;
  baseDamage: number;
  skills: MonsterSkill[];
};
