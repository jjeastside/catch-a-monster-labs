import { monsters } from "../data/monsters";
import { getMonsterStatData } from "../data/monster-stats";
import { getSkill } from "../data/skills";
import { mergeUniquePassives } from "../data/passives";
import { getPassiveEffectTotals } from "./calculations/passive-effects";
import { ARMORS, WEAPONS } from "../data/equipments";
import { getAvailableTraits } from "../data/traits";
import { getAttribute } from "../data/attributes";
import { calculateSkillSummary } from "./calculations/skill-summary";
import { calculateStats } from "./calculations/stats";
import { getAttributeSlotCount } from "./calculations/attributes";
import { clampEvolutionPercent } from "./calculations/evolution";
import { GENETIC_POTENTIAL_VALUES } from "./calculations/genetic-potential";
import { CURRENT_MAX_LEVEL, MIN_LEVEL } from "./level-config";
import { createDefaultBuild, type Build, type MonsterPassive, type Mutation, type Rank } from "../types/build";
import type { Monster } from "../types/monster";

export const TEAM_STORAGE_KEY = "cam-lab-team-composition-v1";
export const INVENTORY_STORAGE_KEY = "cam-lab-team-inventory-v1";
export const SAVED_TEAMS_STORAGE_KEY = "cam-lab-saved-teams-v1";
export const ranks: Rank[] = ["E", "D", "C", "B", "A", "S", "SS"];
export const mutationOptions: Array<{ id: Mutation; label: string }> = [
  { id: "huge", label: "Huge" },
  { id: "huge-x", label: "Huge X" },
  { id: "shiny", label: "Shiny" },
  { id: "shiny-x", label: "Shiny X" },
  { id: "bloodlit", label: "Bloodlit" },
  { id: "bloodlit-x", label: "Bloodlit X" },
  { id: "fairy", label: "Fairy" },
  { id: "fairy-x", label: "Fairy X" },
];
export type TeamGoal = "damage" | "balanced" | "survivability" | "support";
export type TeamCombatContext = "standard" | "boss" | "rift" | "spire" | "dungeon";
export function normalizeCombatContext(value: unknown): TeamCombatContext {
  return value === "boss" || value === "rift" || value === "spire" || value === "dungeon" ? value : "standard";
}
export function migrateGoalContext(goal: unknown, context: unknown): { goal: TeamGoal; combatContext: TeamCombatContext } {
  const legacyContext = normalizeCombatContext(goal);
  return { goal: normalizeGoal(goal), combatContext: context == null ? legacyContext : normalizeCombatContext(context) };
}
// The first copy keeps its legacy monster ID; further copies receive stable IDs.
export type InventoryBuilds = Record<string, Build>;
export const copyMonsterId = (key: string) => key.split("::copy-")[0];
export const nextCopyKey = (inventory: InventoryBuilds, monsterId: string): string => {
  let number = 2;
  while (inventory[`${monsterId}::copy-${number}`]) number += 1;
  return `${monsterId}::copy-${number}`;
};
export type InventoryFilter = "all" | "owned" | "unowned" | "team";
export type InventorySort = "name" | "rank" | "level" | "dps" | "health";
export type IndexBonusId = "huge" | "shiny" | "bloodlit" | "fairy";
export type IndexTrackerProgress = Record<string, { rank?: Rank; bonuses?: Partial<Record<IndexBonusId, boolean>> }>;
export type SavedTeam = { builds: Build[]; goal: TeamGoal; combatContext: TeamCombatContext; updatedAt: number; name?: string };
export type SavedTeams = Record<string, SavedTeam>;

export const availableMonsters = monsters.filter((monster) => getMonsterStatData(monster.id));
export const monsterById = new Map(availableMonsters.map((monster) => [monster.id, monster]));

export function makeBuild(monsterId: string | null): Build {
  const build = createDefaultBuild({ monsterId });
  const monster = monsterId ? monsterById.get(monsterId) : undefined;
  return {
    ...build,
    monsterId,
    selectedSkillId: monster?.skillIds[0] ?? null,
  };
}

