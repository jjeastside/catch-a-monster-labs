import type {
    MonsterPassive,
    PassiveEffectStat,
} from "../../types/build";

export type PassiveEffectTotals = {
    damage: number;
    incomingDamage: number;
    critChance: number;
    critDamage: number;
    bossDamage: number;
    bossIncomingDamage: number;
    spireDamage: number;
    spireIncomingDamage: number;
    riftDamage: number;
    riftIncomingDamage: number;
    dungeonDamage: number;
    dungeonIncomingDamage: number;
    coinGain: number;
    xpGain: number;
    rankLuck: number;
    healthRestore: number;
    stunImmunity: boolean;
};

export const DEFAULT_PASSIVE_EFFECT_TOTALS: PassiveEffectTotals = {
    damage: 0,
    incomingDamage: 0,
    critChance: 0,
    critDamage: 0,
    bossDamage: 0,
    bossIncomingDamage: 0,
    spireDamage: 0,
    spireIncomingDamage: 0,
    riftDamage: 0,
    riftIncomingDamage: 0,
    dungeonDamage: 0,
    dungeonIncomingDamage: 0,
    coinGain: 0,
    xpGain: 0,
    rankLuck: 0,
    healthRestore: 0,
    stunImmunity: false,
};

export function getPassiveEffectTotals(
    passives: MonsterPassive[] = [],
): PassiveEffectTotals {
    const totals: PassiveEffectTotals = {
        ...DEFAULT_PASSIVE_EFFECT_TOTALS,
    };

    for (const passive of passives) {
        for (const effect of passive.effects) {
            applyPassiveEffect(totals, effect.stat, effect.value);
        }
    }

    return totals;
}

function applyPassiveEffect(
    totals: PassiveEffectTotals,
    stat: PassiveEffectStat,
    value: number | boolean,
): void {
    if (stat === "stunImmunity") {
        if (typeof value === "boolean") {
            totals.stunImmunity ||= value;
        }

        return;
    }

    if (typeof value !== "number") {
        return;
    }

    totals[stat] += value;
}