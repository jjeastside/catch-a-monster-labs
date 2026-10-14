import { getSkill } from "../data/skills";
import { getDatabaseSkillEffects, databaseSkillEffectOptions, type DatabaseSkillEffect } from "./skill-display";

export type SkillEffectFilter = "all" | DatabaseSkillEffect;
export { databaseSkillEffectOptions as skillEffectFilterOptions };

/** Use structured skill effects, including alternate skills, on every calculator. */
export function matchesMonsterSkillEffect(monster: { skillIds: readonly string[] }, effect: SkillEffectFilter): boolean {
    return effect === "all" || monster.skillIds.some((id) => getDatabaseSkillEffects(getSkill(id)).includes(effect));
}
