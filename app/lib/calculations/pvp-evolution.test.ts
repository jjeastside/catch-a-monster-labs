import { describe, expect, it } from "vitest";
import { calculateStats } from "./stats";
import { getEvolutionMultiplier } from "./evolution";
import { getMonsterStatData } from "../../data/monster-stats";
import { buildForCombatMode } from "../combat-mode-build";
import { createDefaultBuild } from "../../types/build";

const baselineBuild = {
    ...createDefaultBuild({ monsterId: "mistvolf" }),
    healthGeneticPotential: 0,
    damageGeneticPotential: 0,
    evolutionPercent: 160,
};

describe("PvP base stats and EM", () => {
    it("halves only evolved monsters' selected EM in PvP", () => {
        expect(getEvolutionMultiplier(160, "pve")).toBeCloseTo(1.6);
        expect(getEvolutionMultiplier(160, "pvp")).toBeCloseTo(0.8);
        expect(getEvolutionMultiplier(100, "pvp")).toBeCloseTo(0.5);
    });

    it("uses PvP base Damage and Health for an evolved monster", () => {
        const monster = getMonsterStatData("mistvolf");
        expect(monster).not.toBeNull();
        const pve = calculateStats(monster, buildForCombatMode(baselineBuild, "pve"));
        const pvp = calculateStats(monster, buildForCombatMode(baselineBuild, "pvp"));
        expect(pve?.damage).toBeCloseTo(monster!.baseDamageELevel1 * 1.6);
        expect(pve?.health).toBeCloseTo(monster!.baseHealthELevel1 * 1.6);
        expect(pvp?.damage).toBeCloseTo(monster!.pvpBaseDamageELevel1! * 0.8);
        expect(pvp?.health).toBeCloseTo(monster!.pvpBaseHealthELevel1! * 0.8);
    });

    it("keeps the full PvP base stats for non-evolved monsters", () => {
        const monster = getMonsterStatData("leafet");
        const build = { ...baselineBuild, monsterId: "leafet" };
        const pvp = calculateStats(monster, buildForCombatMode(build, "pvp"));
        expect(pvp?.damage).toBeCloseTo(monster!.pvpBaseDamageELevel1!);
        expect(pvp?.health).toBeCloseTo(monster!.pvpBaseHealthELevel1!);
    });

    it("does not substitute PvE bases when PvP data is missing", () => {
        const monster = getMonsterStatData("mistvolf")!;
        const pvp = calculateStats({ ...monster, pvpBaseDamageELevel1: undefined }, buildForCombatMode(baselineBuild, "pvp"));
        expect(pvp).toBeNull();
    });

    it("does not mutate the saved build when switching modes", () => {
        const saved = { ...baselineBuild, combatContext: "dungeon" as const, preDungeonLevel: 8, level: 12 };
        const combat = buildForCombatMode(saved, "pvp");
        expect(combat.combatMode).toBe("pvp");
        expect(combat.combatContext).toBe("standard");
        expect(combat.level).toBe(8);
        expect(saved.combatContext).toBe("dungeon");
        expect(saved.level).toBe(12);
    });
});
