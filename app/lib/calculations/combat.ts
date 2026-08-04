import type { Monster } from "../../types/monster";

import {
    getPassiveEffectTotals,
} from "./passive-effects";

export type CombatDamageResult = {
    baseDamage: number;
    passiveDamageMultiplier: number;
    normalDamage: number;
    criticalDamage: number;
};

type CalculateCombatDamageInput = {
    monster: Monster | null;
    baseDamage: number;
    critMultiplier: number;
};

export function calculateCombatDamage({
                                          monster,
                                          baseDamage,
                                          critMultiplier,
                                      }: CalculateCombatDamageInput): CombatDamageResult {
    const passiveEffects =
        getPassiveEffectTotals(monster?.passives);

    const passiveDamageMultiplier =
        1 + passiveEffects.damage / 100;

    const normalDamage =
        baseDamage * passiveDamageMultiplier;

    const criticalDamage =
        normalDamage * critMultiplier;

    return {
        baseDamage,
        passiveDamageMultiplier,
        normalDamage,
        criticalDamage,
    };
}