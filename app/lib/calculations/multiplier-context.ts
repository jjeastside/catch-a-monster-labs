import type { Build } from "../../types/build";

import { getEnhancementMultiplier } from "./enhancements";
import { getEvolutionMultiplier } from "./evolution";
import { getGeneticPotentialMultiplier } from "./genetic-potential";
import { getRankMultiplier } from "./ranks";
import { calculateMutationEffects } from "./mutations";
import { getArmorHealthMultiplier, getWeaponDamageMultiplier } from "./equipment";
import { getAccountMultiplier } from "./account-multipliers";

export type StatMultipliers = {
    build: MultiplierBuild;

    rank: number;
    enhancement: number;

    healthGenetic: number;
    damageGenetic: number;
    evolution: number;

    mutationHealth: number;
    mutationDamage: number;
    equipmentHealth: number;
    equipmentDamage: number;
    account: number;

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
    | "selectedSkillId"
    | "weaponId"
    | "armorId"
    | "accountMultipliers"
>;

export function createStatMultipliers(
    build: MultiplierBuild,
    baseCritChance = 0,
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
        calculateMutationEffects(build.mutations, baseCritChance);
    const equipmentHealth = getArmorHealthMultiplier(build.armorId);
    const equipmentDamage = getWeaponDamageMultiplier(build.weaponId);
    const account = getAccountMultiplier(build.accountMultipliers);

    return {
        build,

        rank,
        enhancement,
        healthGenetic,
        damageGenetic,
        evolution,

        mutationHealth:
        mutationEffects.healthMultiplier,

        mutationDamage:
        mutationEffects.damageMultiplier,

        equipmentHealth,
        equipmentDamage,
        account,

        critChance:
        mutationEffects.critChance,

        critMultiplier:
        mutationEffects.critMultiplier,

        healthTotal:
            rank *
            enhancement *
            healthGenetic *
            evolution *
            mutationEffects.healthMultiplier *
            equipmentHealth *
            account,

        damageTotal:
            rank *
            enhancement *
            damageGenetic *
            evolution *
            mutationEffects.damageMultiplier *
            equipmentDamage *
            account,
    };
}