import type { MonsterPassive, Passive } from "../types/build";

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
    marigonFortuneSpirit: {
        id: "marigonFortuneSpirit",
        name: "Fortune Spirit",
    },
    potentialSeeker: {
        id: "potentialSeeker",
        name: "Potential Seeker",
    },
    dragonsCurse: {
        id: "dragonsCurse",
        name: "Dragon's Curse",
    },

    mutationCatalyst: {
        id: "mutationCatalyst",
        name: "Mutation Catalyst",
    },
};

export function getPassiveImagePath(
    passive: MonsterPassive,
): string | null {
    const files: Partial<Record<Passive, string>> = {
        vitalSurge: "vital-surge.png",

        criticalChance: "critical-damage.png",
        criticalDamage: "critical-damage.png",
        marigonFortuneSpirit: "critical-damage.png",

        hardCarapace: "hard-carapace.png",

        sacredBeetle: "sacred-beetle.png",
        lastBlessing: "last-blessing.png",
        potentialSeeker: "potential-seeker.png",
        mutationCatalyst: "mutation-catalyst.png",

        fortuneSpirit: "fortune-spirit.png",
        mentorSpirit: "mentor-spirit.png",

        captureBoon: "capturer's-boon.png",

        bossSlayer: "boss-slayer.png",
        bossResistance: "boss-resistance.png",

        spireDominance: "spire-dominance.png",
        spireGuard: "spire-guard.png",

        riftDominance: "rift-dominance.png",
        riftGuard: "rift-guard.png",

        trialPower: "trial-power.png",
        dungeonGuard: "dungeon-guard.png",

        dragonsCurse: "dragon's-curse.png",
    };

    const file = files[passive.id];

    return file
        ? `/passive-images/${file}`
        : null;
}
