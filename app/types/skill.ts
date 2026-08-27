export type SkillElement =
    | "Common"
    | "Fire"
    | "Water"
    | "Grass"
    | "Ground"
    | "Ice";

export type SkillDamageInstance = {
    multiplier: number;
    hits: number;
};

export type SkillEffectTarget = "Self" | "Team" | "Enemy";

export type SkillStatusEffect = {
    type:
        | "damageIncrease"
        | "poison"
        | "burn"
        | "damageDecrease"
        | "knockback"
        | "damageReduction"
        | "damageReflection"
        | "stun";
    target: SkillEffectTarget;
    amountPercent?: number;
    durationSeconds?: number;
    stacks?: number;
    condition?: string;
};

export type Skill = {
    id: string;
    name: string;
    element: SkillElement;

    damageInstances: SkillDamageInstance[];
    cooldown: number | null;
    statusEffects?: SkillStatusEffect[];

    /**
     * Notes for missing values, unusual behavior, buffs, healing,
     * shields, taunts, or other special mechanics.
     */
    notes?: string;
    validationStatus?: string;
};
