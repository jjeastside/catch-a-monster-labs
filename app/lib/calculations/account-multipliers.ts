import { achievements, getAchievementsByCategory } from "../../data/achievements";
import type { AchievementCategory } from "../../types/achievement";
import type { Build } from "../../types/build";

export const ACCOUNT_MULTIPLIER_CATEGORIES = [
    "path-of-progress",
    "index-mania",
    "pet-quest",
] as const satisfies readonly AchievementCategory[];

export const ACCOUNT_MULTIPLIER_DETAILS = {
    "path-of-progress": {
        label: "Path of Progress",
        shortReward: "+2% HP each",
        description: "Claimed island completion rewards. These may be selected in any order.",
    },
    "index-mania": {
        label: "Index Mania",
        shortReward: "+2% DMG each",
        description: "Index Score milestones. Entering a total completes the first milestones in order.",
    },
    "pet-quest": {
        label: "Pet Quests",
        shortReward: "+8% alternating",
        description: "Stat-granting Pet Quests must be completed in island order.",
    },
} as const;

export type AccountBonuses = {
    healthPercent: number;
    damagePercent: number;
    healthMultiplier: number;
    damageMultiplier: number;
};

export function getAccountBonuses(
    selections: Build["accountMultipliers"],
): AccountBonuses {
    const completed = new Set(selections.completedAchievementIds);
    let pathHealthPercent = 0;
    let indexDamagePercent = 0;
    let petHealthPercent = 0;
    let petDamagePercent = 0;

    for (const achievement of achievements) {
        if (!completed.has(achievement.id)) continue;

        if (achievement.category === "path-of-progress") {
            pathHealthPercent += achievement.rewardPercent;
        } else if (achievement.category === "index-mania") {
            indexDamagePercent += achievement.rewardPercent;
        } else if (achievement.rewardStat === "health") {
            petHealthPercent += achievement.rewardPercent;
        } else {
            petDamagePercent += achievement.rewardPercent;
        }
    }

    const healthMultiplier =
        (1 + pathHealthPercent / 100) *
        (1 + petHealthPercent / 100);

    const damageMultiplier =
        (1 + indexDamagePercent / 100) *
        (1 + petDamagePercent / 100);

    return {
        healthPercent: Number(((healthMultiplier - 1) * 100).toFixed(4)),
        damagePercent: Number(((damageMultiplier - 1) * 100).toFixed(4)),
        healthMultiplier,
        damageMultiplier,
    };
}

export function getCategoryProgress(
    selections: Build["accountMultipliers"],
    category: AchievementCategory,
): { completed: number; total: number; healthPercent: number; damagePercent: number } {
    const completedIds = new Set(selections.completedAchievementIds);
    const categoryAchievements = getAchievementsByCategory(category);
    const completedAchievements = categoryAchievements.filter((achievement) =>
        completedIds.has(achievement.id),
    );

    return {
        completed: completedAchievements.length,
        total: categoryAchievements.length,
        healthPercent: completedAchievements
            .filter((achievement) => achievement.rewardStat === "health")
            .reduce((total, achievement) => total + achievement.rewardPercent, 0),
        damagePercent: completedAchievements
            .filter((achievement) => achievement.rewardStat === "damage")
            .reduce((total, achievement) => total + achievement.rewardPercent, 0),
    };
}