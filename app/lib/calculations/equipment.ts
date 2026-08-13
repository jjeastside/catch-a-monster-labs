import { getEquipment } from "../../data/equipments";

export function getWeaponDamageMultiplier(weaponId: string | null): number {
    const weapon = getEquipment(weaponId);
    return weapon?.type === "weapon" ? 1 + weapon.percentage / 100 : 1;
}

export function getArmorHealthMultiplier(armorId: string | null): number {
    const armor = getEquipment(armorId);
    return armor?.type === "armor" ? 1 + armor.percentage / 100 : 1;
}