import type { SkillId } from "../data/skills";
import type { MonsterPassive } from "./build";

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
  passives?: MonsterPassive[];
  hasEvolution: boolean;
  isEvolved?: boolean;

  // Optional metadata
  obtainMethod?: string;
  description?: string;
  evolutionSource?: string;
};

export type GeneratedMonster = Monster & {
  baseDamageELevel1: number;
  baseHealthELevel1: number;
  baseCritChance: number;
  growthType: "dummee" | "standard";
  indexPosition: number;
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

export const ISLANDS = [
  "Starter Island",
  "Volcano",
  "Frost Isle",
  "Neverland",
  "Duneveil Isle",
  "Tideland",
  "Spirit Grove",
  "Dragon's Breath",
  "Blossom Haven",
  "Mobius Circus",
  "Specter Shallows",
  "Nova Coast",
  "Splash Isle",
  "Coilwork City",
] as const;

export type Island = (typeof ISLANDS)[number];

export type SourceType =
    | "First-Time Reward"
    | "Egg"
    | "Island Spawn"
    | "Island Special Spawn"
    | "Rift"
    | "Event"
    | "Battle Pass"
    | "Evolution"
    | "Chest"
    | "Shop"
    | "Contest";

export type SourceStatus =
    | "Current"
    | "Legacy"
    | "Unavailable";

export type SpawnTime =
    | "Day"
    | "Night";

export type Weather =
    | "Aurora"
    | "Rain"
    | "Snow"
    | "Storm";

export type MonsterSource = {
  type: SourceType;
  name: string;
  location?: string;
  condition?: string;
  status: SourceStatus;
  notes?: string;
  time?: SpawnTime;
  weather?: Weather[];
};