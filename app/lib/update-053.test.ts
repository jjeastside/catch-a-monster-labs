import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { getSkill, getSkillExpectedProcMultiplier, getSkillTotalMultiplier } from "../data/skills";
import { gamePatches } from "../data/game-patches";
import { getMonsterStatData } from "../data/monster-stats";

const updatedMonsters = [
    { id: "luminara", position: 244, element: "Light", source: "", skills: ["void-collapse", "holy-aura-luminara"] },
    { id: "umbra-sentinel", position: 245, element: "Dark", source: "umbra-reaver", skills: ["overvolt-tempest", "lightning-thrust"] },
    { id: "lumen-sentinel", position: 246, element: "Mechanical", source: "lumen-knight", skills: ["overvolt-tempest", "lightning-thrust"] },
] as const;

describe("Catch a Monster Update 0.53", () => {
    it("keeps the update first, without removing the prior 0.52.1 sub-update", () => {
        expect(gamePatches[0].version).toBe("Update 0.53");
        expect(gamePatches[0].label).toBe("Latest");
        expect(gamePatches[0].sections.some(section => section.changes.some(c => c.includes("Apocalypse")))).toBe(true);
        expect(gamePatches[1].sections.some(section => section.title === "Update 0.52.1")).toBe(true);
    });

    it("imports all three new monsters with complete stats and correct skills", () => {
        for (const entry of updatedMonsters) {
            const monster = GENERATED_MONSTERS.find(candidate => candidate.id === entry.id);
            expect(monster, entry.id).toBeDefined();
            expect(monster?.element).toBe(entry.element);
            expect(monster?.rarity).toBe("Secret");
            expect(monster?.indexPosition).toBe(entry.position);
            expect(monster?.skillIds).toEqual(entry.skills);
            expect(monster?.passives?.length).toBeGreaterThan(0);
            expect(monster?.sources.length).toBeGreaterThan(0);
            expect(monster?.sources[0].status).toBe("Current");

            const stats = getMonsterStatData(entry.id);
            expect(stats?.baseDamageELevel1).toBeGreaterThan(0);
            expect(stats?.baseHealthELevel1).toBeGreaterThan(0);
            expect(stats?.pvpBaseDamageELevel1).toBeGreaterThan(0);
            expect(stats?.pvpBaseHealthELevel1).toBeGreaterThan(0);
            expect(monster?.image).toBe(`/monster-artwork/${entry.id}.png`);
            expect(existsSync(path.join(process.cwd(), "public", "monster-artwork", `${entry.id}.png`))).toBe(true);

            for (const skillId of entry.skills) {
                expect(getSkill(skillId), `Missing skill ${skillId}`).not.toBeNull();
                expect(existsSync(path.join(process.cwd(), "public", "skill-icons", `${skillId}.png`)), `Missing icon ${skillId}`).toBe(true);
            }
        }
    });

    it("links both new evolutions to their correct parent and keeps Luminara obtainable", () => {
        for (const entry of updatedMonsters) {
            const monster = GENERATED_MONSTERS.find(candidate => candidate.id === entry.id)!;
            expect(monster.evolutionSource ?? "").toBe(entry.source);
            expect(monster.isEvolved === true).toBe(Boolean(entry.source));
            if (entry.source) {
                expect(GENERATED_MONSTERS.find(candidate => candidate.id === entry.source)?.hasEvolution).toBe(true);
            } else {
                expect(monster.sources.some(source => source.type === "Egg" && source.notes?.includes("Apocalypse"))).toBe(true);
            }
        }
    });

    it("has unique and contiguous index positions instead of showing Index #0", () => {
        const positions = GENERATED_MONSTERS.map(monster => monster.indexPosition).sort((a, b) => a - b);
        expect(positions).toEqual(Array.from({ length: GENERATED_MONSTERS.length }, (_, index) => index + 1));
        expect(GENERATED_MONSTERS.find(monster => monster.id === "icearia")?.indexPosition).toBe(256);
    });

    it("uses the supplied 8-second cooldown for Luminara's Holy Aura", () => {
        const aura = getSkill("holy-aura-luminara");
        expect(aura).not.toBeNull();
        expect(aura?.cooldown).toBe(8);
        expect(aura?.damageInstances).toEqual([]);
    });

    it("uses the 25% Overvolt double-damage outcome once, not as an extra skill", () => {
        const overvolt = getSkill("overvolt-tempest")!;
        const overload = getSkill("overvolt-tempest-overload")!;
        expect(getSkillTotalMultiplier(overvolt)).toBeCloseTo(2.2);
        expect(getSkillTotalMultiplier(overload)).toBeCloseTo(4.4);
        expect(getSkillTotalMultiplier(overvolt) * getSkillExpectedProcMultiplier(overvolt)).toBeCloseTo(2.75);
        expect(GENERATED_MONSTERS.find(monster => monster.id === "umbra-sentinel")?.skillIds).not.toContain("overvolt-tempest-overload");
        expect(getSkillExpectedProcMultiplier(getSkill("lightning-thrust")!)).toBe(1);
    });
});
