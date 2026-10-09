import { mergeUniquePassives } from "../data/passives";
import type { MonsterPassive } from "../types/build";
import { hasFixedBreeding } from "./breeding-limits";
import { WEAPONS, ARMORS } from "../data/equipments";
import { TRAITS } from "../data/traits";
import { getMonsterStatData } from "../data/monster-stats";
import { getSkill } from "../data/skills";
import { createDefaultBuild, type Build } from "../types/build";
import type { GeneratedMonster } from "../types/monster";
import { calculateStats } from "./calculations/stats";
import { calculateSkillSummary } from "./calculations/skill-summary";
import { calculateCombatDamage } from "./calculations/combat";
import { CURRENT_MAX_LEVEL } from "./level-config";
import { getMonsterComparisonStats, type PassiveCompareMode, type MonsterComparisonStats } from "./monster-comparison";

// Use the strongest flat-stat secret gear and unconditional damage trait in the data.
const weapon = [...WEAPONS].filter(item => item.rarity === "Secret").sort((a, b) => b.percentage - a.percentage)[0];
const armor = [...ARMORS].filter(item => item.rarity === "Secret").sort((a, b) => b.percentage - a.percentage)[0];
const traitDamage = (trait: typeof TRAITS[number]) => trait.effects.reduce((sum, effect) => sum + (effect.type === "damage" && !effect.condition ? effect.percentage : 0), 0);
const trait = [...TRAITS].sort((a, b) => traitDamage(b) - traitDamage(a))[0];

export const DATABASE_MAX_PRESET = `Lv ${CURRENT_MAX_LEVEL} · SS · +10 · 60% ATK / HP breeding (Cannelloni dragons and Necro Hydra: 6%) · ${weapon?.name ?? "No weapon"} · ${armor?.name ?? "No armor"} · ${trait?.name ?? "No trait"} (Cannelloni dragons and Necro Hydra: no traits)`;

export const DATABASE_TEAM_PASSIVES = [
    {
        id: "criticalChance",
        name: "Critical Chance",
        bonus: "+30%",
        icon: "/account-icons/critical-chance.png",
        effects: [{ stat: "critChance", value: 30 }],
    },
    {
        id: "criticalDamage",
        name: "Critical Damage",
        bonus: "+60%",
        icon: "/account-icons/critical-damage.png",
        effects: [{ stat: "critDamage", value: 60 }],
    },
] satisfies (MonsterPassive & { name: string; bonus: string; icon: string })[];

export type DatabaseTeamPassive = typeof DATABASE_TEAM_PASSIVES[number]["id"];

export type DatabaseStatOptions = {
    teamPassives?: DatabaseTeamPassive[];
    maxStats: boolean;
    mutationMode: "normal" | "x";
    accountMultipliers?: Build["accountMultipliers"];
};

export function getDatabaseStats(monster: GeneratedMonster, evolutionPercent: number, passiveMode: PassiveCompareMode, combatMode: "pve" | "pvp", options: DatabaseStatOptions): MonsterComparisonStats {
    if (!options.maxStats && !options.accountMultipliers && !options.teamPassives?.length && !hasFixedBreeding(monster.id)) {
        return getMonsterComparisonStats(monster, evolutionPercent, passiveMode, combatMode);
    }
    const build: Build = {
        ...createDefaultBuild({ monsterId: monster.id }),
        combatMode,
        evolutionPercent: monster.isEvolved ? evolutionPercent : 100,
        healthGeneticPotential: hasFixedBreeding(monster.id) ? 6 : options.maxStats ? 60 : 0,
        damageGeneticPotential: hasFixedBreeding(monster.id) ? 6 : options.maxStats ? 60 : 0,
        level: options.maxStats ? CURRENT_MAX_LEVEL : 1,
        rank: options.maxStats ? "SS" : "E",
        enhancement: options.maxStats ? 10 : 0,
        weaponId: options.maxStats ? weapon?.id ?? null : null,
        armorId: options.maxStats ? armor?.id ?? null : null,
        traitId: hasFixedBreeding(monster.id) ? null : options.maxStats ? trait?.id ?? null : null,
        mutations: !options.maxStats ? [] : options.mutationMode === "x"
            ? ["huge-x", "shiny-x", "bloodlit-x", "fairy-x"]
            : ["huge", "shiny", "bloodlit", "fairy"],
        accountMultipliers: options.accountMultipliers ?? { completedAchievementIds: [] },
    };
    const selfPassives = passiveMode === "none" ? [] : (monster.passives ?? []).filter(passive => passive.condition == null || (passiveMode === "conditional" && passive.id === "vitalSurge"));
    const passives = mergeUniquePassives(selfPassives,
        DATABASE_TEAM_PASSIVES.filter(passive => options.teamPassives?.includes(passive.id)));
    const stats = calculateStats(getMonsterStatData(monster.id), build, passives);
    if (!stats) return { damage: NaN, health: NaN, dps: NaN, expectedCritMultiplier: NaN };
    const damage = calculateCombatDamage({ monster, baseDamage: stats.damage, critMultiplier: stats.critMultiplier, passives }).normalDamage;
    const dps = monster.skillIds.reduce((total, id) => {
        const skill = getSkill(id);
        return total + (skill ? calculateSkillSummary(monster, skill, stats, build, passives).dps ?? 0 : 0);
    }, 0);
    return { damage, health: stats.health, dps, expectedCritMultiplier: 1 + Math.min(1, Math.max(0, stats.critChance / 100)) * (stats.critMultiplier - 1) };
}
