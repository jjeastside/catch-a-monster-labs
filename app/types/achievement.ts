export type AchievementCategory =
    | "index-mania"
    | "path-of-progress"
    | "pet-quest";

export type AchievementRewardStat = "health" | "damage";

export type Achievement = {
    id: string;
    category: AchievementCategory;
    order: number;
    name: string;
    island: string | null;
    goalType: string;
    goalAmount: number | null;
    rewardStat: AchievementRewardStat;
    rewardPercent: number;
    requiresPrevious: boolean;
    description: string;
};