export function sanitizeBuild(saved: Partial<Build>, monsterId: string): Build {
  const monster = monsterById.get(monsterId);
  const base = makeBuild(monsterId);
  if (!monster) return base;

  const finite = (value: unknown, fallback: number) =>
    (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value))
      ? Number(value) : fallback;
  const integer = (value: unknown, min: number, max: number, fallback: number) =>
    Math.max(min, Math.min(max, Math.round(finite(value, fallback))));
  const gp = (value: unknown) => {
    const numeric = finite(value, 6);
    return GENETIC_POTENTIAL_VALUES.reduce((best, candidate) =>
      Math.abs(candidate - numeric) < Math.abs(best - numeric) ? candidate : best);
  };
  const mutations: Mutation[] = [];
  for (const family of ["huge", "shiny", "bloodlit", "fairy"] as const) {
    const upgraded: Mutation = `${family}-x`;
    if (Array.isArray(saved.mutations)) {
      if (saved.mutations.includes(upgraded)) mutations.push(upgraded);
      else if (saved.mutations.includes(family)) mutations.push(family);
    }
  }
  const weapon = WEAPONS.find(({ id }) => id === saved.weaponId);
  const armor = ARMORS.find(({ id }) => id === saved.armorId);
  const attributes = (value: unknown, type: "weapon" | "armor", rarity?: string) =>
    (Array.isArray(value) ? value : []).filter((id): id is string => {
      if (typeof id !== "string") return false;
      const attribute = getAttribute(id);
      return attribute?.gearType === type && attribute.rarity !== "Secret";
    }).slice(0, getAttributeSlotCount(rarity));

  return {
    ...base,
    monsterId,
    inventoryCopyId: typeof saved.inventoryCopyId === "string" &&
      (saved.inventoryCopyId === monsterId || /^.+::copy-(?:[2-9]|[1-9]\d+)$/.test(saved.inventoryCopyId)) &&
      copyMonsterId(saved.inventoryCopyId) === monsterId ? saved.inventoryCopyId : undefined,
    rank: ranks.includes(saved.rank as Rank) ? (saved.rank as Rank) : "E",
    level: integer(saved.level, MIN_LEVEL, CURRENT_MAX_LEVEL, base.level),
    enhancement: integer(saved.enhancement, 0, 10, base.enhancement),
    damageGeneticPotential: gp(saved.damageGeneticPotential),
    healthGeneticPotential: gp(saved.healthGeneticPotential),
    evolutionPercent: monster.isEvolved ? clampEvolutionPercent(finite(saved.evolutionPercent, 100)) : 100,
    mutations,
    traitId: getAvailableTraits().some(({ id }) => id === saved.traitId) ? saved.traitId! : null,
    weaponId: weapon?.id ?? null,
    armorId: armor?.id ?? null,
    weaponAttributeIds: attributes(saved.weaponAttributeIds, "weapon", weapon?.rarity),
    armorAttributeIds: attributes(saved.armorAttributeIds, "armor", armor?.rarity),
    currentHpPercent: Math.max(0, Math.min(100, finite(saved.currentHpPercent, 100))),
    selectedSkillId:
      saved.selectedSkillId && monster.skillIds.includes(saved.selectedSkillId)
        ? saved.selectedSkillId
        : monster.skillIds[0] ?? null,
    // These values describe the current calculator context, not a saved monster.
    // Rebuild them whenever the team is evaluated so recommendation contexts do
    // not leak into the regular Team Overview or saved presets.
    targetIsBoss: false,
    combatContext: "standard",
    preDungeonLevel: null,
    accountMultipliers: { completedAchievementIds: [] },
    teammateMonsterIds: [null, null],
  };
}

export function defaultTeam(): Build[] {
  const preferred = ["dummee", "leafet", "wattoad"];
  return preferred.map((id, index) => {
    const monster = monsterById.get(id) ?? availableMonsters[index];
    return makeBuild(monster?.id ?? null);
  });
}

export function defaultInventory(): InventoryBuilds {
  return Object.fromEntries(
    defaultTeam().flatMap((build) => (build.monsterId ? [[build.monsterId, build]] : [])),
  );
}

export function normalizeTeam(value: unknown): Build[] | null {
  if (!Array.isArray(value)) return null;
  const result = value.slice(0, 3).map((item) => {
    if (!item || typeof item !== "object") return makeBuild(null);
    const saved = item as Partial<Build>;
    if (!saved.monsterId || !monsterById.has(saved.monsterId)) return makeBuild(null);
    return sanitizeBuild(saved, saved.monsterId);
  });

  while (result.length < 3) result.push(makeBuild(null));
  return result;
}

