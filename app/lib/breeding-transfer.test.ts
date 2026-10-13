import { describe, expect, it } from "vitest";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { atLeastOneSuccess, BREEDING_MODEL, calculateSkillTransfer, displayedTransferRates, transferPower } from "./breeding-transfer";

const monster = (id: string) => {
    const found = GENERATED_MONSTERS.find((entry) => entry.id === id);
    if (!found) throw new Error(`Missing test monster: ${id}`);
    return found;
};

describe("breeding skill-transfer formula", () => {
    it("reproduces the Runegolem to Dumplorer measured Genesis and Super Breed chance", () => {
        const result = calculateSkillTransfer(monster("runegolem"), monster("dumplorer"));
        expect(result).not.toBeNull();
        expect(result!.genesisChance).toBeCloseTo(18.63, 1);
        expect(result!.superChance).toBeCloseTo(37.26, 1);
    });
    it("uses the refined evolution multiplier and clean 0.7 / 1.45 curve", () => {
        expect(BREEDING_MODEL.evolutionMultiplier).toBe(2.1984);
        const runegolem = monster("runegolem");
        const base = { ...runegolem, isEvolved: false };
        expect(transferPower({ ...base, isEvolved: true })! / transferPower(base)!).toBeCloseTo(2.1984, 8);
        const result = calculateSkillTransfer(monster("runegolem"), monster("dumplorer"))!;
        const expected = Math.min(25, 25 * Math.exp(-0.7 * (Math.log(result.ratio) / Math.log(1.45) - 1)));
        expect(result.genesisChance).toBeCloseTo(expected, 10);
    });
    it("matches observed two-decimal display truncation", () => {
        expect(displayedTransferRates(12.4127)).toEqual({ normal: 12.41, super: 24.82 });
    });
    it("caps Genesis at 25% and Super Breed at 50%", () => {
        const result = calculateSkillTransfer(monster("dumplorer"), monster("runegolem"));
        expect(result?.genesisChance).toBe(25);
        expect(result?.superChance).toBe(50);
    });
    it("does not assign invented odds to breeding-locked monsters", () => {
        expect(calculateSkillTransfer(monster("dragon-cannelloni"), monster("runegolem"))).toBeNull();
    });
    it("computes chances across independent attempts", () => {
        expect(atLeastOneSuccess(25, 1)).toBeCloseTo(25);
        expect(atLeastOneSuccess(25, 2)).toBeCloseTo(43.75);
    });
});
