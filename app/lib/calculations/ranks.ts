import type { Rank } from "../../types/build";
export const rankMultipliers: Record<Rank, number> = { E: 1, D: 1.3, C: 1.69, B: 2.2, A: 2.86, S: 3.71, SS: 5.2 };
export function getRankMultiplier(rank: Rank): number { return rankMultipliers[rank]; }
