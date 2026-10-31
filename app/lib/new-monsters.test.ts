import { describe, expect, it } from "vitest";
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
    it("includes all five monsters across both islands, including Capejack", () => {
        const result = GENERATED_MONSTERS.filter(m => isNewMonster(m.id));
        expect(result.map(m => m.id)).toEqual(["gloombat", "emberkit", "grimveil", "palejack", "capejack"]);
        expect(new Set(result.flatMap(m => m.sources.map(s => s.location)))).toEqual(new Set(["Pumpkin Mirage", "Skyheart Isle"]));
    });
});
