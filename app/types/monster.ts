import type { SkillId } from "../data/skills";

export type Monster = {
  // Identity
  id: string;
  name: string;

  // Visuals
  image?: string;

  // Classification
  element: Element;
  island: Island;

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

export type Island =
    | "Starter Island"
    | "Skyheart Isle"
    | "Volcano"
    | "Frost Isle"
    | "Duneveil Isle"
    | "Neverland"
    | "Tideland"
    | "Spirit Grove"
    | "Dragon's Breath"
    | "Blossom Haven"
    | "Mobius Circus"
    | "Specter Shallows"
    | "Nova Coast";