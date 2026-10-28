import { describe, expect, it } from "vitest";
import { getEnemyVulnerability, getRallyingWarCryTeamDamageIncrease } from "../data/skills";
import { applyTeamCombatConditions, getTeamCombatOptions } from "./team-combat-conditions";
import { availableMonsters, makeBuild, monsterDps, sanitizeBuild, normalizeSavedTeams, buildForGoal } from "./team-model";
const solo = availableMonsters.find(m => m.id === "dummee")!;
const buffer = availableMonsters.find(m => getRallyingWarCryTeamDamageIncrease(m.skillIds) === 50)!;
const debuffer = availableMonsters.find(m => getEnemyVulnerability(m.skillIds) === 20)!;
const team = () => [makeBuild(solo.id), makeBuild(buffer.id), makeBuild(debuffer.id)];
const dps = (builds: ReturnType<typeof team>) => applyTeamCombatConditions(builds).map(build => monsterDps(availableMonsters.find(m => m.id === build.monsterId)!, build));
describe("Shared combat conditions", () => {
  it("hides unavailable effects", () => {
    expect(getTeamCombatOptions([makeBuild(solo.id)])).toMatchObject({ damageIncreasePercent: 0, vulnerabilityPercentages: [], hasStatusCondition: false });
  });
  it("shares a single buff with every member without stacking in PvE and PvP", () => {
    for (const combatMode of ["pve", "pvp"] as const) {
      const builds = team().map(build => ({ ...build, combatMode }));
      const baseline = dps(builds);
      builds[1].rallyingWarCryActive = true;
      dps(builds).forEach((value, i) => expect(value / baseline[i]).toBeCloseTo(1.5));
      builds.forEach(build => { build.rallyingWarCryActive = true; });
      dps(builds).forEach((value, i) => expect(value / baseline[i]).toBeCloseTo(1.5));
    }
  });
  it("shares mutually exclusive 20% or 30% vulnerability including the provider's trait", () => {
    const builds = team();
    builds[2].traitId = "fragility-vulnerable";
    expect(getTeamCombatOptions(builds).vulnerabilityPercentages).toEqual([20, 30]);
    const baseline = dps(builds);
    builds[2].vulnerabilityActive = true;
    builds[2].enemyVulnerabilityPercent = 20;
    dps(builds).forEach((value, i) => expect(value / baseline[i]).toBeCloseTo(1.2));
    builds.forEach(build => { build.vulnerabilityActive = true; build.enemyVulnerabilityPercent = 30; });
    dps(builds).forEach((value, i) => expect(value / baseline[i]).toBeCloseTo(1.3));
    builds.forEach(build => { build.rallyingWarCryActive = true; });
    dps(builds).forEach((value, i) => expect(value / baseline[i]).toBeCloseTo(1.95));
  });
  it("deduplicates repeated providers and removes unavailable effects", () => {
    const builds = [makeBuild(buffer.id), makeBuild(buffer.id), makeBuild(debuffer.id)];
    builds.forEach(build => { build.rallyingWarCryActive = true; build.vulnerabilityActive = true; });
    expect(applyTeamCombatConditions(builds)[0].teamCombatEffects).toEqual({ damageIncreasePercent: 50, vulnerabilityPercent: 20 });
    expect(applyTeamCombatConditions([{ ...makeBuild(solo.id), rallyingWarCryActive: true, vulnerabilityActive: true }])[0])
      .toMatchObject({ rallyingWarCryActive: false, vulnerabilityActive: false, teamCombatEffects: { damageIncreasePercent: 0, vulnerabilityPercent: 0 } });
  });
  it("shares enemy status while only relevant traits gain damage", () => {
    const builds = team(); builds[0].traitId = "fragility-status";
    const baseline = dps(builds); builds[2].targetStatused = true;
    const active = dps(builds);
    expect(active[0] / baseline[0]).toBeCloseTo(1.5);
    expect(active[1] / baseline[1]).toBeCloseTo(1);
    expect(active[2] / baseline[2]).toBeCloseTo(1);
  });
  it("persists selections but rebuilds source strengths", () => {
    const build = { ...makeBuild(solo.id), targetStatused: true, targetIsBoss: true, rallyingWarCryActive: true, vulnerabilityActive: true, enemyVulnerabilityPercent: 30 };
    const normalized = sanitizeBuild({ ...build, teamCombatEffects: { damageIncreasePercent: 999, vulnerabilityPercent: 999 } }, solo.id);
    const saved = normalizeSavedTeams({ "slot-1": { builds: [normalized], goal: "damage", combatContext: "spire" } });
    expect(saved["slot-1"].builds[0]).toMatchObject(build);
    expect(normalized.teamCombatEffects).toBeUndefined();
  });
  it("allows boss conditions in Spire and disables them in PvP", () => {
    const monster = availableMonsters.find(m => m.passives?.some(p => p.effects.some(e => e.stat === "bossDamage")))!;
    expect(getTeamCombatOptions([makeBuild(monster.id)]).hasBossCondition).toBe(true);
    const build = { ...makeBuild(monster.id), targetIsBoss: true };
    expect(buildForGoal(build, "spire")).toMatchObject({ targetIsBoss: true, combatContext: "spire" });
    expect(buildForGoal({ ...build, combatMode: "pvp" }, "standard").targetIsBoss).toBe(false);
  });
});
