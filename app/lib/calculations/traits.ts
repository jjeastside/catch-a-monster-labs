import { getTrait } from "../../data/traits";
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
