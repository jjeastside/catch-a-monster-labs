import { calculateSkillSummary } from "./calculations/skill-summary";
import { getSkill } from "../data/skills";
import { expect, it } from "vitest";
import { applyBreedingLimits, hasFixedBreeding } from "./breeding-limits";
import { calculateStats } from "./calculations/stats";
import { buildForCombatMode } from "./combat-mode-build";
import { getDatabaseStats } from "./database-stats";
import { sanitizeBuild, buildForGoal } from "./team-model";
import { getMonsterStatData } from "../data/monster-stats";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { createDefaultBuild } from "../types/build";

const ids = ["dragon-cannelloni", "fire-dragon-cannelloni", "necro-dragon-cannelloni", "necro-hydra-tortelloni"];
it.each(ids)("locks saved, shared, and team builds for %s", id => {
    for (const combatMode of ["pve", "pvp"] as const) {
        for (const selected of [0, 6, 60]) {
            const saved = { ...createDefaultBuild({ monsterId: id }), healthGeneticPotential: selected, damageGeneticPotential: selected, traitId: "impair-4", combatMode };
            const stats = calculateStats(getMonsterStatData(id), saved)!;
            expect(stats.healthGeneticMultiplier).toBe(1.06);
            expect(stats.damageGeneticMultiplier).toBe(1.06);
            for (const build of [buildForCombatMode(saved, combatMode), sanitizeBuild(saved, id), buildForGoal(saved, "standard")]) {
                expect(build).toMatchObject({ healthGeneticPotential: 6, damageGeneticPotential: 6, traitId: null });
            }
            expect(saved.healthGeneticPotential).toBe(selected);
        }
    }
});
it.each(ids)("keeps database max breeding at 6%% for %s", id => {
    const monster = GENERATED_MONSTERS.find(m => m.id === id)!;
    for (const mutationMode of ["normal", "x"] as const) {
        const stats = getDatabaseStats(monster, 100, "none", "pve", { maxStats: true, mutationMode });
        const build = { ...createDefaultBuild({ monsterId: id }), level: 115, rank: "SS" as const, enhancement: 10,
            healthGeneticPotential: 6, damageGeneticPotential: 6, armorId: "nectar-heart",
            mutations: mutationMode === "x" ? ["huge-x" as const] : ["huge" as const] };
        expect(stats.health).toBeCloseTo(calculateStats(getMonsterStatData(id), build)!.health);
        expect(stats.health).toBeGreaterThan(getDatabaseStats(monster, 100, "none", "pve", { maxStats: false, mutationMode }).health);
    }
});
it("leaves ordinary monsters and shared controls unrestricted", () => {
    const build = { ...createDefaultBuild({ monsterId: "dummee" }), healthGeneticPotential: 60, damageGeneticPotential: 60 };
    expect(hasFixedBreeding("dummee")).toBe(false);
    expect(applyBreedingLimits(build, build.monsterId)).toBe(build);
    expect(applyBreedingLimits(build, null)).toBe(build);
    expect(calculateStats(getMonsterStatData("dummee"), build)!.healthGeneticMultiplier).toBe(1.6);
    expect(GENERATED_MONSTERS.filter(m => hasFixedBreeding(m.id))).toHaveLength(4);
});

it.each(ids)("ignores saved trait effects in skill results for %s", id => {
    const monster = GENERATED_MONSTERS.find(m => m.id === id)!;
    const build = createDefaultBuild({ monsterId: id });
    const stats = calculateStats(getMonsterStatData(id), build)!;
    for (const skillId of monster.skillIds) {
        const skill = getSkill(skillId)!;
        const baseline = calculateSkillSummary(monster, skill, stats, build, monster.passives ?? []);
        for (const traitId of ["impair-4", "hasten-3", "vital-barrier", "grace"]) {
            expect(calculateSkillSummary(monster, skill, stats, { ...build, traitId }, monster.passives ?? [])).toEqual(baseline);
        }
    }
});
