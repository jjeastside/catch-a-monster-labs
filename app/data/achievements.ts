import type { Achievement, AchievementCategory } from "../types/achievement";
import { GENERATED_ACHIEVEMENTS } from "./generated/achievements";

export const achievements: Achievement[] = [...GENERATED_ACHIEVEMENTS];

export function getAchievementsByCategory(
    category: AchievementCategory,
): Achievement[] {
    return achievements
        .filter((achievement) => achievement.category === category)
        .sort((left, right) => left.order - right.order);
}

export const achievementIds = new Set(
    achievements.map((achievement) => achievement.id),
);