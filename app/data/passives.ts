import type { Passive } from "../types/build";

export type PassiveDefinition = {
    id: Passive;
    name: string;
};

export const PASSIVE_DEFINITIONS: Record<Passive, PassiveDefinition> = {
    vitalSurge: {
        id: "vitalSurge",
        name: "Vital Surge",
    },

    criticalChance: {
        id: "criticalChance",
        name: "Critical Chance",
    },

    criticalDamage: {
        id: "criticalDamage",
        name: "Critical Damage",
    },

    hardCarapace: {
        id: "hardCarapace",
        name: "Hard Carapace",
    },

    sacredBeetle: {
        id: "sacredBeetle",
        name: "Sacred Beetle",
    },

    fortuneSpirit: {
        id: "fortuneSpirit",
        name: "Fortune Spirit",
    },

    mentorSpirit: {
        id: "mentorSpirit",
        name: "Mentor Spirit",
    },

    captureBoon: {
        id: "captureBoon",
        name: "Capturer's Boon",
    },

    bossSlayer: {
        id: "bossSlayer",
        name: "Boss Slayer",
    },

    bossResistance: {
        id: "bossResistance",
        name: "Boss Resistance",
    },

    spireDominance: {
        id: "spireDominance",
        name: "Spire Dominance",
    },

    spireGuard: {
        id: "spireGuard",
        name: "Spire Guard",
    },

    riftDominance: {
        id: "riftDominance",
        name: "Rift Dominance",
    },

    riftGuard: {
        id: "riftGuard",
        name: "Rift Guard",
    },

    trialPower: {
        id: "trialPower",
        name: "Trial Power",
    },

    dungeonGuard: {
        id: "dungeonGuard",
        name: "Dungeon Guard",
    },

    lastBlessing: {
        id: "lastBlessing",
        name: "Last Blessing",
    },
};