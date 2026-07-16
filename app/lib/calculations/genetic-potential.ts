export const GENETIC_POTENTIAL_VALUES = [
    0,
    6,
    12,
    18,
    24,
    30,
    36,
    42,
    48,
    54,
    60,
] as const;

export type GeneticPotential =
    (typeof GENETIC_POTENTIAL_VALUES)[number];

export function getGeneticPotentialMultiplier(
    geneticPotential: number,
): number {
    if (
        !GENETIC_POTENTIAL_VALUES.includes(
            geneticPotential as GeneticPotential,
        )
    ) {
        throw new RangeError(
            "Genetic Potential must be 0 or an increment of 6 from 6 through 60.",
        );
    }

    return 1 + geneticPotential / 100;
}