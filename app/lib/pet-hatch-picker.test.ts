import { describe, expect, it } from "vitest";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { transferPower } from "./breeding-transfer";
import { formatTransferPower, sortHatchMonsters } from "./pet-hatch-picker";

const find = (id: string) => GENERATED_MONSTERS.find(m => m.id === id)!;

describe("Pet Hatch monster picker", () => {
    it("sorts real monsters by full-precision Transfer Power in both directions", () => {
        const input = [find("gravitas"), find("runegolem"), find("celestian")];
        expect(sortHatchMonsters(input, "power-asc").map(m => m.id)).toEqual(["runegolem", "celestian", "gravitas"]);
        expect(sortHatchMonsters(input, "power-desc").map(m => m.id)).toEqual(["gravitas", "celestian", "runegolem"]);
        expect(input.map(m => m.id)).toEqual(["gravitas", "runegolem", "celestian"]);
    });
    it("puts missing stats last for both sort directions", () => {
        const invalid = { ...find("dummee"), id: "missing", pvpBaseDamageELevel1: undefined };
        for (const sort of ["power-asc", "power-desc"] as const) {
            expect(sortHatchMonsters([invalid, find("gravitas")], sort).at(-1)?.id).toBe("missing");
        }
        expect(formatTransferPower(transferPower(invalid))).toBe("Unknown");
    });
    it("keeps name sorting available and resolves equal scores alphabetically", () => {
        const a = { ...find("gravitas"), id: "a", name: "Alpha" };
        const b = { ...a, id: "b", name: "Beta" };
        for (const sort of ["name", "power-asc", "power-desc"] as const) {
            expect(sortHatchMonsters([b, a], sort).map(m => m.id)).toEqual(["a", "b"]);
        }
    });
    it("shows tiny valid scores without rounding them to zero", () => {
        expect(formatTransferPower(transferPower(find("dummee")))).not.toBe("0");
        expect(formatTransferPower(0.00000012345)).toBe("1.2345E-7");
        expect(formatTransferPower(123.456)).toBe("123.46");
    });
});
