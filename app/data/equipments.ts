import type { Equipment } from "../types/equipment";
import { GENERATED_EQUIPMENT } from "./generated/equipments";
export const EQUIPMENT = GENERATED_EQUIPMENT;

export const WEAPONS = EQUIPMENT.filter((item) => item.type === "weapon");
export const ARMORS = EQUIPMENT.filter((item) => item.type === "armor");

export function getEquipment(id: string | null): Equipment | null {
    return id ? EQUIPMENT.find((item) => item.id === id) ?? null : null;
}