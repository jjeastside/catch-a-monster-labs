import type { GearAttribute } from "../types/attribute";

export const ATTRIBUTES: GearAttribute[] = [
    ...["earth", "ice", "grass", "water", "fire"].flatMap((element) => [
        { id: `${element === "grass" ? "nature" : element}-damage-1`, rarity: "Rare", name: `${element === "grass" ? "Nature" : title(element)} Damage I`, gearType: "weapon", tier: 1, effectType: "skill_damage", value: 5, skillElement: element, hpCondition: null },
        { id: `${element === "grass" ? "nature" : element}-damage-2`, rarity: "Epic", name: `${element === "grass" ? "Nature" : title(element)} Damage II`, gearType: "weapon", tier: 2, effectType: "skill_damage", value: 12, skillElement: element, hpCondition: null },
        { id: `${element === "grass" ? "nature" : element}-damage-3`, rarity: "Legendary", name: `${element === "grass" ? "Nature" : title(element)} Damage III`, gearType: "weapon", tier: 3, effectType: "skill_damage", value: 18, skillElement: element, hpCondition: null },
        { id: `${element === "grass" ? "nature" : element}-resistance-1`, rarity: "Rare", name: `${element === "grass" ? "Nature" : title(element)} Resistance I`, gearType: "armor", tier: 1, effectType: "skill_resistance", value: 5, skillElement: element, hpCondition: null },
        { id: `${element === "grass" ? "nature" : element}-resistance-2`, rarity: "Epic", name: `${element === "grass" ? "Nature" : title(element)} Resistance II`, gearType: "armor", tier: 2, effectType: "skill_resistance", value: 11, skillElement: element, hpCondition: null },
        { id: `${element === "grass" ? "nature" : element}-resistance-3`, rarity: "Legendary", name: `${element === "grass" ? "Nature" : title(element)} Resistance III`, gearType: "armor", tier: 3, effectType: "skill_resistance", value: 15, skillElement: element, hpCondition: null },
    ] as GearAttribute[]),
    { id: "all-damage-1", rarity: "Epic", name: "All Damage I", gearType: "weapon", tier: 1, effectType: "skill_damage", value: 10, skillElement: null, hpCondition: null },
    { id: "all-damage-2", rarity: "Legendary", name: "All Damage II", gearType: "weapon", tier: 2, effectType: "skill_damage", value: 15, skillElement: null, hpCondition: null },
    { id: "all-resistances-1", rarity: "Epic", name: "All Resistances I", gearType: "armor", tier: 1, effectType: "skill_resistance", value: 9, skillElement: null, hpCondition: null },
    { id: "all-resistances-2", rarity: "Legendary", name: "All Resistances II", gearType: "armor", tier: 2, effectType: "skill_resistance", value: 13, skillElement: null, hpCondition: null },
    { id: "shield-breaker-1", rarity: "Epic", name: "Shield Breaker 1", gearType: "weapon", tier: 1, effectType: "shield_damage", value: 12, skillElement: null, hpCondition: null },
    { id: "first-aid-kit-1", rarity: "Epic", name: "First Aid Kit I", gearType: "armor", tier: 1, effectType: "heal_effectiveness", value: 12, skillElement: null, hpCondition: null },
    { id: "reinforced-shield-1", rarity: "Epic", name: "Reinforced Shield 1", gearType: "armor", tier: 1, effectType: "shield_effectiveness", value: 12, skillElement: null, hpCondition: null },
    { id: "last-stand-stance", rarity: "Legendary", name: "Last Stand Stance", gearType: "weapon", tier: null, effectType: "skill_damage", value: 45, skillElement: null, hpCondition: "<20" },
    { id: "dominance", rarity: "Legendary", name: "Dominance", gearType: "weapon", tier: null, effectType: "skill_damage", value: 30, skillElement: null, hpCondition: ">75" },
    { id: "unyielding", rarity: "Legendary", name: "Unyielding", gearType: "armor", tier: null, effectType: "skill_resistance", value: 32, skillElement: null, hpCondition: "<25" },
    { id: "thick-hide", rarity: "Legendary", name: "Thick Hide", gearType: "armor", tier: null, effectType: "skill_resistance", value: 23, skillElement: null, hpCondition: ">75" },
    { id: "life-siphon", rarity: "Secret", name: "Life Siphon", gearType: "weapon", tier: null, effectType: "life_steal", value: 10, skillElement: null, hpCondition: null },
    { id: "dual-cast", rarity: "Secret", name: "Dual Cast", gearType: "weapon", tier: null, effectType: "cooldown_skip", value: 15, skillElement: null, hpCondition: null },
    { id: "damage-redirect", rarity: "Secret", name: "Damage Redirect", gearType: "armor", tier: null, effectType: "damage_redirect", value: 15, skillElement: null, hpCondition: null },
    { id: "moment-of-serenity", rarity: "Secret", name: "Moment of Serenity", gearType: "armor", tier: null, effectType: "damage_immunity", value: 2, skillElement: null, hpCondition: null },
    { id: "healing-pulse", rarity: "Secret", name: "Healing Pulse", gearType: "armor", tier: null, effectType: "max_hp_regen", value: 1.5, skillElement: null, hpCondition: null },
];

function title(value: string): string { return value[0].toUpperCase() + value.slice(1); }
export function getAttribute(id: string): GearAttribute | null { return ATTRIBUTES.find((attribute) => attribute.id === id) ?? null; }
export function getAttributesForGear(type: "weapon" | "armor"): GearAttribute[] { return ATTRIBUTES.filter((attribute) => attribute.gearType === type && attribute.rarity !== "Secret"); }