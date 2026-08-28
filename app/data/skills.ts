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
    if (skillName.startsWith("Rallying War Cry")) {
        return "Rallying War Cry";
    }

    if (skillName === "Ghost Impact (Vulnerability)") {
        return "Ghost Impact";
    }

    if (skillName === "Soul Reap Chain (Vulnerability)") {
        return "Soul Reap Chain";
    }

    const match = skillName.match(/^(.*?) \(([^()]+)\)$/);

    if (!match || !MONSTER_DISAMBIGUATION_SUFFIXES.has(match[2])) {
        return skillName;
    }

    return match[1];
}

export function getRallyingWarCryDamageIncrease(skillIds: readonly string[]): number {
    const effects = skillIds
        .map((skillId) => getSkill(skillId))
        .filter((skill): skill is Skill => skill !== null)
        .filter((skill) => getSkillDisplayName(skill.name) === "Rallying War Cry")
        .flatMap((skill) => skill.statusEffects ?? [])
        .filter((effect) => effect.type === "damageIncrease");

    const selfIncrease = Math.max(
        0,
        ...effects
            .filter((effect) => effect.target === "Self")
            .map((effect) => effect.amountPercent ?? 0),
    );

    return selfIncrease > 0
        ? selfIncrease
        : Math.max(0, ...effects.map((effect) => effect.amountPercent ?? 0));
}

export function getMonsterDamageIncrease(skillIds: readonly string[]): number {
    const effects = skillIds
        .map((skillId) => getSkill(skillId))
        .filter((skill): skill is Skill => skill !== null)
        .flatMap((skill) => skill.statusEffects ?? [])
        .filter((effect) => effect.type === "damageIncrease");

    const selfIncrease = Math.max(
        0,
        ...effects
            .filter((effect) => effect.target === "Self")
            .map((effect) => effect.amountPercent ?? 0),
    );

    return selfIncrease > 0
        ? selfIncrease
        : Math.max(0, ...effects.map((effect) => effect.amountPercent ?? 0));
}

export function getEnemyVulnerability(skillIds: readonly string[]): number {
    return Math.max(
        0,
        ...skillIds
            .map((skillId) => getSkill(skillId))
            .filter((skill): skill is Skill => skill !== null)
            .flatMap((skill) => skill.statusEffects ?? [])
            .filter((effect) => effect.type === "vulnerability" && effect.target === "Enemy")
            .map((effect) => effect.amountPercent ?? 0),
    );
}

export function getActiveEnemyVulnerability(
    monsterSkillIds: readonly string[],
    teammateSkillIdGroups: readonly (readonly string[])[],
): number {
    return Math.max(
        getEnemyVulnerability(monsterSkillIds),
        ...teammateSkillIdGroups.map(getEnemyVulnerability),
    );
}

export function getRallyingWarCryTeamDamageIncrease(skillIds: readonly string[]): number {
    return Math.max(
        0,
        ...skillIds
            .map((skillId) => getSkill(skillId))
            .filter((skill): skill is Skill => skill !== null)
            .filter((skill) => getSkillDisplayName(skill.name) === "Rallying War Cry")
            .flatMap((skill) => skill.statusEffects ?? [])
            .filter((effect) => effect.type === "damageIncrease" && effect.target === "Team")
            .map((effect) => effect.amountPercent ?? 0),
    );
}

export function getActiveRallyingWarCryDamageIncrease(
    monsterSkillIds: readonly string[],
    teammateSkillIdGroups: readonly (readonly string[])[],
): number {
    return Math.max(
        getRallyingWarCryDamageIncrease(monsterSkillIds),
        ...teammateSkillIdGroups.map(getRallyingWarCryTeamDamageIncrease),
    );
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
