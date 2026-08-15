export type AchievementCategory =
    | "index-mania"
    | "path-of-progress"
    | "pet-quest"
    | "rift-challenger"
    | "strive-for-perfection";

export type AchievementRewardStat =
    | "health"
    | "damage"
    | "rift-damage"
    | "crit-chance";

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