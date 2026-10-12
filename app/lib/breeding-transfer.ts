import type { GeneratedMonster } from "../types/monster";
import { hasFixedBreeding } from "./breeding-limits";

/** Empirical skill-transfer model from controlled in-game tests (October 2026).
 * Ratio is target power / source power, where the target is the female parent.
 * Dumplorer's additional factor is an experimental fit, not a universal evolution rule.
 */
export const BREEDING_MODEL = {
    genesisCoefficient: 50.3438,
    genesisExponent: -1.88393,
    genesisCap: 25,
    superCap: 50,
    evolutionMultiplier: 2.2,
    dumplorerExtraMultiplier: 1.25,
} as const;

export function transferPower(monster: GeneratedMonster): number | null {
    const { baseDamageELevel1: damage, baseHealthELevel1: health,
        pvpBaseDamageELevel1: pvpDamage, pvpBaseHealthELevel1: pvpHealth } = monster;
    if (![damage, health, pvpDamage, pvpHealth].every((value) => typeof value === "number" && value > 0)) return null;
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
    const genesisChance = Math.min(BREEDING_MODEL.genesisCap,
        BREEDING_MODEL.genesisCoefficient * Math.pow(ratio, BREEDING_MODEL.genesisExponent));
    return { sourcePower, targetPower, ratio, genesisChance,
        superChance: Math.min(BREEDING_MODEL.superCap, genesisChance * 2) };
}

/** Probability of at least one success in independent attempts. */
export function atLeastOneSuccess(chancePercent: number, attempts: number): number {
    return 100 * (1 - Math.pow(1 - chancePercent / 100, Math.max(0, Math.floor(attempts))));
}
