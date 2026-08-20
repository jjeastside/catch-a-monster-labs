import type { Monster } from "../../types/monster";

import { getPassiveDamageMultipliers } from "./passive-effects";
import type { CombatContext, MonsterPassive, Passive, PassiveEffectStat } from "../../types/build";

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
    targetIsBoss?: boolean;
    currentHpPercent?: number;
    passives?: MonsterPassive[];
};

export function calculateCombatDamage({
                                          monster,
                                          baseDamage,
                                          critMultiplier,
                                          combatContext = "standard",
                                          targetIsBoss = false,
                                          currentHpPercent = 100,
                                          passives,
                                      }: CalculateCombatDamageInput): CombatDamageResult {
    const passiveDamage = getPassiveDamageMultipliers(passives ?? monster?.passives, {
        combatContext,
        targetIsBoss,
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