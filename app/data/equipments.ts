import type { Equipment } from "../types/equipment";

// Base gear values from the Gear CSV. Attributes are stored for a later pass.
export const EQUIPMENT: Equipment[] = [
    { id: "aether-battery", rarity: "Rare", name: "Aether Battery", type: "armor", percentage: 5, attributes: [] },
    { id: "bloodrend-claws", rarity: "Rare", name: "Bloodrend Claws", type: "weapon", percentage: 5, attributes: [] },
    { id: "honeycore-starflower", rarity: "Epic", name: "Honeycore Starflower", type: "armor", percentage: 5, attributes: [] },
    { id: "bone-ripper", rarity: "Epic", name: "Bone Ripper", type: "weapon", percentage: 5, attributes: [] },
    { id: "glowbud-starflower", rarity: "Epic", name: "Glowbud Starflower", type: "armor", percentage: 8, attributes: [] },
    { id: "bonebreaker-pincer", rarity: "Epic", name: "Bonebreak Pincer", type: "weapon", percentage: 8, attributes: [] },
    { id: "ancient-coin-charm", rarity: "Legendary", name: "Ancient Coin Charm", type: "armor", percentage: 12, attributes: ["random"] },
    { id: "riftfang-skullhelm", rarity: "Legendary", name: "Riftfang Skullhelm", type: "weapon", percentage: 12, attributes: ["random"] },
    { id: "solar-core", rarity: "Legendary", name: "Solar Core", type: "armor", percentage: 15, attributes: ["random"] },
    { id: "steelshade-claw", rarity: "Legendary", name: "Steelshade Claw", type: "weapon", percentage: 15, attributes: ["random"] },
    { id: "verdant-elixir", rarity: "Mythical", name: "Verdant Elixir", type: "armor", percentage: 20, attributes: ["random", "random"] },
    { id: "gale-wingblade", rarity: "Mythical", name: "Gale Wingblade", type: "weapon", percentage: 20, attributes: ["random", "random"] },
    { id: "aegislight-power-orb", rarity: "Mythical", name: "Aegislight Power Orb", type: "armor", percentage: 24, attributes: ["random", "random"] },
    { id: "void-tendril-whip", rarity: "Mythical", name: "Void Tendril Whip", type: "weapon", percentage: 24, attributes: ["random", "random"] },
    { id: "radish-lance", rarity: "Mythical", name: "Radish Lance", type: "weapon", percentage: 26, attributes: ["all-damage-2", "dominance"] },
    { id: "inferno-dragon-ring", rarity: "Secret", name: "Inferno Dragon Ring", type: "armor", percentage: 30, attributes: ["damage-redirect", "random", "random"] },
    { id: "stellar-wing-amulet", rarity: "Secret", name: "Stellar Wing Amulet", type: "armor", percentage: 30, attributes: ["moment-of-serenity", "random", "random"] },
    { id: "dragon-remains-staff", rarity: "Secret", name: "Dragon Remains Staff", type: "weapon", percentage: 30, attributes: ["life-siphon", "random", "random"] },
    { id: "solar-stellar-chronometer", rarity: "Secret", name: "Solar-Stellar Chronometer", type: "weapon", percentage: 30, attributes: ["dual-cast", "random", "random"] },
];

export const WEAPONS = EQUIPMENT.filter((item) => item.type === "weapon");
export const ARMORS = EQUIPMENT.filter((item) => item.type === "armor");

export function getEquipment(id: string | null): Equipment | null {
    return id ? EQUIPMENT.find((item) => item.id === id) ?? null : null;
}