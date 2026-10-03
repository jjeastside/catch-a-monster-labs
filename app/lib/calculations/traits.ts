import { getTrait } from "../../data/traits";
import type { SkillStatusEffect } from "../../types/skill";
import type { TraitEffectType } from "../../types/trait";

export type TraitContext = {
    targetStatused?: boolean;
};

export function getTraitEffectValue(
    traitId: string | null,
    type: TraitEffectType,
    context: TraitContext = {},
): number {
    const trait = getTrait(traitId);
    if (!trait) return 0;

    return trait.effects
        .filter((effect) => effect.type === type)
        .filter((effect) => !effect.condition || (effect.condition === "targetStatused" && context.targetStatused))
        .reduce((total, effect) => total + effect.percentage, 0);
}

export function getTraitDamageMultiplier(traitId: string | null, context: TraitContext = {}): number {
    return 1 + getTraitEffectValue(traitId, "damage", context) / 100;
}

export function getTraitCooldownMultiplier(traitId: string | null): number {
    return 1 - getTraitEffectValue(traitId, "cooldownReduction") / 100;
}

// Each cast grants a shield lasting six seconds, with at most one stack.
export function getTraitPostCastShield(traitId: string | null, maxHealth: number): number {
    return maxHealth * getTraitEffectValue(traitId, "postCastShield") / 100;
}

export function getTraitPostCastShieldEffect(traitId: string | null): SkillStatusEffect | null {
    const amountPercent = getTraitEffectValue(traitId, "postCastShield");
    return amountPercent > 0 ? {
        type: "shield",
        target: "Self",
        amountPercent,
        scaling: "MaxHealth",
        durationSeconds: 6,
        stacks: 1,
        maxStacks: 1,
        condition: "Vital Barrier · After casting a skill · Does not stack",
    } : null;
}
