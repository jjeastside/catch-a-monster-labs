import type { Rank } from "./build";

export type MonsterSkill = {
  id: string;
  name: string;
};

export type Monster = {
  id: string;
  name: string;
  element: string;
  island: string;
  defaultRank: Rank;
  artworkPath: string;
  evolved: boolean;
  evolutionMultiplier: number;
  growthType: string;
  baseHealth: number;
  baseDamage: number;
  skills: MonsterSkill[];
};
