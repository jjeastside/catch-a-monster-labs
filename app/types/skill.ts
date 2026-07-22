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

export type Skill = {
    id: string;
    name: string;
    element: SkillElement;

    damageInstances: SkillDamageInstance[];
    cooldown: number | null;

    /**
     * Notes for missing values, unusual behavior, buffs, healing,
     * shields, taunts, or other special mechanics.
     */
    notes?: string;
};