import type { EquipmentRarity, EquipmentType } from "./equipment";
import type { SkillElement } from "./skill";

export type AttributeEffectType =
    | "skill_damage" | "skill_resistance" | "shield_damage"
    | "heal_effectiveness" | "shield_effectiveness" | "life_steal"
    | "cooldown_skip" | "damage_redirect" | "damage_immunity"
    | "max_hp_regen";

export type GearAttribute = {
    id: string;
    rarity: EquipmentRarity;
    name: string;
    gearType: EquipmentType;
    tier: number | null;
    effectType: AttributeEffectType;
    value: number;
    skillElement: Lowercase<SkillElement> | null;
    hpCondition: string | null;
};