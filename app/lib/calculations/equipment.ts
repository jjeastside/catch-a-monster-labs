import { getEquipment } from "../../data/equipments";

export function getPawDamageMultiplier(pawId: string | null): number {
    const paw = getEquipment(pawId);
    return paw?.type === "paw" ? 1 + paw.percentage / 100 : 1;
}

export function getRingHealthMultiplier(ringId: string | null): number {
    const ring = getEquipment(ringId);
    return ring?.type === "ring" ? 1 + ring.percentage / 100 : 1;
}