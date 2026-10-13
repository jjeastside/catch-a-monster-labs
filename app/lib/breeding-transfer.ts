import type { GeneratedMonster } from "../types/monster";
import { hasFixedBreeding } from "./breeding-limits";

/** Empirical trait-transfer model from controlled in-game tests (October 2026).
 * Ratio is target power / source power.
 * Dumplorer's additional factor is an experimental lineage-specific fit.
 */
export const BREEDING_MODEL = {
    genesisCap: 25,
    superCap: 50,
    ratioLogBase: 1.45,
    decay: 0.7,
    evolutionMultiplier: 2.1984,
    dumplorerExtraMultiplier: 1.25,
} as const;

export function transferPower(monster: GeneratedMonster): number | null {
    const { baseDamageELevel1: damage, baseHealthELevel1: health,
        pvpBaseDamageELevel1: pvpDamage, pvpBaseHealthELevel1: pvpHealth } = monster;
    if (![damage, health, pvpDamage, pvpHealth].every((value) => typeof value === "number" && Number.isFinite(value) && value > 0)) return null;
    const normalizedPower = Math.sqrt((damage / pvpDamage!) * (health / pvpHealth!));
    const evolution = monster.isEvolved ? BREEDING_MODEL.evolutionMultiplier : 1;
    return normalizedPower * evolution * (monster.id === "dumplorer" ? BREEDING_MODEL.dumplorerExtraMultiplier : 1);
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
    const logRatio = Math.log(ratio) / Math.log(BREEDING_MODEL.ratioLogBase);
    const genesisChance = Math.min(
        BREEDING_MODEL.genesisCap,
        BREEDING_MODEL.genesisCap * Math.exp(-BREEDING_MODEL.decay * (logRatio - 1)),
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
