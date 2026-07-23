import type { Monster } from "../types/monster";

export const monsters: Monster[] = [
  {
    id: "dummee",
    name: "Dummee",
    image: "/monster-artwork/dummee.png",
    element: "Common",
    rarity: "Common",
    sources: [
      {
        type: "Starter Pet",
        name: "First-Time Player Reward",
      },
      {
        type: "Egg",
        name: "Swap Egg",
      },
    ],
    skillIds: ["air-bullet"],
    hasEvolution: false,
  },
  {
    id: "leafet",
    name: "Leafet",
    image: "/monster-artwork/leafet.png",
    element: "Grass",
    rarity: "Common",
    sources: [
      {
        type: "Island",
        name: "Starter Island",
      },
    ],
    skillIds: ["seed-grenade"],
    hasEvolution: false,
  },
  {
    id: "wattoad",
    name: "Wattoad",
    image: "/monster-artwork/wattoad.png",
    element: "Water",
    rarity: "Uncommon",
    sources: [
      {
        type: "Island",
        name: "Starter Island",
      },
    ],
    skillIds: ["water-jet"],
    hasEvolution: false,
  },
  {
    id: "treemo",
    name: "Treemo",
    image: "/monster-artwork/treemo.png",
    element: "Grass",
    rarity: "Uncommon",
    sources: [
      {
        type: "Island",
        name: "Starter Island",
      },
    ],
    skillIds: ["seed-grenade"],
    hasEvolution: false,
  },
  {
    id: "flamix",
    name: "Flamix",
    image: "/monster-artwork/flamix.png",
    element: "Fire",
    rarity: "Uncommon",
    sources: [
      {
        type: "Island",
        name: "Starter Island",
      },
    ],
    skillIds: ["fireball", "air-bullet"],
    hasEvolution: false,
  },
  {
    id: "puffu",
    name: "Puffu",
    image: "/monster-artwork/puffu.png",
    element: "Common",
    rarity: "Rare",
    sources: [
      {
        type: "Island",
        name: "Starter Island",
      },
    ],
    skillIds: ["water-jet", "wind-disc"],
    hasEvolution: false,
  },
  {
    id: "candlechick",
    name: "Candlechick",
    image: "/monster-artwork/candlechick.png",
    element: "Fire",
    rarity: "Rare",
    sources: [
      {
        type: "Event",
        name: "Christmas Event",
      },
    ],
    skillIds: ["water-jet", "wind-disc"],
    hasEvolution: false,
  },
  {
    id: "flaragflora",
    name: "Flaragflora",
    image: "/monster-artwork/flaragflora.png",
    element: "Grass",
    rarity: "Mythical",
    sources: [
      {
        type: "Island",
        name: "Volcano",
      },
    ],
    skillIds: ["grass-tornado", "solar-beam"],
    hasEvolution: false,
    isEvolved: true,
  },
];

export const filterLabels = [
  "Source",
  "Rarity",
  "Element",
  "Rank",
  "Evolution",
];