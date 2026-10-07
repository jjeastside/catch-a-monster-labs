export function standardGrowth(level: number): number {
    const exponential =
        level <= 65
            ? 1.1 ** level
            : 1.1 ** 65 * 1.06 ** (level - 65);

    return (
        0.7 +
        0.1 * level +
        (2 / 11) * exponential
    );
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