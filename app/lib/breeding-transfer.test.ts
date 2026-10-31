import { describe, expect, it } from "vitest";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import type { GeneratedMonster } from "../types/monster";
import { hasFixedBreeding } from "./breeding-limits";
import { mutationTransfer, rankTransfer, traitTransfer } from "./breed-transfer";
import { BREEDING_MODEL, calculateSkillTransfer, displayTransferChance, effectiveBreedingFactor, transferPower } from "./breeding-transfer";

const monster = (id: string) => GENERATED_MONSTERS.find(candidate => candidate.id === id)!;
const rawFactor = (m: GeneratedMonster) => Math.sqrt((m.baseDamageELevel1 / m.pvpBaseDamageELevel1!) * (m.baseHealthELevel1 / m.pvpBaseHealthELevel1!));

describe("Transfer Power", () => {
    it("raises the effective factor to the model exponent without rounding", () => {
        for (const m of GENERATED_MONSTERS) {
            const factor = effectiveBreedingFactor(m)!;
            expect(transferPower(m)).toBeCloseTo(factor ** (0.7 / Math.log(1.45)), 10);
        }
    });

    it("matches the exponential formula for every allowed ordered pair in Normal and Super breeding", () => {
        const available = GENERATED_MONSTERS.filter(m => !hasFixedBreeding(m.id));
        let largestDifference = 0;
        for (const source of available) {
            for (const target of available) {
                const ratio = effectiveBreedingFactor(target)! / effectiveBreedingFactor(source)!;
                const normal = Math.min(25, 25 * Math.exp(-0.7 * (Math.log(ratio) / Math.log(1.45) - 1)));
                const result = calculateSkillTransfer(source, target)!;
                largestDifference = Math.max(largestDifference, Math.abs(result.genesisChance - normal), Math.abs(result.superChance - Math.min(50, 2 * normal)));
            }
        }
        expect(largestDifference).toBeLessThan(1e-10);
    });

    it("preserves pre-existing predictions for pairs without Gravitas", () => {
        const factorBefore = (m: GeneratedMonster) => rawFactor(m) * (m.isEvolved ? 2.1984 : 1) * (m.id === "dumplorer" ? 1.25 : 1);
        const available = GENERATED_MONSTERS.filter(m => m.id !== "gravitas" && !hasFixedBreeding(m.id));
        let largestDifference = 0;
        for (const source of available) for (const target of available) {
            const ratio = factorBefore(target) / factorBefore(source);
            const normal = Math.min(25, 25 * Math.exp(-0.7 * (Math.log(ratio) / Math.log(1.45) - 1)));
            const result = calculateSkillTransfer(source, target)!;
            largestDifference = Math.max(largestDifference, Math.abs(normal - result.genesisChance), Math.abs(Math.min(50, 2 * normal) - result.superChance));
        }
        expect(largestDifference).toBeLessThan(1e-10);
    });

    it("caps same-species and easier targets, and reverses donor/recipient scores", () => {
        const low = monster("runegolem");
        const high = monster("gravitas");
        const forward = calculateSkillTransfer(low, high)!;
        const reverse = calculateSkillTransfer(high, low)!;
        expect(reverse.sourcePower).toBe(forward.targetPower);
        expect(reverse.targetPower).toBe(forward.sourcePower);
        expect(forward.genesisChance).toBeLessThan(25);
        expect(reverse.genesisChance).toBe(25);
        expect(reverse.superChance).toBe(50);
        expect(calculateSkillTransfer(high, high)?.genesisChance).toBe(25);
        expect(calculateSkillTransfer(high, high)?.superChance).toBe(50);
    });

    it("applies each Gravitas modifier exactly once without changing its stat record", () => {
        const gravitas = monster("gravitas");
        const before = JSON.stringify(gravitas);
        expect(effectiveBreedingFactor(gravitas)).toBeCloseTo(rawFactor(gravitas) * 2.2 * 1.25, 10);
        expect(effectiveBreedingFactor(gravitas)).toBeCloseTo(86.03152988293684, 10);
        calculateSkillTransfer(monster("runegolem"), gravitas);
        transferPower(gravitas);
        expect(JSON.stringify(gravitas)).toBe(before);
    });

    it("preserves Dumplorer's additional multiplier without applying it to other evolutions", () => {
        const dumplorer = monster("dumplorer");
        expect(effectiveBreedingFactor(dumplorer)).toBeCloseTo(rawFactor(dumplorer) * 2.1984 * 1.25, 10);
        const corsairopus = monster("corsairopus");
        expect(effectiveBreedingFactor(corsairopus)).toBeCloseTo(rawFactor(corsairopus) * 2.1984, 10);
        const runegolem = monster("runegolem");
        expect(effectiveBreedingFactor(runegolem)).toBeCloseTo(rawFactor(runegolem), 10);
        expect(BREEDING_MODEL.evolutionMultiplier).toBe(2.1984);
        expect(BREEDING_MODEL.gravitasEvolutionMultiplier).toBe(2.2);
    });

    it.each([
        ["corsairopus", "normal", 14.28, 14.26, 0.02],
        ["celestian", "super", 11.33, 11.32, 0.01],
        ["sylvaris", "normal", 3.72, 3.71, 0.01],
        ["runegolem", "normal", 1.21, 1.21, 0.01],
        ["violetaegis", "normal", 2.62, 2.62, 0.01],
    ] as const)("matches observed %s → Gravitas %s rate within recorded-stat tolerance", (id, mode, observed, displayed, tolerance) => {
        const result = traitTransfer(monster(id), monster("gravitas"), true)!;
        expect(Math.abs(result[mode] - observed)).toBeLessThan(tolerance);
        // Recorded stats predict Corsairopus 14.26038 vs observed 14.28 (0.01962 pp).
        // Other observations differ by less than 0.01 pp. These are approximations,
        // not exact confirmations. Keep full-precision estimates
        // and the existing truncation rule instead of forcing matching displays.
        expect(displayTransferChance(result[mode])).toBe(displayed);
    });

    it("rejects missing, zero, negative, and nonfinite stats", () => {
        for (const field of ["baseDamageELevel1", "baseHealthELevel1", "pvpBaseDamageELevel1", "pvpBaseHealthELevel1"] as const) {
            for (const value of [undefined, 0, -1, NaN, Infinity]) {
                const invalid = { ...monster("gravitas"), [field]: value } as GeneratedMonster;
                expect(effectiveBreedingFactor(invalid)).toBeNull();
                expect(transferPower(invalid)).toBeNull();
                expect(calculateSkillTransfer(invalid, monster("runegolem"))).toBeNull();
                expect(calculateSkillTransfer(monster("runegolem"), invalid)).toBeNull();
            }
        }
    });

    it("preserves breeding locks, trait presence, rank, and mutation mechanics", () => {
        const unlocked = monster("gravitas");
        for (const id of ["dragon-cannelloni", "fire-dragon-cannelloni", "necro-dragon-cannelloni", "necro-hydra-tortelloni"]) {
            const locked = { ...unlocked, id };
            expect(calculateSkillTransfer(locked, unlocked)).toBeNull();
            expect(calculateSkillTransfer(unlocked, locked)).toBeNull();
            expect(traitTransfer(locked, unlocked, true)).toEqual({ normal: 0, super: 0 });
        }
        expect(traitTransfer(unlocked, monster("runegolem"), false)).toEqual({ normal: 0, super: 0 });
        expect(mutationTransfer("x", "x", true)).toEqual({ normal: 70, x: 20 });
        expect(mutationTransfer("normal", "none", false)).toEqual({ normal: 30, x: 0 });
        expect(rankTransfer("S", "SS", false)).toEqual([{ rank: "SS", chance: 20 }, { rank: "S", chance: 50 }, { rank: "A", chance: 30 }]);
        expect(rankTransfer("S", "S", true)).toEqual([{ rank: "S", chance: 55.55 }, { rank: "A", chance: 44.44 }]);
    });
});
