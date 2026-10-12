import { describe, it, expect } from "vitest";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { averageBreeds, displayedTraitRates, getBreedingTraits, mutationTransfer, rankTransfer, traitTransfer, transferPower } from "./breed-transfer";
const monster = GENERATED_MONSTERS.find(m => m.id === "runegolem")!;
describe("breed transfer research model", () => {
    it("gives average independent breeds per success, with no finite average at zero", () => {
        expect(averageBreeds(50)).toBe(2);
        expect(averageBreeds(25)).toBe(4);
        expect(averageBreeds(10)).toBe(10);
        expect(averageBreeds(46.62)).toBeCloseTo(2.145);
        expect(averageBreeds(0)).toBeNull();
        expect(averageBreeds(NaN)).toBeNull();
    });
    it("restricts exclusive traits to their sources while allowing Vital Barrier everywhere", () => {
        expect(getBreedingTraits("runegolem").some(trait => trait.id === "impair-4")).toBe(true);
        expect(getBreedingTraits("violetaegis").some(trait => trait.id === "impair-4")).toBe(false);
        for (const monster of GENERATED_MONSTERS) {
            const traits = getBreedingTraits(monster.id);
            expect(traits.some(trait => trait.id === "vital-barrier")).toBe(true);
            expect(traits.some(trait => trait.id === "impair-1")).toBe(true);
            for (const trait of traits) {
                if (trait.id !== "vital-barrier" && trait.exclusiveSourceIds?.length) expect(trait.exclusiveSourceIds).toContain(monster.id);
            }
        }
    });
    it("caps equal-power transfers and doubles for Super", () => {
        expect(traitTransfer(monster, monster, true)).toEqual({ normal: 25, super: 50 });
    });
    it("uses target over source power, so direction matters", () => {
        const target = { ...monster, baseDamageELevel1: monster.baseDamageELevel1 * 10, baseHealthELevel1: monster.baseHealthELevel1 * 10 };
        expect(traitTransfer(monster, target, true)!.normal).toBeLessThan(1);
        expect(traitTransfer(target, monster, true)!.normal).toBe(25);
    });
    it("uses the logarithmic decay equation above the cap threshold", () => {
        const target = { ...monster, baseDamageELevel1: monster.baseDamageELevel1 * 2.25, baseHealthELevel1: monster.baseHealthELevel1 * 2.25 };
        const expected = 25 * Math.exp(-0.7 * (Math.log(2.25) / Math.log(1.45) - 1));
        expect(traitTransfer(monster, target, true)!.normal).toBeCloseTo(expected);
        expect(traitTransfer(monster, target, true)!.super).toBeCloseTo(expected * 2);
    });
    it("does not fabricate estimates without valid stats or a source trait", () => {
        expect(traitTransfer(monster, { ...monster, pvpBaseDamageELevel1: undefined }, true)).toBeNull();
        expect(traitTransfer(monster, monster, false)?.normal).toBe(0);
        expect(traitTransfer(monster, { ...monster, id: "dragon-cannelloni" }, true)?.normal).toBe(0);
    });
    it("applies evolution and Dumplorer corrections once", () => {
        const base = { ...monster, isEvolved: false };
        expect(transferPower({ ...base, isEvolved: true })! / transferPower(base)!).toBeCloseTo(2.2);
        expect(transferPower({ ...base, id: "dumplorer", isEvolved: true })! / transferPower(base)!).toBeCloseTo(2.75);
    });
    it("calculates Normal and Super mutation outcomes", () => {
        expect(mutationTransfer("none", "none", false)).toEqual({ normal: 0, x: 0 });
        expect(mutationTransfer("normal", "none", false)).toEqual({ normal: 30, x: 0 });
        expect(mutationTransfer("normal", "normal", false)).toEqual({ normal: 30, x: 0 });
        expect(mutationTransfer("normal", "none", true)).toEqual({ normal: 35, x: 0 });
        expect(mutationTransfer("normal", "normal", true)).toEqual({ normal: 70, x: 0 });
        expect(mutationTransfer("x", "none", true)).toEqual({ normal: 35, x: 10 });
        expect(mutationTransfer("x", "normal", true)).toEqual({ normal: 70, x: 10 });
        expect(mutationTransfer("x", "x", true)).toEqual({ normal: 70, x: 20 });
    });
    it("calculates every S and SS parent rank pairing", () => {
        expect(rankTransfer("S", "S")).toEqual([{ rank: "S", chance: 40 }, { rank: "A", chance: 60 }]);
        expect(rankTransfer("SS", "S")).toEqual([{ rank: "SS", chance: 20 }, { rank: "S", chance: 50 }, { rank: "A", chance: 30 }]);
        expect(rankTransfer("S", "SS")).toEqual(rankTransfer("SS", "S"));
        expect(rankTransfer("SS", "SS")).toEqual([{ rank: "SS", chance: 60 }, { rank: "S", chance: 40 }]);
    });
    it("uses Super Breed rank rates for every pairing", () => {
        expect(rankTransfer("S", "S", true)).toEqual([{ rank: "S", chance: 55.55 }, { rank: "A", chance: 44.44 }]);
        expect(rankTransfer("SS", "S", true)).toEqual([{ rank: "SS", chance: 30 }, { rank: "S", chance: 70 }]);
        expect(rankTransfer("S", "SS", true)).toEqual(rankTransfer("SS", "S", true));
        expect(rankTransfer("SS", "SS", true)).toEqual([{ rank: "SS", chance: 50 }, { rank: "S", chance: 50 }]);
    });
    it("never displays less than double the rounded Normal chance", () => {
        expect(displayedTraitRates(1.516)).toEqual({ normal: 1.52, super: 3.04 });
        expect(displayedTraitRates(25)).toEqual({ normal: 25, super: 50 });
        expect(displayedTraitRates(0)).toEqual({ normal: 0, super: 0 });
        for (const value of [0.004, 0.005, 0.034, 0.096, 1.514, 18.605, 24.995]) {
            const shown = displayedTraitRates(value);
            expect(shown.super + 1e-9).toBeGreaterThanOrEqual(shown.normal * 2);
            expect(shown.super).toBeLessThanOrEqual(50);
        }
    });
});
