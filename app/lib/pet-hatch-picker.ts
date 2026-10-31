import type { GeneratedMonster } from "../types/monster";
import { transferPower } from "./breeding-transfer";

export type HatchMonsterSort = "name" | "power-asc" | "power-desc";

export function formatTransferPower(power: number | null): string {
    if (power === null || !Number.isFinite(power)) return "Unknown";
    return power.toLocaleString("en-US", {
        maximumSignificantDigits: 5,
        notation: power < 0.01 || power >= 1e7 ? "scientific" : "standard",
    });
}

export function sortHatchMonsters(monsters: readonly GeneratedMonster[], sort: HatchMonsterSort) {
    // Sort unrounded values; cache them for this comparison pass.
    const powers = new Map(monsters.map(monster => [monster.id, transferPower(monster)]));
    return [...monsters].sort((a, b) => {
        const nameOrder = a.name.localeCompare(b.name);
        if (sort === "name") return nameOrder;
        const aPower = powers.get(a.id) ?? null;
        const bPower = powers.get(b.id) ?? null;
        if (aPower === null) return bPower === null ? nameOrder : 1;
        if (bPower === null) return -1;
        return (sort === "power-asc" ? aPower - bPower : bPower - aPower) || nameOrder;
    });
}
