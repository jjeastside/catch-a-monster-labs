import type { Monster } from "../types/monster";
import { GENERATED_MONSTERS } from "./generated/monsters";

export const monsters: Monster[] = [...GENERATED_MONSTERS];

export const filterLabels = [
  "Source",
  "Rarity",
  "Element",
  "Rank",
  "Evolution",
];