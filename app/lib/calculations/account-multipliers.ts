import type { Build } from "../../types/build";

export const ACCOUNT_MULTIPLIERS = {
    indexMania: {
        label: "Index Mania",
        multiplier: 1.25,
        description: "Apply the completed Index Mania achievement.",
    },
    petQuestAchievement: {
        label: "Pet Quest Achievement",
        multiplier: 1.15,
        description: "Apply the completed Pet Quest achievement.",
    },
    pathOfProgress: {
        label: "Path of Progress",
        multiplier: 1.10,
        description: "Apply the completed Path of Progress achievement.",
    },
} as const;

export type AccountMultiplierId = keyof typeof ACCOUNT_MULTIPLIERS;

export const ACCOUNT_MULTIPLIER_IDS = Object.keys(
    ACCOUNT_MULTIPLIERS,
) as AccountMultiplierId[];

export function getAccountMultiplier(
    selections: Build["accountMultipliers"],
): number {
    return ACCOUNT_MULTIPLIER_IDS.reduce(
        (total, id) =>
            selections[id]
                ? total * ACCOUNT_MULTIPLIERS[id].multiplier
                : total,
        1,
    );
}

export function getSelectedAccountMultiplierCount(
    selections: Build["accountMultipliers"],
): number {
    return ACCOUNT_MULTIPLIER_IDS.filter((id) => selections[id]).length;
}