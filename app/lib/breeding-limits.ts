/** These monsters cannot breed; both genetic bonuses are fixed at 6%, and traits are unavailable. */
const FIXED_BREEDING_MONSTERS = new Set([
    "dragon-cannelloni",
    "fire-dragon-cannelloni",
    "necro-dragon-cannelloni",
    "necro-hydra-tortelloni",
]);

export const BREEDING_LOCK_MESSAGE = "Cannot breed: Attack and Health Genetic Potential are locked at 6%.";

export function hasFixedBreeding(monsterId: string | null | undefined): boolean {
    return !!monsterId && FIXED_BREEDING_MONSTERS.has(monsterId);
}

export function applyBreedingLimits<T extends { healthGeneticPotential: number; damageGeneticPotential: number }>(build: T, monsterId: string | null | undefined): T {
    return hasFixedBreeding(monsterId)
        ? { ...build, healthGeneticPotential: 6, damageGeneticPotential: 6, traitId: null }
        : build;
}
