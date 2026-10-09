export type TraitEffectType =
    | "postCastShield"
    | "damage"
    | "damageReduction"
    | "cooldownReduction"
    | "dodgeChance"
    | "burnDuration"
    | "revive"
    | "mountSpeed"
    | "healingEffectiveness"
    | "attackReductionEffectiveness"
    | "vulnerabilityEffectiveness";

export type TraitEffect = {
    type: TraitEffectType;
    percentage: number;
    description: string;
    condition?: "targetStatused";
};

export type Trait = {
    id: string;
    name: string;
    rarity: "rare" | "epic" | "legendary" | "mythical";
    image: string;
    symbolImage?: string;
    effects: TraitEffect[];
    naturalSource?: string;
    /** Canonical source monster IDs imported from traits.csv. */
    exclusiveSourceIds?: string[];
};