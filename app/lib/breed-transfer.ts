import type { GeneratedMonster } from "../types/monster";
import { hasFixedBreeding } from "./breeding-limits";
import { getAvailableTraits } from "../data/traits";
import {
    calculateSkillTransfer,
    displayedTransferRates,
    transferPower as researchTransferPower,
} from "./breeding-transfer";

export const MUTATIONS = ["Shiny", "Bloodlit", "Fairy", "Huge"] as const;
export type Mutation = typeof MUTATIONS[number];
export type MutationState = "none" | "normal" | "x";
export type BreedRank = "S" | "SS";

export function getBreedingTraits(monsterId: string) {
    return getAvailableTraits().filter(trait => trait.id === "vital-barrier" || !trait.exclusiveSourceIds?.length || trait.exclusiveSourceIds.includes(monsterId));
}

/** Relative Transfer Power: effective breeding factor raised to 0.7 / ln(1.45). */
export const transferPower = researchTransferPower;

export function traitTransfer(source: GeneratedMonster, target: GeneratedMonster, hasTrait: boolean) {
    if (hasFixedBreeding(source.id) || hasFixedBreeding(target.id) || !hasTrait) return { normal: 0, super: 0 };
    const result = calculateSkillTransfer(source, target);
    if (result === null) return null;
    return { normal: result.genesisChance, super: result.superChance };
}

export function mutationTransfer(a: MutationState, b: MutationState, superBreed: boolean) {
    const mutatedParents = Number(a !== "none") + Number(b !== "none");
    const xParents = Number(a === "x") + Number(b === "x");
    return {
        normal: mutatedParents === 0 ? 0 : superBreed ? mutatedParents === 2 ? 70 : 35 : 30,
        x: superBreed ? xParents * 10 : 0,
    };
}

export function displayedTraitRates(normalChance: number) {
    return displayedTransferRates(normalChance);
}

export function averageBreeds(chancePercent: number): number | null {
    return Number.isFinite(chancePercent) && chancePercent > 0 ? 100 / chancePercent : null;
}

export function rankTransfer(a: BreedRank, b: BreedRank, superBreed = false): Array<{ rank: "A" | BreedRank; chance: number }> {
    if (superBreed) {
        if (a === "SS" && b === "SS") return [{ rank: "SS", chance: 50 }, { rank: "S", chance: 50 }];
        if (a === "SS" || b === "SS") return [{ rank: "SS", chance: 30 }, { rank: "S", chance: 70 }];
        return [{ rank: "S", chance: 55.55 }, { rank: "A", chance: 44.44 }];
    }
    if (a === "SS" && b === "SS") return [{ rank: "SS", chance: 60 }, { rank: "S", chance: 40 }];
    if (a === "SS" || b === "SS") return [{ rank: "SS", chance: 20 }, { rank: "S", chance: 50 }, { rank: "A", chance: 30 }];
    return [{ rank: "S", chance: 40 }, { rank: "A", chance: 60 }];
}
