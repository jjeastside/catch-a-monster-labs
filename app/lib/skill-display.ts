import type { Skill, SkillStatusEffect } from "../types/skill";

export type DatabaseSkillEffect =
    | "burn"
    | "poison"
    | "healing"
    | "stun"
    | "vulnerability"
    | "knockback"
    | "damage-buff"
    | "damage-decrease"
    | "damage-reduction"
    | "damage-reflection"
    | "shield"
    | "taunt";

export const databaseSkillEffectDetails: Record<DatabaseSkillEffect, { label: string; icon: string }> = {
    burn: { label: "Burn", icon: "/icons/burn-effect.png" },
    poison: { label: "Poison", icon: "/icons/poison-effect.png" },
    healing: { label: "Healing", icon: "/account-icons/health.png" },
    stun: { label: "Stun", icon: "/icons/stun-effect.png" },
    vulnerability: { label: "Vulnerability", icon: "/icons/vulnerability.png" },
    knockback: { label: "Knockback", icon: "/icons/knockback.png" },
    "damage-buff": { label: "Damage Buff", icon: "/icons/damage-increase.png" },
    "damage-decrease": { label: "Damage Decrease", icon: "/icons/damage-decrease.png" },
    "damage-reduction": { label: "Damage Reduction", icon: "/icons/attribute-resistance.png" },
    "damage-reflection": { label: "Damage Reflection", icon: "/icons/damage-reflection.png" },
    shield: { label: "Shield", icon: "/icons/attribute-resistance.png" },
    taunt: { label: "Taunt", icon: "/icons/taunt.png" },
};

export const databaseSkillEffectOptions = Object.entries(databaseSkillEffectDetails) as Array<[
    DatabaseSkillEffect,
    { label: string; icon: string },
]>;

const effectTypeMap: Partial<Record<SkillStatusEffect["type"], DatabaseSkillEffect>> = {
    burn: "burn",
    poison: "poison",
    healing: "healing",
    stun: "stun",
    vulnerability: "vulnerability",
    knockback: "knockback",
    damageIncrease: "damage-buff",
    damageDecrease: "damage-decrease",
    damageReduction: "damage-reduction",
    damageReflection: "damage-reflection",
    shield: "shield",
    taunt: "taunt",
};

export function getDatabaseSkillEffects(skill?: Skill | null): DatabaseSkillEffect[] {
    if (!skill) return [];

    return [...new Set(
        (skill.statusEffects ?? [])
            .map((effect) => effectTypeMap[effect.type])
            .filter((effect): effect is DatabaseSkillEffect => Boolean(effect)),
    )];
}


export function getDatabaseSkillDescription(skill: Skill): string {
    return skill.description ?? `${skill.element} skill.`;
}
