const ENHANCEMENT_MULTIPLIERS = {
    0: 1,
    1: 1.05,
    2: 1.1,
    3: 1.15,
    4: 1.2,
    5: 1.26,
    6: 1.33,
    7: 1.41,
    8: 1.5,
    9: 1.62,
    10: 1.8,
} as const;

export type EnhancementLevel =
    keyof typeof ENHANCEMENT_MULTIPLIERS;

export function getEnhancementMultiplier(
    enhancement: number,
): number {
    if (
        !Number.isInteger(enhancement) ||
        enhancement < 0 ||
        enhancement > 10
    ) {
        throw new RangeError(
            "Enhancement must be an integer from 0 through 10.",
        );
    }

    return ENHANCEMENT_MULTIPLIERS[
        enhancement as EnhancementLevel
        ];
}