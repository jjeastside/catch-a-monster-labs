import type {
    CombatContext,
    MonsterPassive,
    PassiveEffectStat,
} from "../../types/build";

export type PassiveCalculationContext = {
    combatContext?: CombatContext;
    currentHpPercent?: number;
};

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
    mutationRate: number;
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
    mutationRate: 0,
    stunImmunity: false,
};

export function getPassiveEffectTotals(
    passives: MonsterPassive[] = [],
    context: PassiveCalculationContext = {},
): PassiveEffectTotals {
    const totals: PassiveEffectTotals = {
        ...DEFAULT_PASSIVE_EFFECT_TOTALS,
    };

    for (const passive of passives) {
        if (!passiveConditionMatches(passive, context.currentHpPercent ?? 100)) {
            continue;
        }

        for (const effect of passive.effects) {
            if (!effectMatchesCombatContext(effect.stat, context.combatContext ?? "standard")) {
                continue;
            }
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

function passiveConditionMatches(passive: MonsterPassive, currentHpPercent: number): boolean {
    if (passive.id === "vitalSurge" && typeof passive.condition === "number") {
        return currentHpPercent > passive.condition;
    }

    return true;
}

function effectMatchesCombatContext(stat: PassiveEffectStat, context: CombatContext): boolean {
    const requiredContext: Partial<Record<PassiveEffectStat, CombatContext>> = {
        bossDamage: "boss",
        bossIncomingDamage: "boss",
        spireDamage: "spire",
        spireIncomingDamage: "spire",
        riftDamage: "rift",
        riftIncomingDamage: "rift",
        dungeonDamage: "dungeon",
        dungeonIncomingDamage: "dungeon",
    };

    return requiredContext[stat] === undefined || requiredContext[stat] === context;
}

export function getPassiveDamageMultipliers(
    passives: MonsterPassive[] = [],
    context: PassiveCalculationContext = {},
): { total: number; active: Array<{ passive: MonsterPassive; stat: PassiveEffectStat; multiplier: number }> } {
    const active: Array<{ passive: MonsterPassive; stat: PassiveEffectStat; multiplier: number }> = [];
    const damageStats = new Set<PassiveEffectStat>([
        "damage",
        "bossDamage",
        "spireDamage",
        "riftDamage",
        "dungeonDamage",
    ]);

    for (const passive of passives) {
        if (!passiveConditionMatches(passive, context.currentHpPercent ?? 100)) continue;

        for (const effect of passive.effects) {
            if (!damageStats.has(effect.stat) || typeof effect.value !== "number") continue;
            if (!effectMatchesCombatContext(effect.stat, context.combatContext ?? "standard")) continue;

            active.push({ passive, stat: effect.stat, multiplier: 1 + effect.value / 100 });
        }
    }

    return {
        total: active.reduce((total, effect) => total * effect.multiplier, 1),
        active,
    };
}