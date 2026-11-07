import { describe, expect, it } from "vitest";
import { getSkill } from "../data/skills";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { NEW_MONSTERS_DATABASE_HREF, getDatabaseSourceFilter, isNewMonster } from "../data/new-monsters";

describe("Explore New Monsters URL", () => {
    it.each(["", "/catch-a-monster-labs"])("selects New after direct navigation with base path '%s'", base => {
        const url = new URL(base + NEW_MONSTERS_DATABASE_HREF, "https://example.test");
        expect(getDatabaseSourceFilter(url.search)).toBe("New");
        expect(url.pathname).toBe(base + "/monster-database/");
    });
    it("defaults to All for ordinary database visits and unknown filters", () => {
        expect(getDatabaseSourceFilter("")).toBe("All");
        expect(getDatabaseSourceFilter("?source=Egg")).toBe("All");
        expect(getDatabaseSourceFilter("?source=New")).toBe("New");
    });
    it("includes both Update 0.56 monsters", () => {
        const result = GENERATED_MONSTERS.filter(m => isNewMonster(m.id));
        expect(result.map(m => m.id)).toEqual(["bonewraith", "soulpaladin"]);
        expect(result[0].sources).toEqual(expect.arrayContaining([expect.objectContaining({ location: "Pumpkin Mirage" })]));
        expect(result.map(m => m.indexPosition)).toEqual([164, 255]);
        expect(result[1]).toMatchObject({ evolutionSource: "soulguard" });
    });
});

it.each([["blazelord", 1.2], ["obliviondrake", 2], ["soulpaladin", 2]])(
    "shows Fire Dash with the correct damage multiplier for %s", (monsterId, multiplier) => {
        const monster = GENERATED_MONSTERS.find(m => m.id === monsterId);
        const fireDash = monster?.skillIds.map(getSkill).find(skill => skill?.name === "Fire Dash");
        expect(fireDash?.damageInstances).toEqual([{ multiplier, hits: 1 }]);
    },
);
