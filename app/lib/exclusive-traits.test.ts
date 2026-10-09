import { describe, expect, it } from "vitest";
import { getMonsterExclusiveTraits, getTrait, TRAITS } from "../data/traits";
import { GENERATED_TRAIT_EXCLUSIVE_SOURCES } from "../data/generated/trait-exclusive-sources";
import { GENERATED_MONSTERS } from "../data/generated/monsters";

describe("exclusive traits imported from traits.csv", () => {
    it("maps every exclusive source monster to a real monster and the correct trait", () => {
        const allIds = new Set(GENERATED_MONSTERS.map(({ id }) => id));
        for (const [traitId, sources] of Object.entries(GENERATED_TRAIT_EXCLUSIVE_SOURCES)) {
            expect(getTrait(traitId), `Missing trait ${traitId}`).not.toBeNull();
            for (const source of sources) {
                expect(allIds.has(source.id), `${traitId}: unknown monster ${source.id}`).toBe(true);
                expect(getMonsterExclusiveTraits(source.id).map(({ id }) => id)).toContain(traitId);
            }
        }
    });

    it("includes every Fortify IV source, plus Gallop, Vitiate and Vital Barrier", () => {
        expect(getTrait("fortify-4")?.exclusiveSourceIds).toEqual([
            "beatopus", "viroopus", "gelopus", "corsairopus",
        ]);
        expect(getMonsterExclusiveTraits("avalanchewyrm").map(({ id }) => id)).toContain("gallop");
        expect(getMonsterExclusiveTraits("venofrog").map(({ id }) => id)).toContain("vitiate");
        expect(getMonsterExclusiveTraits("twirly-bird").map(({ id }) => id)).toContain("vital-barrier");
        expect(getMonsterExclusiveTraits("dummee")).toEqual([]);
    });

    it("only marks traits with declared exclusive sources as exclusive", () => {
        expect(TRAITS.filter(({ exclusiveSourceIds }) => exclusiveSourceIds?.length).length).toBe(10);
        expect(getTrait("impair-1")?.exclusiveSourceIds).toEqual([]);
    });
});