export function normalizeSavedTeams(value: unknown): SavedTeams {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: SavedTeams = {};

  for (const [slotId, entry] of Object.entries(value)) {
    if (!/^slot-(?:[1-9]|1[0-9]|20)$/.test(slotId)) continue;
    if (!entry || typeof entry !== "object") continue;
    const saved = entry as Partial<SavedTeam>;
    const builds = normalizeTeam(saved.builds);
    if (!builds) continue;
    const { goal, combatContext } = migrateGoalContext(saved.goal, saved.combatContext);
    result[slotId] = {
      builds,
      goal,
      combatContext,
      updatedAt: Number(saved.updatedAt) || Date.now(),
      name: typeof saved.name === "string" ? saved.name.slice(0, 80) : undefined,
    };
  }

  return result;
}

export function normalizeInventory(value: unknown): InventoryBuilds | null {
  if (Array.isArray(value)) {
    const migrated: InventoryBuilds = {};
    for (const id of value) {
      if (typeof id === "string" && monsterById.has(id)) migrated[id] = makeBuild(id);
    }
    return migrated;
  }

  if (!value || typeof value !== "object") return null;
  const result: InventoryBuilds = {};
  for (const [id, saved] of Object.entries(value)) {
    const monsterId = copyMonsterId(id);
    if (!monsterById.has(monsterId) || !saved || typeof saved !== "object") continue;
    result[id] = { ...sanitizeBuild(saved as Partial<Build>, monsterId), inventoryCopyId: id };
  }
  return result;
}

export function normalizeGoal(value: unknown): TeamGoal {
  return typeof value === "string" && ["damage", "balanced", "survivability", "support"].includes(value)
    ? value as TeamGoal : "balanced";
}

// Read each key independently: a broken draft must never erase a valid inventory
// or preset collection. The caller must not overwrite keys listed as blocked.
export function loadTeamStorage(storage: Pick<Storage, "getItem">) {
  const blockedKeys: string[] = [];
  const read = <T,>(key: string, fallback: T, normalize: (value: unknown) => T | null): T => {
    try {
      const raw = storage.getItem(key);
      if (raw === null) return fallback;
      const normalized = normalize(JSON.parse(raw));
      if (normalized === null) throw new Error("Invalid saved data");
      return normalized;
    } catch {
      blockedKeys.push(key);
      return fallback;
    }
  };
  const session = read(TEAM_STORAGE_KEY, { builds: defaultTeam(), goal: "balanced" as TeamGoal, combatContext: "standard" as TeamCombatContext }, (value) => {
    // Versions 1–9 saved just the build array.
    if (Array.isArray(value)) {
      const builds = normalizeTeam(value);
      return builds ? { builds, goal: "balanced" as TeamGoal, combatContext: "standard" as TeamCombatContext } : null;
    }
    if (!value || typeof value !== "object") return null;
    const saved = value as { builds?: unknown; goal?: unknown; combatContext?: unknown };
    const builds = normalizeTeam(saved.builds);
    return builds ? { builds, ...migrateGoalContext(saved.goal, saved.combatContext) } : null;
  });
  const inventory = read(INVENTORY_STORAGE_KEY, defaultInventory(), normalizeInventory);
  const presets = read(SAVED_TEAMS_STORAGE_KEY, {} as SavedTeams, (value) =>
    value && typeof value === "object" && !Array.isArray(value) ? normalizeSavedTeams(value) : null);
  return { team: session.builds, goal: session.goal, combatContext: session.combatContext, inventory, presets, blockedKeys };
}

