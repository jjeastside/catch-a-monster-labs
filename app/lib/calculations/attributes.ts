import { getAttribute } from "../../data/attributes";
import { getEquipment } from "../../data/equipments";
import type { Build } from "../../types/build";
import type { SkillElement } from "../../types/skill";

type AttributeBuild = Pick<
    Build,
    | "weaponId"
    | "armorId"
    | "weaponAttributeIds"
    | "armorAttributeIds"
    | "currentHpPercent"
>;

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

export function getActiveAttributeIds(build: AttributeBuild): string[] {
    return [
        ...getFixedAttributeIds(build.weaponId),
        ...build.weaponAttributeIds,
        ...getFixedAttributeIds(build.armorId),
        ...build.armorAttributeIds,
    ];
}

export function calculateSkillAttributeEffects(
    build: AttributeBuild,
    skillElement: SkillElement,
) {
    // The game calls this element Ground, while its gear attributes and image
    // asset IDs use Earth. Normalize both labels before comparing them.
    const normalizeElement = (value: string) => {
        const normalized = value.trim().toLowerCase();
        return normalized === "earth" ? "ground" : normalized;
    };
    const element = normalizeElement(skillElement);
    const active = getActiveAttributeIds(build)
        .map(getAttribute)
        .filter((attribute): attribute is NonNullable<typeof attribute> => Boolean(attribute));
    const applicable = active.filter((attribute) =>
        (!attribute.skillElement || normalizeElement(attribute.skillElement) === element) &&
        hpConditionMatches(attribute.hpCondition, build.currentHpPercent),
    );
    const total = (effectType: string) => applicable
        .filter((attribute) => attribute.effectType === effectType)
        .reduce((sum, attribute) => sum + attribute.value, 0);

    const skillDamageAttributes = applicable.filter(
        (attribute) => attribute.effectType === "skill_damage",
    );
    const skillDamageMultiplier = skillDamageAttributes.reduce(
        (multiplier, attribute) => multiplier * (1 + attribute.value / 100),
        1,
    );

    return {
        active,
        applicable,
        // Skill-damage attributes stack multiplicatively in-game. For example,
        // Water Damage III (+18%) and All Damage II (+15%) combine to
        // 1.18 * 1.15 = 1.357x, not 1 + (18 + 15)% = 1.33x.
        skillDamageBonus: (skillDamageMultiplier - 1) * 100,
        skillDamageMultiplier,
        skillResistance: total("skill_resistance"),
        shieldDamage: total("shield_damage"),
        healEffectiveness: total("heal_effectiveness"),
        shieldEffectiveness: total("shield_effectiveness"),
        lifeSteal: total("life_steal"),
        cooldownSkipChance: total("cooldown_skip"),
        damageRedirect: total("damage_redirect"),
        damageImmunitySeconds: total("damage_immunity"),
        maxHpRegenPerSecond: total("max_hp_regen"),
    };
}