import type { Monster } from "../../types/monster";

import { getPassiveDamageMultipliers } from "./passive-effects";
import type { CombatContext, Passive, PassiveEffectStat } from "../../types/build";

export type CombatDamageResult = {
    baseDamage: number;
    passiveDamageMultiplier: number;
    activePassiveEffects: Array<{ name: Passive; stat: PassiveEffectStat; multiplier: number }>;
    normalDamage: number;
    criticalDamage: number;
};

type CalculateCombatDamageInput = {
    monster: Monster | null;
    baseDamage: number;
    critMultiplier: number;
    combatContext?: CombatContext;
    currentHpPercent?: number;
};

export function calculateCombatDamage({
                                          monster,
                                          baseDamage,
                                          critMultiplier,
                                          combatContext = "standard",
                                          currentHpPercent = 100,
                                      }: CalculateCombatDamageInput): CombatDamageResult {
    const passiveDamage = getPassiveDamageMultipliers(monster?.passives, {
        combatContext,
        currentHpPercent,
    });
    const passiveDamageMultiplier = passiveDamage.total;

    const normalDamage =
        baseDamage * passiveDamageMultiplier;

    const criticalDamage =
        normalDamage * critMultiplier;

    return {
        baseDamage,
        passiveDamageMultiplier,
        activePassiveEffects: passiveDamage.active.map(({ passive, stat, multiplier }) => ({
            name: passive.id,
            stat,
            multiplier,
        })),
        normalDamage,
        criticalDamage,
    };
}