/**
 * Empirical Standard growth precision model (PvE and PvP).
 *
 * Observed Standard monsters are consistent with a full level multiplier
 * truncated in increments of 0.0002. The level-dependent stat coefficient
 * is separately truncated down to increments of 0.05 of its PvE Lv1 base.
 * These are experimentally inferred rules, not confirmed game source code.
 */
export function standardGrowth(level: number): number {
    const exponential =
        level <= 65
            ? 1.1 ** level
            : 1.1 ** 65 * 1.06 ** (level - 65);
    const unquantized = 0.7 + 0.1 * level + (2 / 11) * exponential;
    // Avoid floating-point noise just below exact 0.0002 boundaries.
    return Math.floor(unquantized * 5000 + 1e-9) / 5000;
}

/** The PvE Lv1 coefficient controls level gains in both PvE and PvP. */
export function standardStatGrowth(level: number, pveLevel1Base: number): number {
    if (!Number.isFinite(pveLevel1Base) || pveLevel1Base <= 0) {
        throw new RangeError("Standard stat growth requires a positive PvE Level 1 base");
    }
    const coefficient = Math.floor(pveLevel1Base * 20 + 1e-9) / 20;
    return 1 + (standardGrowth(level) - 1) * (coefficient / pveLevel1Base);
}

/**
 * Dragon Cannelloni's fitted PvE level curve (2026-10-08, levels 1–115).
 *
 * The displayed PvE stats were approximately:
 *   damage = 157.304 + 56.039 * F(level)
 *   health = 1966.3 + 599.723 * F(level)
 * where F(level) = (level - 1) + 2 * (G(level) - 1),
 * and G grows by 10% through level 65, then 6% per level afterward.
 *
 * Divide each fitted growth coefficient by its fitted level-1 stat to
 * get a base-stat-relative multiplier. This leaves rank, enhancement,
 * account, genetic and the reported 1.06x breed-stat bug to the existing
 * multiplier pipeline rather than baking any of them into growth.
 * These are empirical coefficients, not confirmed game source constants.
 */
export function dragonCannelloniGrowth(level: number): {
    health: number;
    damage: number;
} {
    const exponential =
        1.1 ** Math.min(level - 1, 64) *
        1.06 ** Math.max(level - 65, 0);
    const levelScale = (level - 1) + 2 * (exponential - 1);

    return {
        health: 1 + (599.723 / 1966.3) * levelScale,
        damage: 1 + (56.039 / 157.304) * levelScale,
    };
}

export function dummeeHealthAtLevel(
    level: number,
    baseHealthELevel1: number,
): number {
    // After level 65, only the exponential term switches to 6% growth.
    const exponential =
        level <= 65
            ? 1.1 ** level
            : 1.1 ** 65 * 1.06 ** (level - 65);

    return (
        (baseHealthELevel1 - 15) +
        5 * level +
        (100 / 11) * exponential
    );
}

export function dummeeDamageAtLevel(
    health: number,
    baseHealthELevel1: number,
    baseDamageELevel1: number,
): number {
    return (
        baseDamageELevel1 +
        (9 / 50) * (health - baseHealthELevel1)
    );
}