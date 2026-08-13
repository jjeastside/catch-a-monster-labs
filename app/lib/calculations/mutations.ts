import type { Mutation } from "../../types/build";

export const BASE_CRIT_CHANCE = 0;
export const BASE_CRIT_MULTIPLIER = 2;

export type MutationEffects = {
    healthMultiplier: number;
    damageMultiplier: number;
    critChanceBonus: number;
    critMultiplier: number | null;
};

export const MUTATION_EFFECTS: Record<
    Mutation,
    MutationEffects
> = {
    shiny: {
        healthMultiplier: 1,
        damageMultiplier: 1.1,
        critChanceBonus: 30,
        critMultiplier: 2,
    },

    "shiny-x": {
        healthMultiplier: 1,
        damageMultiplier: 1.25,
        critChanceBonus: 35,
        critMultiplier: 2,
    },

    bloodlit: {
        healthMultiplier: 1,
        damageMultiplier: 1,
        critChanceBonus: 10,
        critMultiplier: 3,
    },

    "bloodlit-x": {
        healthMultiplier: 1,
        damageMultiplier: 1,
        critChanceBonus: 15,
        critMultiplier: 3.45,
    },

    huge: {
        healthMultiplier: 1.4,
        damageMultiplier: 1.4,
        critChanceBonus: 0,
        critMultiplier: 2,
    },

    "huge-x": {
        healthMultiplier: 1.6,
        damageMultiplier: 1.6,
        critChanceBonus: 0,
        critMultiplier: 2,
    },

    fairy: {
        healthMultiplier: 1,
        damageMultiplier: 1,
        critChanceBonus: 0,
        critMultiplier: null,
    },

    "fairy-x": {
        healthMultiplier: 1,
        damageMultiplier: 1,
        critChanceBonus: 0,
        critMultiplier: null,
    },
};

export function getMutationCooldownMultiplier(mutations: Mutation[]): number {
    if (mutations.includes("fairy-x")) return 0.75;
    if (mutations.includes("fairy")) return 0.8;
    return 1;
}

export function getMutationIncomingDamageReduction(mutations: Mutation[]): number {
    if (mutations.includes("fairy-x")) return 35;
    if (mutations.includes("fairy")) return 25;
    return 0;
}

export type CalculatedMutationEffects = {
    healthMultiplier: number;
    damageMultiplier: number;
    critChance: number;
    critMultiplier: number;
};

export function calculateMutationEffects(
    mutations: Mutation[],
    baseCritChance = BASE_CRIT_CHANCE,
): CalculatedMutationEffects {
    let healthBonus = 0;
    let damageBonus = 0;

    let critChance = baseCritChance;
    let critMultiplier = BASE_CRIT_MULTIPLIER;

    for (const mutation of mutations) {
        const effects = MUTATION_EFFECTS[mutation];

        healthBonus +=
            effects.healthMultiplier - 1;

        damageBonus +=
            effects.damageMultiplier - 1;

        critChance +=
            effects.critChanceBonus;

        if (effects.critMultiplier !== null) {
            critMultiplier = Math.max(
                critMultiplier,
                effects.critMultiplier,
            );
        }
    }

    return {
        healthMultiplier:
            1 + healthBonus,

        damageMultiplier:
            1 + damageBonus,

        critChance,

        critMultiplier,
    };
}