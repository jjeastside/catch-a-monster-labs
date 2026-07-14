import type { Monster } from "../types/monster";

// TEMPORARY DATA: Verified game values have not been provided. These entries
// exist only to support the first selection and presentation data layer.
const temporarySkills = [{ id: "skill-1", name: "Skill 1" }];

export const monsters: Monster[] = [
  { id: "dummee", name: "Dummee", element: "Neutral", island: "Island 1", defaultRank: "E", artworkPath: "/monster-artwork/dummee.png", evolved: false, evolutionMultiplier: 1, growthType: "Temporary", baseHealth: 100, baseDamage: 10, skills: temporarySkills },
  { id: "leaflet", name: "Leaflet", element: "Nature", island: "Island 1", defaultRank: "D", artworkPath: "/monster-artwork/leaflet.png", evolved: false, evolutionMultiplier: 1, growthType: "Temporary", baseHealth: 120, baseDamage: 12, skills: temporarySkills },
  { id: "wattoad", name: "Wattoad", element: "Water", island: "Island 2", defaultRank: "C", artworkPath: "/monster-artwork/wattoad.png", evolved: false, evolutionMultiplier: 1, growthType: "Temporary", baseHealth: 140, baseDamage: 14, skills: temporarySkills },
  { id: "treemo", name: "Treemo", element: "Nature", island: "Island 2", defaultRank: "B", artworkPath: "/monster-artwork/treemo.png", evolved: true, evolutionMultiplier: 1.1, growthType: "Temporary", baseHealth: 160, baseDamage: 16, skills: temporarySkills },
  { id: "flamix", name: "Flamix", element: "Fire", island: "Island 3", defaultRank: "A", artworkPath: "/monster-artwork/flamix.png", evolved: true, evolutionMultiplier: 1.1, growthType: "Temporary", baseHealth: 180, baseDamage: 18, skills: temporarySkills },
  { id: "puffu", name: "Puffu", element: "Air", island: "Island 3", defaultRank: "S", artworkPath: "/monster-artwork/puffu.png", evolved: true, evolutionMultiplier: 1.1, growthType: "Temporary", baseHealth: 200, baseDamage: 20, skills: temporarySkills },
];

export const filterLabels = ["Island", "Element", "Rank", "Evolution"];
