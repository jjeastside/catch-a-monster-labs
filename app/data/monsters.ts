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
        type: "Starter Island",
        name: "First-Time Player Reward",
      },
      {
        type: "Starter Island",
        name: "Swamp Egg",
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
        type: "Starter Island",
        name: "Roaming",
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
        type: "Starter Island",
        name: "Roaming",
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
        type: "Starter Island",
        name: "Roaming",
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
        type: "Starter Island",
        name: "Roaming",
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
        type: "Starter Island",
        name: "Roaming",
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
        name: "Thanksgiving Event 2025",
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
        type: "Evolution",
        name: "Flaragon",
      },
    ],
    skillIds: ["grass-tornado", "solar-beam"],
    hasEvolution: false,
    isEvolved: true,
  },
  {
    id: "crabblaze",
    name: "Crabblaze",
    element: "Fire",
    rarity: "Mythical",
    sources: [
      {
        type: "Nova Coast",
        name: "Rift 2",
      },
      {
        type: "Nova Coast",
        name: "Special Spawn",
      },
    ],
    skillIds: ["fire-dragon-flame-blast", "inferno-maelstrom"],

    passives: [
      {
        id: "hardCarapace",
        effects: [
          {
            stat: "damage",
            value: 30,
          },
          {
            stat: "incomingDamage",
            value: -30,
          },
        ],
      },
    ],

    hasEvolution: false,
  }
];

export const filterLabels = [
  "Source",
  "Rarity",
  "Element",
  "Rank",
  "Evolution",
];