import type { GearAttribute } from "../types/attribute";
import { GENERATED_ATTRIBUTES } from "./generated/attributes";
export const ATTRIBUTES = GENERATED_ATTRIBUTES;

export function getAttribute(id: string): GearAttribute | null { return ATTRIBUTES.find((attribute) => attribute.id === id) ?? null; }
export function getAttributesForGear(type: "weapon" | "armor"): GearAttribute[] { return ATTRIBUTES.filter((attribute) => attribute.gearType === type && attribute.rarity !== "Secret"); }