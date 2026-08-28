/**
 * Central level-cap configuration.
 *
 * When the live game cap increases again, update CURRENT_MAX_LEVEL only.
 * Experimental Mode always previews the next EXPERIMENTAL_LEVEL_INCREMENT levels.
 */
export const MIN_LEVEL = 1;
export const CURRENT_MAX_LEVEL = 110;
export const EXPERIMENTAL_LEVEL_INCREMENT = 5;
export const EXPERIMENTAL_MAX_LEVEL =
    CURRENT_MAX_LEVEL + EXPERIMENTAL_LEVEL_INCREMENT;

export function getMaxLevel(experimental: boolean): number {
    return experimental ? EXPERIMENTAL_MAX_LEVEL : CURRENT_MAX_LEVEL;
}
