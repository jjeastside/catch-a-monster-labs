import type { Build } from "../../types/build";

import { getEnhancementMultiplier } from "./enhancements";
import { getEvolutionMultiplier } from "./evolution";
import { getGeneticPotentialMultiplier } from "./genetic-potential";
import { getRankMultiplier } from "./ranks";
import { calculateMutationEffects } from "./mutations";

export type StatMultipliers = {
    rank: number;
    enhancement: number;

    healthGenetic: number;
    damageGenetic: number;
    evolution: number;

    mutationHealth: number;
    mutationDamage: number;

    critChance: number;
    critMultiplier: number;

    healthTotal: number;
    damageTotal: number;
};

type MultiplierBuild = Pick<
    Build,
    | "rank"
    | "enhancement"
    | "healthGeneticPotential"
    | "damageGeneticPotential"
    | "evolutionPercent"
    | "mutations"
>;

export function createStatMultipliers(
    build: MultiplierBuild,
): StatMultipliers | null {
    if (!build.rank) {
        return null;
    }

    const rank = getRankMultiplier(build.rank);
    const enhancement =
        getEnhancementMultiplier(build.enhancement);

    const healthGenetic =
        getGeneticPotentialMultiplier(
            build.healthGeneticPotential,
        );

    const damageGenetic =
        getGeneticPotentialMultiplier(
            build.damageGeneticPotential,
        );

    const evolution =
        getEvolutionMultiplier(
            build.evolutionPercent,
        );

    const mutationEffects =
        calculateMutationEffects(build.mutations);

    return {
        rank,
        enhancement,
        healthGenetic,
        damageGenetic,
        evolution,

        mutationHealth:
            mutationEffects.healthMultiplier,

        mutationDamage:
            mutationEffects.damageMultiplier,

        critChance:
            mutationEffects.critChance,

        critMultiplier:
            mutationEffects.critMultiplier,

        healthTotal:
            rank *
            enhancement *
            healthGenetic *
            evolution *
            mutationEffects.healthMultiplier,

        damageTotal:
            rank *
            enhancement *
            damageGenetic *
            evolution *
            mutationEffects.damageMultiplier,
    };
}