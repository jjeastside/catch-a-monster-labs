import { describe, expect, it } from "vitest";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { atLeastOneSuccess, calculateSkillTransfer } from "./breeding-transfer";

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
