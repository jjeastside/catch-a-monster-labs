import { describe, expect, it } from "vitest";
import { calculateStats } from "./stats";
import { standardGrowth, standardStatGrowth, dragonCannelloniGrowth } from "./growth";
import { getMonsterStatData } from "../../data/monster-stats";
import { createDefaultBuild } from "../../types/build";

const baseline = (monsterId: string) => ({
    ...createDefaultBuild({ monsterId }),
    level: 50,
    rank: "E" as const,
    enhancement: 0,
    healthGeneticPotential: 0,
    damageGeneticPotential: 0,
    mutations: [],
});

describe("Universal Standard growth precision", () => {
    it("imports Treemo as Standard, with its original PvE and PvP bases", () => {
        const treemo = getMonsterStatData("treemo")!;
        expect(treemo.growthType).toBe("standard");
        expect(treemo.baseDamageELevel1).toBe(15.24);
        expect(treemo.baseHealthELevel1).toBe(163.1);
        expect(treemo.pvpBaseDamageELevel1).toBe(346676);
    });

    it("quantizes the Standard growth multiplier to increments of 0.0002", () => {
        expect(standardGrowth(1)).toBe(1);
        expect(standardGrowth(10)).toBe(2.1714);
        expect(standardGrowth(65)).toBe(96.3582);
        expect(standardGrowth(66)).toBe(101.8078);
    });

    it("uses floor-to-0.05 PvE coefficients, separately for damage and health", () => {
        const examples = [
            ["treemo", 15.24, 15.2, 163.1, 163.1],
            ["wattoad", 10.51, 10.5, 63.07, 63.05],
            ["leafet", 7.25, 7.25, 43.5, 43.5],
            ["skedeer", 67.38, 67.35, 720.99, 720.95],
        ] as const;
        for (const [id, baseDamage, coefficientDamage, baseHealth, coefficientHealth] of examples) {
            const stat = getMonsterStatData(id)!;
            expect(stat.baseDamageELevel1).toBeCloseTo(baseDamage);
            expect(stat.baseHealthELevel1).toBeCloseTo(baseHealth);
            for (const level of [1, 10, 26, 50, 65, 66, 85, 115]) {
                const g = standardGrowth(level);
                const result = calculateStats(stat, { ...baseline(id), level, combatMode: "pve" })!;
                expect(result.damage).toBeCloseTo(baseDamage + coefficientDamage * (g - 1), 6);
                expect(result.health).toBeCloseTo(baseHealth + coefficientHealth * (g - 1), 6);
            }
        }
    });

    it("uses PvE-normalized coefficients on PvP bases without changing PvP Lv1", () => {
        const stat = getMonsterStatData("treemo")!;
        for (const level of [1, 10, 26, 65, 80, 115]) {
            const result = calculateStats(stat, { ...baseline("treemo"), level, combatMode: "pvp" })!;
            expect(result.damage).toBeCloseTo(stat.pvpBaseDamageELevel1! * standardStatGrowth(level, 15.24), 5);
            expect(result.health).toBeCloseTo(stat.pvpBaseHealthELevel1! * standardStatGrowth(level, 163.1), 5);
        }
    });

    it("leaves Dragon Cannelloni and Dummee as separate growth types", () => {
        expect(getMonsterStatData("dummee")!.growthType).toBe("dummee");
        const dragon = getMonsterStatData("dragon-cannelloni");
        expect(dragon?.growthType).toBe("dragon-cannelloni");
        expect(dragonCannelloniGrowth(1)).toEqual({health:1,damage:1});
    });
});
