import type { GeneratedMonster } from "../types/monster";
import { hasFixedBreeding } from "./breeding-limits";
import { getAvailableTraits } from "../data/traits";

export const MUTATIONS = ["Shiny", "Bloodlit", "Fairy", "Huge"] as const;
export type Mutation = typeof MUTATIONS[number];
export type MutationState = "none" | "normal" | "x";
export type BreedRank = "S" | "SS";

export function getBreedingTraits(monsterId: string) {
    return getAvailableTraits().filter(trait => trait.id === "vital-barrier" || !trait.exclusiveSourceIds?.length || trait.exclusiveSourceIds.includes(monsterId));
}

/** Research fit, using unmodified level-1 E-rank base stats only. */
export function transferPower(monster: GeneratedMonster): number | null {
    const { baseDamageELevel1: d, baseHealthELevel1: h, pvpBaseDamageELevel1: pd, pvpBaseHealthELevel1: ph } = monster;
    if (![d, h, pd, ph].every(value => typeof value === "number" && Number.isFinite(value) && value > 0)) return null;
    let power = Math.sqrt((d / pd!) * (h / ph!));
    if (monster.isEvolved) power *= 2.2;
    if (monster.id === "dumplorer") power *= 1.25;
    return power;
}

export function traitTransfer(source: GeneratedMonster, target: GeneratedMonster, hasTrait: boolean) {
    if (hasFixedBreeding(source.id) || hasFixedBreeding(target.id) || !hasTrait) return { normal: 0, super: 0 };
    const a = transferPower(source), b = transferPower(target);
    if (a === null || b === null) return null;
    const ratio = b / a;
    const logBase145 = Math.log(ratio) / Math.log(1.45);
    const normal = Math.min(25, 25 * Math.exp(-0.7 * (logBase145 - 1)));
    return { normal, super: normal * 2 };
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
    const normal = Math.round(normalChance * 100) / 100;
    const doubledDisplay = Math.round(normal * 200) / 100;
    const superChance = Math.round(normalChance * 200) / 100;
    return { normal, super: Math.min(50, Math.max(doubledDisplay, superChance)) };
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