export function mergeIndexProgress(current: InventoryBuilds, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid Index Tracker data");
  const inventory = { ...current };
  let imported = 0;
  for (const [monsterId, candidate] of Object.entries(value)) {
    if (!monsterById.has(monsterId) || !candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const entry = candidate as IndexTrackerProgress[string];
    if (!ranks.includes(entry.rank as Rank)) continue;
    // Tracker progress is historical. Import missing monsters only; never replace
    // a player's existing build with a highest-ever rank or historical mutation.
    if (current[monsterId]) continue;
    const mutations = (["huge", "shiny", "bloodlit", "fairy"] as const)
      .filter((id) => entry.bonuses?.[id] === true);
    inventory[monsterId] = sanitizeBuild({ ...makeBuild(monsterId), rank: entry.rank, mutations }, monsterId);
    imported += 1;
  }
  return { inventory, imported };
}

/** Use the exact passive de-duplication and transfer rules from Calculator Results. */
export function getEffectiveTeamPassives(monster: Monster, build: Build): MonsterPassive[] {
  const teamPassives = build.teammateMonsterIds.map((id) => id ? monsterById.get(id)?.passives : undefined);
  return mergeUniquePassives(monster.passives, ...teamPassives);
}

/** HP expressed as the amount of pre-mitigation damage the build can take.
 * General and encounter-specific incoming-damage modifiers belong to separate
 * categories and are multiplied, as in the calculator's category model.
 */
export function effectiveTeamHealth(monster: Monster, build: Build, health: number): number {
  if (health <= 0) return 0;
  const effects = getPassiveEffectTotals(getEffectiveTeamPassives(monster, build), {
    combatContext: build.combatContext,
    targetIsBoss: build.targetIsBoss,
    currentHpPercent: build.currentHpPercent,
  });
  const encounter = build.targetIsBoss ? effects.bossIncomingDamage
    : build.combatContext === "rift" ? effects.riftIncomingDamage
    : build.combatContext === "spire" ? effects.spireIncomingDamage
    : build.combatContext === "dungeon" ? effects.dungeonIncomingDamage : 0;
  const incomingFactor = Math.max(0.05, 1 + effects.incomingDamage / 100)
    * Math.max(0.05, 1 + encounter / 100);
  return health / incomingFactor;
}

export function monsterDps(monster: Monster, build: Build): number {
  const statData = getMonsterStatData(monster.id);
  if (!statData) return 0;
  const effectivePassives = getEffectiveTeamPassives(monster, build);
  const stats = calculateStats(statData, build, effectivePassives);
  if (!stats) return 0;

  return monster.skillIds.reduce((sum, skillId) => {
    const skill = getSkill(skillId);
    if (!skill) return sum;
    return sum + (calculateSkillSummary(monster, skill, stats, build, effectivePassives).dps ?? 0);
  }, 0);
}

export function buildSignature(build: Build): string {
  return JSON.stringify({
    level: build.level,
    rank: build.rank,
    enhancement: build.enhancement,
    damageGeneticPotential: build.damageGeneticPotential,
    healthGeneticPotential: build.healthGeneticPotential,
    mutations: [...build.mutations].sort(),
    traitId: build.traitId,
    weaponId: build.weaponId,
    armorId: build.armorId,
    weaponAttributeIds: build.weaponAttributeIds,
    armorAttributeIds: build.armorAttributeIds,
    evolutionPercent: build.evolutionPercent,
  });
}


export function getTeamRole(dps: number, health: number, supportCount: number, maxDps: number, maxHealth: number): string {
  if (supportCount >= 2 && (dps < maxDps * 0.92 || supportCount >= 3)) return "Support";
  if (health >= maxHealth * 0.9 && dps < maxDps * 0.85) return "Tank / Utility";
  if (dps >= maxDps * 0.9) return "Main DPS";
  return supportCount > 0 ? "Hybrid" : "Damage";
}

export function effectSummaryLabel(type: string): string {
  const labels: Record<string, string> = {
    damageIncrease: "Damage Buff",
    vulnerability: "Vulnerability",
    poison: "Poison",
    burn: "Burn",
    healing: "Healing",
    shield: "Shield",
    damageDecrease: "Attack Down",
    knockback: "Knockback",
    damageReduction: "Damage Reduction",
    damageReflection: "Reflection",
    stun: "Stun",
    taunt: "Taunt",
  };
  return labels[type] ?? type;
}

export function compactBuildLabel(build: Build): string {
  const mutationCount = build.mutations.length;
  return `Lv ${build.level} · ${build.rank ?? "E"} · +${build.enhancement}${mutationCount ? ` · ${mutationCount} mut.` : ""}`;
}

export function buildForGoal(build: Build, combatContext: TeamCombatContext): Build {
  return {
    ...build,
    targetIsBoss: combatContext === "boss",
    combatContext: combatContext === "boss" ? "standard" : combatContext,
  };
}

export function utilityWeights(monster: Monster): { total: number; offense: number; defense: number; labels: Record<string, number> } {
  const labels: Record<string, number> = {};
  let offense = 0;
  let defense = 0;

  for (const skillId of monster.skillIds) {
    const skill = getSkill(skillId);
    if (!skill) continue;
    for (const effect of skill.statusEffects ?? []) {
      const label = effectSummaryLabel(effect.type);
      labels[label] = (labels[label] ?? 0) + 1;

      if (effect.type === "vulnerability") offense += 1.35;
      else if (effect.type === "damageIncrease") offense += effect.target === "Team" ? 1.3 : 0.55;
      else if (effect.type === "burn" || effect.type === "poison") offense += 0.35;
      else if (effect.type === "stun") offense += 0.4;

      if (effect.type === "healing") defense += effect.target === "Team" ? 1.35 : 0.75;
      else if (effect.type === "shield") defense += effect.target === "Team" ? 1.3 : 0.7;
      else if (effect.type === "damageReduction") defense += effect.target === "Team" ? 1.25 : 0.7;
      else if (effect.type === "damageDecrease") defense += 0.9;
      else if (effect.type === "taunt") defense += 0.65;
      else if (effect.type === "damageReflection") defense += 0.3;
    }
  }

  const diversity = Object.keys(labels).length * 0.18;
  return { total: offense + defense + diversity, offense, defense, labels };
}

export function goalTitle(goal: TeamGoal): string {
  if (goal === "damage") return "Highest DPS Composition";
  if (goal === "survivability") return "Survivability Composition";
  if (goal === "support") return "Support Composition";
  return "Balanced Composition";
}

export function goalDescription(goal: TeamGoal): string {
  if (goal === "damage") return "Ranks candidate teams by calculated skill DPS only.";
  if (goal === "survivability") return "Prioritizes effective HP after active guard passives, plus defensive skill utility.";
  if (goal === "support") return "Prioritizes teams with broad buffs, debuffs, healing, shielding, and control without ignoring combat stats.";
  return "Balances calculated DPS, Health, and non-overlapping team utility.";
}

export function goalWeights(goal: TeamGoal) {
  if (goal === "damage") return { dps: 1, health: 0, utility: 0, offense: 0, defense: 0 };
  if (goal === "survivability") return { dps: 0.1, health: 0.64, utility: 0, offense: 0, defense: 0.26 };
  if (goal === "support") return { dps: 0.22, health: 0.2, utility: 0.58, offense: 0, defense: 0 };
  return { dps: 0.45, health: 0.32, utility: 0.23, offense: 0, defense: 0 };
}

export function signedPercent(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 0.0005) return "0%";
  return `${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

export function recommendTeams(inventoryBuilds: InventoryBuilds, account: Build["accountMultipliers"], goal: TeamGoal, combatContext: TeamCombatContext = "standard") {
  const ownedIds = Object.keys(inventoryBuilds);
    const ownedCandidates = ownedIds
      .map((id) => ({ id, monster: monsterById.get(copyMonsterId(id)) }))
      .filter((entry): entry is { id: string; monster: Monster } => Boolean(entry.monster))
      .map(({ id, monster }) => {
        const saved = inventoryBuilds[id] ?? makeBuild(monster.id);
        const baseBuild = buildForGoal(
          {
            ...saved,
            accountMultipliers: account,
            teammateMonsterIds: [null, null],
            evolutionPercent: monster.isEvolved ? saved.evolutionPercent : 100,
          },
          combatContext,
        );
        const statData = getMonsterStatData(monster.id);
        const stats = statData ? calculateStats(statData, baseBuild, getEffectiveTeamPassives(monster, baseBuild)) : null;
        const dps = monsterDps(monster, baseBuild);
        const utility = utilityWeights(monster);
        const encounterPassives = getPassiveEffectTotals(monster.passives ?? [], {
          combatContext: baseBuild.combatContext, targetIsBoss: baseBuild.targetIsBoss,
          currentHpPercent: baseBuild.currentHpPercent,
        });
        const encounterDamage = combatContext === "boss" ? encounterPassives.bossDamage
          : combatContext === "rift" ? encounterPassives.riftDamage
          : combatContext === "spire" ? encounterPassives.spireDamage
          : combatContext === "dungeon" ? encounterPassives.dungeonDamage : 0;
        return {
          monster,
          savedBuild: saved,
          dps,
          health: stats?.health ?? 0,
          effectiveHealth: effectiveTeamHealth(monster, baseBuild, stats?.health ?? 0),
          encounterDamage,
          utility,
        };
      });

    if (ownedCandidates.length === 0) return null;

    const maxIndividualDps = Math.max(1, ...ownedCandidates.map((item) => item.dps));
    const maxIndividualHealth = Math.max(1, ...ownedCandidates.map((item) => item.effectiveHealth));
    const maxIndividualUtility = Math.max(1, ...ownedCandidates.map((item) => item.utility.total));

    const roughScore = (item: (typeof ownedCandidates)[number]) => {
      const dps = item.dps / maxIndividualDps;
      const health = item.effectiveHealth / maxIndividualHealth;
      const utility = item.utility.total / maxIndividualUtility;
      if (goal === "damage") return dps;
      if (goal === "survivability") return health * 0.67 + utility * 0.25 + dps * 0.08;
      if (goal === "support") return utility * 0.65 + dps * 0.2 + health * 0.15;
      return dps * 0.48 + health * 0.32 + utility * 0.2;
    };

    // Preserve encounter specialists even if their level-one base stats are
    // smaller than generalists. A transferable +Rift/Tower Damage passive can
    // raise all three members' DPS, and Guard can raise all three members' eHP.
    const statLeaders = [...ownedCandidates].sort((a, b) => roughScore(b) - roughScore(a)).slice(0, 16);
    const utilityLeaders = [...ownedCandidates].sort((a, b) => b.utility.total - a.utility.total).slice(0, 6);
    const encounterDamageLeaders = combatContext === "standard" ? [] : [...ownedCandidates]
      .filter((item) => item.encounterDamage > 0)
      .sort((a, b) => b.encounterDamage - a.encounterDamage).slice(0, 2);
    const guardLeaders = [...ownedCandidates]
      .filter((item) => item.effectiveHealth > item.health * 1.001)
      .sort((a, b) => (b.effectiveHealth / Math.max(1, b.health)) - (a.effectiveHealth / Math.max(1, a.health)))
      .slice(0, 2);
    const poolMap = new Map<string, (typeof ownedCandidates)[number]>();
    [...statLeaders, ...utilityLeaders, ...encounterDamageLeaders, ...guardLeaders].forEach((item) => poolMap.set(item.savedBuild.inventoryCopyId ?? item.monster.id, item));
    const pool = [...poolMap.values()];
    const targetSize = Math.min(3, pool.length);

    const combinations: Array<Array<(typeof pool)[number]>> = [];
    const choose = (startIndex: number, selected: Array<(typeof pool)[number]>) => {
      if (selected.length === targetSize) {
        combinations.push([...selected]);
        return;
      }
      for (let index = startIndex; index < pool.length; index += 1) {
        selected.push(pool[index]);
        choose(index + 1, selected);
        selected.pop();
      }
    };
    choose(0, []);

    const evaluated = combinations.map((members) => {
      const memberIds = members.map((item) => item.monster.id);
      const resolvedMembers = members.map((item, memberIndex) => {
        const teammateIds = memberIds.filter((_, index) => index !== memberIndex);
        const build = buildForGoal(
          {
            ...item.savedBuild,
            accountMultipliers: account,
            teammateMonsterIds: [teammateIds[0] ?? null, teammateIds[1] ?? null],
            evolutionPercent: item.monster.isEvolved ? item.savedBuild.evolutionPercent : 100,
          },
          combatContext,
        );
        const statData = getMonsterStatData(item.monster.id);
        const stats = statData ? calculateStats(statData, build, getEffectiveTeamPassives(item.monster, build)) : null;
        const dps = monsterDps(item.monster, build);
        const utility = utilityWeights(item.monster);
        return { monster: item.monster, build, dps, health: stats?.health ?? 0, effectiveHealth: effectiveTeamHealth(item.monster, build, stats?.health ?? 0), damage: stats?.damage ?? 0, utility };
      });

      const utilityLabels: Record<string, number> = {};
      let offenseUtility = 0;
      let defenseUtility = 0;
      let rawUtility = 0;
      for (const member of resolvedMembers) {
        offenseUtility += member.utility.offense;
        defenseUtility += member.utility.defense;
        rawUtility += member.utility.total;
        for (const [label, count] of Object.entries(member.utility.labels)) {
          utilityLabels[label] = (utilityLabels[label] ?? 0) + count;
        }
      }

      // Reward coverage, but use diminishing returns for duplicates so three monsters
      // with the same debuff do not automatically beat a more complete composition.
      const diversityBonus = Object.keys(utilityLabels).length * 0.45;
      const duplicatePenalty = Object.values(utilityLabels).reduce((sum, count) => sum + Math.max(0, count - 1) * 0.18, 0);
      const utilityScore = Math.max(0, rawUtility + diversityBonus - duplicatePenalty);

      return {
        members: resolvedMembers,
        totalDps: resolvedMembers.reduce((sum, member) => sum + member.dps, 0),
        totalHealth: resolvedMembers.reduce((sum, member) => sum + member.health, 0),
        totalEffectiveHealth: resolvedMembers.reduce((sum, member) => sum + member.effectiveHealth, 0),
        utilityScore,
        offenseUtility,
        defenseUtility,
        utilityLabels,
      };
    });

    const maxDps = Math.max(1, ...evaluated.map((team) => team.totalDps));
    const maxHealth = Math.max(1, ...evaluated.map((team) => team.totalEffectiveHealth));
    const maxUtility = Math.max(1, ...evaluated.map((team) => team.utilityScore));
    const maxOffenseUtility = Math.max(1, ...evaluated.map((team) => team.offenseUtility));
    const maxDefenseUtility = Math.max(1, ...evaluated.map((team) => team.defenseUtility));

    const weights = goalWeights(goal);
    const scored = evaluated.map((team) => {
      const dps = team.totalDps / maxDps;
      const health = team.totalEffectiveHealth / maxHealth;
      const utility = team.utilityScore / maxUtility;
      const offense = team.offenseUtility / maxOffenseUtility;
      const defense = team.defenseUtility / maxDefenseUtility;
      const score =
        dps * weights.dps +
        health * weights.health +
        utility * weights.utility +
        offense * weights.offense +
        defense * weights.defense;
      return {
        ...team,
        score,
        normalized: { dps, health, utility, offense, defense },
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best) return null;

    const bestDps = Math.max(1, ...best.members.map((member) => member.dps));
    const bestHealth = Math.max(1, ...best.members.map((member) => member.effectiveHealth));
    const memberReasons = best.members.map((member) => {
      const reasons: string[] = [];
      const teamDpsShare = best.totalDps > 0 ? member.dps / best.totalDps : 0;
      if (member.dps >= bestDps * 0.95) reasons.push(`Top DPS · ${Math.round(teamDpsShare * 100)}% of team`);
      if (member.effectiveHealth >= bestHealth * 0.95) reasons.push("Highest effective HP");
      if (member.effectiveHealth > member.health * 1.001) reasons.push("Active guard / damage resistance");

      const utilityLabels = Object.entries(member.utility.labels)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([label]) => label);
      if (utilityLabels.length) reasons.push(utilityLabels.join(" + "));
      if (!reasons.length) reasons.push("Strong overall fit for this goal");
      return { monsterId: member.monster.id, reasons };
    });

    const alternatives = scored.slice(1, 3).map((alternative) => {
      const bestIds = new Set(best.members.map((member) => member.monster.id));
      const altIds = new Set(alternative.members.map((member) => member.monster.id));
      const removed = best.members.filter((member) => !altIds.has(member.monster.id)).map((member) => member.monster.name);
      const added = alternative.members.filter((member) => !bestIds.has(member.monster.id)).map((member) => member.monster.name);
      const gainedUtility = Object.keys(alternative.utilityLabels).filter((label) => !best.utilityLabels[label]);
      const lostUtility = Object.keys(best.utilityLabels).filter((label) => !alternative.utilityLabels[label]);
      return {
        ...alternative,
        swapLabel: removed.length || added.length
          ? `${removed.length ? `Replace ${removed.join(" + ")}` : "Change team"}${added.length ? ` with ${added.join(" + ")}` : ""}`
          : "Same core composition",
        dpsDelta: best.totalDps > 0 ? (alternative.totalDps - best.totalDps) / best.totalDps : 0,
        healthDelta: best.totalEffectiveHealth > 0 ? (alternative.totalEffectiveHealth - best.totalEffectiveHealth) / best.totalEffectiveHealth : 0,
        gainedUtility,
        lostUtility,
      };
    });

    return {
      ...best,
      scorePercent: Math.round(best.score * 100),
      weights,
      memberReasons,
      alternatives,
    };
}
