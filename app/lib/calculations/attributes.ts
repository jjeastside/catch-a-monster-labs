import { getAttribute } from "../../data/attributes";
import { getEquipment } from "../../data/equipments";
import type { Build } from "../../types/build";
import type { SkillElement } from "../../types/skill";

export function getAttributeSlotCount(rarity: string | undefined): number {
    if (rarity === "Legendary") return 1;
    if (rarity === "Mythical" || rarity === "Secret") return 2;
    return 0;
}

export function getFixedAttributeIds(equipmentId: string | null): string[] {
    const equipment = getEquipment(equipmentId);
    return equipment?.rarity === "Secret"
        ? equipment.attributes.filter((id) => id !== "random")
        : [];
}

export function hpConditionMatches(condition: string | null, hpPercent: number): boolean {
    if (!condition) return true;
    const threshold = Number(condition.slice(1));
    if (condition.startsWith(">")) return hpPercent > threshold;
    if (condition.startsWith("<")) return hpPercent < threshold;
    return false;
}

export function getActiveAttributeIds(build: Build): string[] {
    return [
        ...getFixedAttributeIds(build.weaponId),
        ...build.weaponAttributeIds,
        ...getFixedAttributeIds(build.armorId),
        ...build.armorAttributeIds,
    ];
}

export function calculateSkillAttributeEffects(
    build: Build,
    skillElement: SkillElement,
) {
    const element = skillElement.toLowerCase();
    const active = getActiveAttributeIds(build)
        .map(getAttribute)
        .filter((attribute): attribute is NonNullable<typeof attribute> => Boolean(attribute));
    const applicable = active.filter((attribute) =>
        (!attribute.skillElement || attribute.skillElement === element) &&
        hpConditionMatches(attribute.hpCondition, build.currentHpPercent),
    );
    const total = (effectType: string) => applicable
        .filter((attribute) => attribute.effectType === effectType)
        .reduce((sum, attribute) => sum + attribute.value, 0);

    return {
        active,
        applicable,
        skillDamageBonus: total("skill_damage"),
        skillDamageMultiplier: 1 + total("skill_damage") / 100,
        skillResistance: total("skill_resistance"),
        shieldDamage: total("shield_damage"),
        healEffectiveness: total("heal_effectiveness"),
        shieldEffectiveness: total("shield_effectiveness"),
        lifeSteal: total("life_steal"),
        cooldownSkipChance: total("cooldown_skip"),
        damageRedirect: total("damage_redirect"),
        damageImmunitySeconds: total("damage_immunity"),
    };
}