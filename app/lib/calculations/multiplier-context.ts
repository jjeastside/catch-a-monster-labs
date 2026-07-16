import type { Build } from "../../types/build";

import { getEnhancementMultiplier } from "./enhancements";
import { getEvolutionMultiplier } from "./evolution";
import { getGeneticPotentialMultiplier } from "./genetic-potential";
import { getRankMultiplier } from "./ranks";

export type StatMultipliers = {
    rank: number;
    enhancement: number;

    healthGenetic: number;
    damageGenetic: number;
    evolution: number;

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

    return {
        rank,
        enhancement,
        healthGenetic,
        damageGenetic,
        evolution,

        healthTotal:
            rank *
            enhancement *
            healthGenetic *
            evolution,

        damageTotal:
            rank *
            enhancement *
            damageGenetic *
            evolution,
    };
}