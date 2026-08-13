import type { Equipment } from "../types/equipment";

// Base gear values from the Gear CSV. Attributes are stored for a later pass.
export const EQUIPMENT: Equipment[] = [
    { id: "aether-battery", rarity: "Rare", name: "Aether Battery", type: "ring", percentage: 5, attributes: [] },
    { id: "bloodrend-claws", rarity: "Rare", name: "Bloodrend Claws", type: "paw", percentage: 5, attributes: [] },
    { id: "honeycore-starflower", rarity: "Epic", name: "Honeycore Starflower", type: "ring", percentage: 5, attributes: [] },
    { id: "bone-ripper", rarity: "Epic", name: "Bone Ripper", type: "paw", percentage: 5, attributes: [] },
    { id: "glowbud-starflower", rarity: "Epic", name: "Glowbud Starflower", type: "ring", percentage: 8, attributes: [] },
    { id: "bonebreaker-pincer", rarity: "Epic", name: "Bonebreak Pincer", type: "paw", percentage: 8, attributes: [] },
    { id: "ancient-coin-charm", rarity: "Legendary", name: "Ancient Coin Charm", type: "ring", percentage: 12, attributes: ["random"] },
    { id: "riftfang-skullhelm", rarity: "Legendary", name: "Riftfang Skullhelm", type: "paw", percentage: 12, attributes: ["random"] },
    { id: "solar-core", rarity: "Legendary", name: "Solar Core", type: "ring", percentage: 15, attributes: ["random"] },
    { id: "steelshade-claw", rarity: "Legendary", name: "Steelshade Claw", type: "paw", percentage: 15, attributes: ["random"] },
    { id: "verdant-elixir", rarity: "Mythical", name: "Verdant Elixir", type: "ring", percentage: 20, attributes: ["random", "random"] },
    { id: "gale-wingblade", rarity: "Mythical", name: "Gale Wingblade", type: "paw", percentage: 20, attributes: ["random", "random"] },
    { id: "aegislight-power-orb", rarity: "Mythical", name: "Aegislight Power Orb", type: "ring", percentage: 24, attributes: ["random", "random"] },
    { id: "void-tendril-whip", rarity: "Mythical", name: "Void Tendril Whip", type: "paw", percentage: 24, attributes: ["random", "random"] },
    { id: "radish-lance", rarity: "Mythical", name: "Radish Lance", type: "paw", percentage: 26, attributes: ["all-damage-2", "dominance"] },
    { id: "inferno-dragon-ring", rarity: "Secret", name: "Inferno Dragon Ring", type: "ring", percentage: 30, attributes: ["damage-redirect", "random", "random"] },
    { id: "stellar-wing-amulet", rarity: "Secret", name: "Stellar Wing Amulet", type: "ring", percentage: 30, attributes: ["moment-of-serenity", "random", "random"] },
    { id: "dragon-remains-staff", rarity: "Secret", name: "Dragon Remains Staff", type: "paw", percentage: 30, attributes: ["life-siphon", "random", "random"] },
    { id: "solar-stellar-chronometer", rarity: "Secret", name: "Solar-Stellar Chronometer", type: "paw", percentage: 30, attributes: ["dual-cast", "random", "random"] },
];

export const PAWS = EQUIPMENT.filter((item) => item.type === "paw");
export const RINGS = EQUIPMENT.filter((item) => item.type === "ring");

export function getEquipment(id: string | null): Equipment | null {
    return id ? EQUIPMENT.find((item) => item.id === id) ?? null : null;
}