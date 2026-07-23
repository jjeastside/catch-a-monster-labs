import type { SkillId } from "../data/skills";

export type Monster = {
  // Identity
  id: string;
  name: string;

  // Visuals
  image?: string;

  // Classification
  element: Element;
  rarity: Rarity;
  sources: MonsterSource[];

  // Gameplay
  skillIds: SkillId[];
  hasEvolution: boolean;
  isEvolved?: boolean;

  // Optional metadata
  obtainMethod?: string;
  description?: string;
};

export type Element =
    | "Common"
    | "Water"
    | "Fire"
    | "Grass"
    | "Ice"
    | "Ground";

export type Rarity =
    | "Common"
    | "Uncommon"
    | "Rare"
    | "Epic"
    | "Legendary"
    | "Mythical"
    | "Secret"
    | "Void";

export type SourceType =
    | "Island"
    | "Event"
    | "Egg"
    | "Starter Pet"
    | "Dungeon"
    | "Trial"
    | "Raid"
    | "Other";

export type MonsterSource = {
  type: SourceType;
  name: string;
};