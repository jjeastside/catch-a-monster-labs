import type { GeneratedMonster } from "../types/monster";
import { hasFixedBreeding } from "./breeding-limits";

/** Empirical trait-transfer model from controlled in-game tests (October 2026).
 * P is the effective breeding factor; Transfer Power = P^(decay / ln(ratioLogBase)).
 * Dumplorer and Gravitas have additional empirically fitted modifiers.
 */
export const BREEDING_MODEL = {
    genesisCap: 25,
    superCap: 50,
    ratioLogBase: 1.45,
    decay: 0.7,
    evolutionMultiplier: 2.1984,
    gravitasEvolutionMultiplier: 2.2,
    dumplorerExtraMultiplier: 1.25,
    gravitasExtraMultiplier: 1.25,
} as const;

export function effectiveBreedingFactor(monster: GeneratedMonster): number | null {
    const { baseDamageELevel1: damage, baseHealthELevel1: health,
        pvpBaseDamageELevel1: pvpDamage, pvpBaseHealthELevel1: pvpHealth } = monster;
    if (![damage, health, pvpDamage, pvpHealth].every((value) => typeof value === "number" && Number.isFinite(value) && value > 0)) return null;
    const normalizedPower = Math.sqrt((damage / pvpDamage!) * (health / pvpHealth!));
    const evolution = monster.isEvolved
        ? monster.id === "gravitas" ? BREEDING_MODEL.gravitasEvolutionMultiplier : BREEDING_MODEL.evolutionMultiplier
        : 1;
    const special = monster.id === "dumplorer" ? BREEDING_MODEL.dumplorerExtraMultiplier
        : monster.id === "gravitas" ? BREEDING_MODEL.gravitasExtraMultiplier : 1;
    return normalizedPower * evolution * special;
}

/** A relative comparison score, not a percentage. Never round before calculating odds. */
export function transferPower(monster: GeneratedMonster): number | null {
    const factor = effectiveBreedingFactor(monster);
    return factor === null ? null : Math.pow(factor, BREEDING_MODEL.decay / Math.log(BREEDING_MODEL.ratioLogBase));
}

export type TransferResult = {
    sourcePower: number;
    targetPower: number;
    ratio: number;
    genesisChance: number;
    superChance: number;
};

export function calculateSkillTransfer(source: GeneratedMonster, target: GeneratedMonster): TransferResult | null {
    if (hasFixedBreeding(source.id) || hasFixedBreeding(target.id)) return null;
    const sourcePower = transferPower(source);
    const targetPower = transferPower(target);
    if (sourcePower === null || targetPower === null) return null;
    const ratio = targetPower / sourcePower;
    const genesisChance = Math.min(
        BREEDING_MODEL.genesisCap,
        BREEDING_MODEL.genesisCap * Math.exp(BREEDING_MODEL.decay) * sourcePower / targetPower,
    );
    return {
        sourcePower,
        targetPower,
        ratio,
        genesisChance,
        superChance: Math.min(BREEDING_MODEL.superCap, genesisChance * 2),
    };
}

/** Trait percentages observed in-game are displayed by truncating to two decimals. */
export function displayTransferChance(chancePercent: number): number {
    if (!Number.isFinite(chancePercent)) return 0;
    const clamped = Math.max(0, Math.min(BREEDING_MODEL.superCap, chancePercent));
    return Math.floor((clamped + 1e-10) * 100) / 100;
}

export function displayedTransferRates(genesisChance: number) {
    const genesis = Math.min(BREEDING_MODEL.genesisCap, Math.max(0, genesisChance));
    const superChance = Math.min(BREEDING_MODEL.superCap, genesis * 2);
    return {
        normal: displayTransferChance(genesis),
        super: displayTransferChance(superChance),
    };
}

/** Probability of at least one success in independent attempts. */
export function atLeastOneSuccess(chancePercent: number, attempts: number): number {
    return 100 * (1 - Math.pow(1 - chancePercent / 100, Math.max(0, Math.floor(attempts))));
}
