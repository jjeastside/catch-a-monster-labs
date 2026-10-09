import { expect, it } from "vitest";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { DATABASE_TEAM_PASSIVES, getDatabaseStats, type DatabaseTeamPassive } from "./database-stats";

const monster = GENERATED_MONSTERS.find(m => !m.passives?.length && m.skillIds.length > 0 && m.baseCritChance > 0)!;
const base = { maxStats: false, mutationMode: "normal" as const };
it.each(DATABASE_TEAM_PASSIVES)("adds $name to a monster without it", passive => {
    const before = getDatabaseStats(monster, 100, "always", "pve", base);
    const after = getDatabaseStats(monster, 100, "always", "pve", { ...base, teamPassives: [passive.id] });
    expect(after.damage).toBeCloseTo(before.damage);
    expect(after.health).toBeCloseTo(before.health);
    expect(after.expectedCritMultiplier).toBeGreaterThan(before.expectedCritMultiplier);
    expect(after.dps).toBeGreaterThan(before.dps);
});
it.each(DATABASE_TEAM_PASSIVES)("does not double-count an existing $name passive", passive => {
    const owner = GENERATED_MONSTERS.find(m => m.passives?.some(p => p.id === passive.id))!;
    for (const maxStats of [false, true]) {
        const before = getDatabaseStats(owner, 100, "always", "pve", { ...base, maxStats });
        const after = getDatabaseStats(owner, 100, "always", "pve", { ...base, maxStats, teamPassives: [passive.id] });
        expect(after.dps).toBeCloseTo(before.dps);
        expect(after.expectedCritMultiplier).toBeCloseTo(before.expectedCritMultiplier);
    }
});
it("combines both team passives independently of self-passive mode", () => {
    const teamPassives: DatabaseTeamPassive[] = ["criticalChance", "criticalDamage"];
    const both = getDatabaseStats(monster, 100, "none", "pve", { ...base, teamPassives });
    const chance = Math.min(1, (monster.baseCritChance + 30) / 100);
    expect(both.expectedCritMultiplier).toBeCloseTo(1 + chance * 1.6);
    expect(both).toEqual(getDatabaseStats(monster, 100, "always", "pve", { ...base, teamPassives }));
});
it("works with X mutations and account selections in PvP", () => {
    const before = getDatabaseStats(monster, 100, "always", "pvp", { maxStats: true, mutationMode: "x", accountMultipliers: { completedAchievementIds: [] } });
    const after = getDatabaseStats(monster, 100, "always", "pvp", { maxStats: true, mutationMode: "x", accountMultipliers: { completedAchievementIds: [] }, teamPassives: ["criticalChance", "criticalDamage"] });
    expect(after.dps).toBeGreaterThan(before.dps);
    expect(after.health).toBe(before.health);
});
