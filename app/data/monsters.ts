import type { Monster, MonsterSkill } from "../types/monster";

const temporarySkills: MonsterSkill[] = [
  { id: "skill-1", name: "Skill 1" },
];

export const monsters: Monster[] = [
  {
    id: "dummee",
    name: "Dummee",
    image: "/monster-artwork/dummee.png",
    element: "Common",
    island: "Starter Island",
    skills: temporarySkills,
    hasEvolution: false,
  },
  {
    id: "leafet",
    name: "Leafet",
    image: "/monster-artwork/leaflet.png",
    element: "Grass",
    island: "Starter Island",
    skills: temporarySkills,
    hasEvolution: false,
  },
  {
    id: "wattoad",
    name: "Wattoad",
    image: "/monster-artwork/wattoad.png",
    element: "Water",
    island: "Skyheart Isle",
    skills: temporarySkills,
    hasEvolution: false,
  },
  {
    id: "treemo",
    name: "Treemo",
    image: "/monster-artwork/treemo.png",
    element: "Grass",
    island: "Skyheart Isle",
    skills: temporarySkills,
    hasEvolution: true,
  },
  {
    id: "flamix",
    name: "Flamix",
    image: "/monster-artwork/flamix.png",
    element: "Fire",
    island: "Volcano",
    skills: temporarySkills,
    hasEvolution: true,
  },
  {
    id: "puffu",
    name: "Puffu",
    image: "/monster-artwork/puffu.png",
    element: "Common",
    island: "Volcano",
    skills: temporarySkills,
    hasEvolution: true,
  },
  {
    id: "flaragflora",
    name: "Flaragflora",
    image: "/monster-artwork/flaragflora.png",
    element: "Fire",
    island: "Volcano",
    skills: temporarySkills,
    hasEvolution: false,
    isEvolved: true,
  }
];

export const filterLabels = ["Island", "Element", "Rank", "Evolution"];