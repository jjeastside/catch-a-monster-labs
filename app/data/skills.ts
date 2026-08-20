import type { Skill } from "../types/skill";
import { GENERATED_SKILLS } from "./generated/skills";

export const SKILLS = GENERATED_SKILLS;

export type SkillId = keyof typeof SKILLS;


const MONSTER_DISAMBIGUATION_SUFFIXES = new Set([
    "Djinn Lampyr",
    "Frostvolf",
    "Titan Tusk",
    "Psyberion X",
    "Scareharvest",
]);

export function getSkillDisplayName(skillName: string): string {
    const match = skillName.match(/^(.*?) \(([^()]+)\)$/);

    if (!match || !MONSTER_DISAMBIGUATION_SUFFIXES.has(match[2])) {
        return skillName;
    }

    return match[1];
}

export function getSkill(skillId: string | null | undefined): Skill | null {
    if (!skillId) {
        return null;
    }

    return SKILLS[skillId as SkillId] ?? null;
}

export function getSkillTotalMultiplier(skill: Skill): number {
    return skill.damageInstances.reduce(
        (total, instance) => total + instance.multiplier * instance.hits,
        0,
    );
}

export function getSkillTotalHits(skill: Skill): number {
    return skill.damageInstances.reduce(
        (total, instance) => total + instance.hits,
        0,
    );
}

export const SKILL_LIST: Skill[] = Object.values(SKILLS);