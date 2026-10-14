import { ARMORS, WEAPONS, getEquipment } from "../data/equipments";
import { getAttributesForGear, getAttribute } from "../data/attributes";
import { TRAITS, getTrait } from "../data/traits";
import { monsters } from "../data/monsters";
import { mergeUniquePassives, getTransferablePassiveFromTeammate } from "../data/passives";
import { getSkill, getActiveEnemyVulnerability, getActiveRallyingWarCryDamageIncrease } from "../data/skills";
import { getMonsterStatData } from "../data/monster-stats";
import type { Build, Mutation } from "../types/build";
import type { Monster } from "../types/monster";
import { hasFixedBreeding, applyBreedingLimits } from "./breeding-limits";
import { withTeamDungeonLevel } from "./team-dungeon-level";
import { buildForCombatMode } from "./combat-mode-build";
import { CURRENT_MAX_LEVEL } from "./level-config";
import { MAX_EVOLUTION_PERCENT } from "./calculations/evolution";
import { calculateStats } from "./calculations/stats";
import { calculateSkillSummary } from "./calculations/skill-summary";
import { calculateCombatDamage } from "./calculations/combat";
import { calculateSkillAttributeEffects, getAttributeSlotCount, getFixedAttributeIds } from "./calculations/attributes";
import { getPassiveEffectTotals } from "./calculations/passive-effects";
import { getTraitEffectValue } from "./calculations/traits";
import { MUTATION_EFFECTS, getMutationCooldownMultiplier, getMutationIncomingDamageReduction } from "./calculations/mutations";

export const RECOMMENDATION_GOALS = ["General", "DPS", "Boss", "Dungeon", "Spire", "Farming", "PvP", "Survivability", "Support/Healing"] as const;
export type RecommendationGoal = typeof RECOMMENDATION_GOALS[number];
export type BuildMetrics = { damage: number; health: number; dps: number; effectiveHealth: number; healing: number; shielding: number; utility: number };
export type BuildCandidate = { build: Build; metrics: BuildMetrics; score: number };
export type RecommendationPart = "weapon" | "armor" | "trait" | "mutation";
export const MUTATION_ICONS: Record<Mutation, string> = { huge: "/icons/Huge.png", shiny: "/icons/Shiny.png", bloodlit: "/icons/Bloodlit.png", fairy: "/icons/Fairy.png", "huge-x": "/icons/huge-x.png", "shiny-x": "/icons/shiny-x.png", "bloodlit-x": "/icons/bloodlit-x.png", "fairy-x": "/icons/fairy-x.png" };

// Goal previews use the same encounter and dungeon level rules as Build Editor.
export function recommendationContext(build: Build, goal: RecommendationGoal): Build {
    if (goal === "PvP") return buildForCombatMode(build, "pvp");
    const context = goal === "Dungeon" ? "dungeon" : goal === "Spire" ? "spire" : goal === "Boss" || goal === "General" ? "standard" : build.combatContext;
    const targetIsBoss = goal === "Boss" ? true : goal === "Dungeon" || goal === "Spire" || goal === "General" ? false : build.targetIsBoss;
    return withTeamDungeonLevel({ ...build, combatContext: context, targetIsBoss }, context === "dungeon");
}

export function hasBurnPoisonSource(monster: Monster, teammateIds: Build["teammateMonsterIds"]): boolean {
    return [monster, ...teammateIds.map(id => monsters.find(m => m.id === id))].some(source => source?.skillIds.some(id =>
        getSkill(id)?.statusEffects?.some(effect => (effect.type === "burn" || effect.type === "poison") && effect.target === "Enemy" && !effect.condition && (effect.chancePercent ?? 100) > 0)));
}

/** Only turn on modeled skill conditions when this lineup provides them. */
export function withRecommendationTeamConditions(monster: Monster, build: Build): Build {
    const teammateSkills = build.teammateMonsterIds.map(id => monsters.find(m => m.id === id)?.skillIds ?? []);
    const targetStatused = hasBurnPoisonSource(monster, build.teammateMonsterIds);
    return { ...build, targetStatused,
        traitId: build.traitId === "fragility-status" && !targetStatused ? hasFixedBreeding(monster.id) ? null : "impair-4" : build.traitId,
        rallyingWarCryActive: getActiveRallyingWarCryDamageIncrease(monster.skillIds, teammateSkills) > 0,
        vulnerabilityActive: getActiveEnemyVulnerability(monster.skillIds, teammateSkills) > 0 };
}

export function evaluateRecommendation(monster: Monster, original: Build): BuildMetrics | null {
    const build = applyBreedingLimits(original, monster.id);
    const passives = mergeUniquePassives(monster.passives, ...build.teammateMonsterIds.map(id => monsters.find(m => m.id === id)?.passives));
    const stats = calculateStats(getMonsterStatData(monster.id), build, passives);
    if (!stats) return null;
    let dps = 0, healing = 0, shielding = 0, utility = 0, shieldUptime = 0;
    const trait = (type: Parameters<typeof getTraitEffectValue>[1]) => getTraitEffectValue(build.traitId, type);
    for (const id of monster.skillIds) {
        const skill = getSkill(id);
        if (!skill) continue;
        const summary = calculateSkillSummary(monster, skill, stats, build, passives);
        dps += summary.dps ?? 0;
        if (!summary.cooldown || summary.cooldown <= 0) continue;
        const attributes = calculateSkillAttributeEffects(build, skill.element);
        // Conditional effects without modeled uptime are excluded from steady-state output.
        for (const effect of skill.statusEffects ?? []) {
            if (effect.condition) continue;
            const chance = (effect.chancePercent ?? 100) / 100;
            const amount = (effect.amountPercent ?? 0) / 100 * chance;
            const base = effect.scaling === "Damage" ? stats.damage : stats.health;
            if (effect.type === "healing" && effect.scaling) healing += base * amount * (1 + (attributes.healEffectiveness + trait("healingEffectiveness")) / 100) / summary.cooldown;
            if (effect.type === "shield" && effect.scaling) shielding += base * amount * (1 + attributes.shieldEffectiveness / 100) / summary.cooldown;
            const uptime = Math.min(1, (effect.durationSeconds ?? 0) / summary.cooldown);
            if (effect.type === "damageDecrease") utility += amount * uptime * (1 + trait("attackReductionEffectiveness") / 100);
            if (effect.type === "vulnerability") utility += amount * uptime * (1 + trait("vulnerabilityEffectiveness") / 100);
            if (effect.type === "damageIncrease" || effect.type === "damageReduction") utility += amount * uptime;
        }
        // Vital Barrier does not stack; use the fastest cast for its six-second uptime.
        shieldUptime = Math.max(shieldUptime, Math.min(1, 6 / summary.cooldown));
        // Life Siphon uses normal-hit damage, as in Calculator Results. Healing Pulse
        // is added once below and is deliberately unaffected by Grace.
        if (summary.normalDamage != null) healing += summary.normalDamage * attributes.lifeSteal / 100 * (1 + trait("healingEffectiveness") / 100) / summary.cooldown;
    }
    const attributes = calculateSkillAttributeEffects(build, "Common");
    healing += stats.health * attributes.maxHpRegenPerSecond / 100;
    const effects = getPassiveEffectTotals(passives, build);
    const generalReduction = Math.max(0.05, 1 + effects.incomingDamage / 100);
    const encounterReduction = (build.targetIsBoss ? Math.max(0.05, 1 + effects.bossIncomingDamage / 100) : 1)
        * Math.max(0.05, 1 + (build.combatContext === "dungeon" ? effects.dungeonIncomingDamage : build.combatContext === "spire" ? effects.spireIncomingDamage : build.combatContext === "rift" ? effects.riftIncomingDamage : 0) / 100);
    const mitigation = generalReduction * encounterReduction
        * (1 - getMutationIncomingDamageReduction(build.mutations) / 100)
        * Math.max(0.05, 1 - trait("damageReduction") / 100)
        * Math.max(0.05, 1 - trait("dodgeChance") / 100);
    const effectiveHealth = (stats.health + stats.health * trait("postCastShield") / 100 * shieldUptime) / mitigation;
    const damage = calculateCombatDamage({ monster, baseDamage: stats.damage, critMultiplier: stats.critMultiplier, passives, ...build }).normalDamage;
    return { damage, health: stats.health, dps, effectiveHealth, healing, shielding, utility };
}

export function recommendationScore(metrics: BuildMetrics, baseline: BuildMetrics, goal: RecommendationGoal): number {
    const ratio = (key: keyof BuildMetrics) => Math.log((metrics[key] + 1) / (baseline[key] + 1));
    const output = baseline.dps > 0 ? ratio("dps") : ratio("damage");
    const recovery = Math.log(1 + (metrics.healing + metrics.shielding) / Math.max(1, baseline.health)) - Math.log(1 + (baseline.healing + baseline.shielding) / Math.max(1, baseline.health));
    if (goal === "DPS" || goal === "Boss" || goal === "Farming") return output;
    if (goal === "Survivability") return ratio("effectiveHealth") * 0.85 + recovery * 0.15;
    if (goal === "Support/Healing") return recovery * 0.65 + (metrics.utility - baseline.utility) * 0.25 + ratio("effectiveHealth") * 0.1;
    return output * 0.65 + ratio("effectiveHealth") * 0.3 + recovery * 0.05;
}

function candidateKey(build: Build) {
    return JSON.stringify([build.level, build.enhancement, build.healthGeneticPotential, build.damageGeneticPotential, build.evolutionPercent, build.weaponId, build.armorId, build.weaponAttributeIds, build.armorAttributeIds, build.traitId, build.mutations, build.teammateMonsterIds, build.targetStatused, build.rallyingWarCryActive, build.vulnerabilityActive]);
}

// Without an enemy damage profile, do not claim universal incoming damage
// reduction. Prefer broad, unconditional resistance coverage when modeled
// output otherwise ties, instead of picking the first element in the CSV.
function broadResistance(build: Build): number {
    return [...getFixedAttributeIds(build.armorId), ...build.armorAttributeIds].map(getAttribute)
        .reduce((sum, attribute) => sum + (attribute?.effectType === "skill_resistance" && !attribute.skillElement && !attribute.hpCondition ? attribute.value : 0), 0);
}

export function maximizeRecommendation(build: Build): Build {
    return applyBreedingLimits({ ...build, level: build.combatContext === "dungeon" && build.combatMode !== "pvp" ? 60 : CURRENT_MAX_LEVEL,
        preDungeonLevel: build.combatContext === "dungeon" ? CURRENT_MAX_LEVEL : null,
        enhancement: 10, healthGeneticPotential: 60, damageGeneticPotential: 60,
        evolutionPercent: monsters.find(monster => monster.id === build.monsterId)?.isEvolved ? MAX_EVOLUTION_PERCENT : 100 }, build.monsterId);
}

export function recommendBuilds(monster: Monster, saved: Build, goal: RecommendationGoal, allowX: boolean) {
    const current = recommendationContext(applyBreedingLimits(saved, monster.id), goal);
    const baseline = evaluateRecommendation(monster, current);
    if (!baseline) return null;
    const maximum = withRecommendationTeamConditions(monster, maximizeRecommendation(current));
    const scoringBaseline = evaluateRecommendation(monster, maximum)!;
    const cache = new Map<string, BuildCandidate>();
    const assess = (build: Build): BuildCandidate => {
        build = withRecommendationTeamConditions(monster, build);
        const key = candidateKey(build);
        const cached = cache.get(key);
        if (cached) return cached;
        const metrics = evaluateRecommendation(monster, build)!;
        const result = { build, metrics, score: recommendationScore(metrics, scoringBaseline, goal) };
        cache.set(key, result);
        return result;
    };
    const top = (items: BuildCandidate[], count: number) => [...new Map(items.map(item => [candidateKey(item.build), item])).values()]
        .sort((a, b) => b.score - a.score || b.metrics.dps - a.metrics.dps || b.metrics.effectiveHealth - a.metrics.effectiveHealth || broadResistance(b.build) - broadResistance(a.build)).slice(0, count);
    const baseMutations: Mutation[] = ["huge", "shiny", "bloodlit", "fairy"];
    const mutationSets: Mutation[][] = [[], ...baseMutations.map(m => [m])];
    // Stacking all four is valid. Never combine a normal mutation with its X variant.
    mutationSets.push(baseMutations);
    if (allowX) mutationSets.push(...baseMutations.map(m => [`${m}-x` as Mutation]), baseMutations.map(m => `${m}-x` as Mutation));
    const mutationChoices = (build: Build) => mutationSets.map(mutations => assess({ ...build, mutations }));
    const traitChoices = (build: Build) => [null, ...(hasFixedBreeding(monster.id) ? [] : TRAITS.filter(t => t.id !== "fragility-status" || hasBurnPoisonSource(monster, build.teammateMonsterIds)).map(t => t.id))].map(traitId => assess({ ...build, traitId }));

    // Keep representatives for distinct transferable effects, including encounter
    // specialists and status providers. Search pairs after ranking each solo pick.
    const representatives = new Map<string, Monster>();
    for (const teammate of monsters) {
        if (teammate.id === monster.id) continue;
        const transferable = (teammate.passives ?? []).map(getTransferablePassiveFromTeammate).filter(p => p != null);
        const relevantSkills = teammate.skillIds.flatMap(id => (getSkill(id)?.statusEffects ?? []).filter(effect => ["burn", "poison", "vulnerability", "damageIncrease"].includes(effect.type)));
        if (!transferable.length && !relevantSkills.length) continue;
        const signature = JSON.stringify([transferable, relevantSkills]);
        if (!representatives.has(signature)) representatives.set(signature, teammate);
    }
    const withTeam = (build: Build, ids: Build["teammateMonsterIds"]) => {
        const contextual = withRecommendationTeamConditions(monster, { ...build, teammateMonsterIds: ids });
        // Compare the two damage traits whenever a new lineup adds/removes a
        // status supplier, so Fragility can compete with passive-only teammates.
        const choices = [assess(contextual)];
        if (!hasFixedBreeding(monster.id)) {
            choices.push(assess({ ...contextual, traitId: "impair-4" }));
            if (contextual.targetStatused) choices.push(assess({ ...contextual, traitId: "fragility-status" }));
        }
        return top(choices, 1)[0];
    };
    const soloTeams = [...representatives.values()].map(teammate => withTeam(maximum, [teammate.id, null]));
    const teammatePool = [...new Set([
        ...top(soloTeams, 8),
        ...[...soloTeams].sort((a, b) => b.metrics.dps - a.metrics.dps).slice(0, 4),
        ...[...soloTeams].sort((a, b) => b.metrics.effectiveHealth - a.metrics.effectiveHealth).slice(0, 4),
    ].map(candidate => candidate.build.teammateMonsterIds[0]).filter((id): id is string => id != null))];
    const teamChoices = (build: Build) => {
        const choices = [withTeam(build, [null, null]), withTeam(build, build.teammateMonsterIds)];
        for (let i = 0; i < teammatePool.length; i++) {
            choices.push(withTeam(build, [teammatePool[i], null]));
            for (let j = i + 1; j < teammatePool.length; j++) choices.push(withTeam(build, [teammatePool[i], teammatePool[j]]));
        }
        return top(choices, 3);
    };
    const gearChoices = (build: Build, type: "weapon" | "armor") => {
        const idKey = type === "weapon" ? "weaponId" : "armorId";
        const attrsKey = type === "weapon" ? "weaponAttributeIds" : "armorAttributeIds";
        return [null, ...(type === "weapon" ? WEAPONS : ARMORS)].flatMap(gear => {
            const equipped = { ...build, [idKey]: gear?.id ?? null, [attrsKey]: [] };
            const slots = getAttributeSlotCount(gear?.rarity, gear?.id ?? null);
            if (!slots) return [assess(equipped)];
            const fixed = getFixedAttributeIds(gear!.id);
            const singles = getAttributesForGear(type).filter(a => !fixed.includes(a.id)).map(a => assess({ ...equipped, [attrsKey]: [a.id] }));
            const leaders = top(singles, 6);
            const choices = [assess(equipped), ...leaders];
            if (slots > 1) for (let i = 0; i < leaders.length; i++) for (let j = i + 1; j < leaders.length; j++) {
                choices.push(assess({ ...equipped, [attrsKey]: [leaders[i].build[attrsKey][0], leaders[j].build[attrsKey][0]] }));
            }
            return top(choices, 2);
        });
    };
    let bestParts = {
        weapon: top([assess(maximum), ...gearChoices(maximum, "weapon")], 1)[0],
        armor: top([assess(maximum), ...gearChoices(maximum, "armor")], 1)[0],
        trait: top([assess(maximum), ...traitChoices(maximum)], 1)[0],
        mutation: top(mutationChoices(maximum).filter(c => c.build.mutations.length <= 1), 1)[0],
    };
    // A small beam searches interactions across traits, mutations and both gear
    // slots. This is a shortlist search, not a claim of exhaustive global optimality.
    let beam = [assess(maximum)];
    for (let pass = 0; pass < 2; pass++) {
        beam = top(beam.flatMap(c => [c, ...traitChoices(c.build)]), 3);
        beam = top(beam.flatMap(c => [c, ...mutationChoices(c.build)]), 3);
        beam = top(beam.flatMap(c => [c, ...gearChoices(c.build, "weapon")]), 3);
        beam = top(beam.flatMap(c => [c, ...gearChoices(c.build, "armor")]), 3);
        beam = top(beam.flatMap(c => [c, ...teamChoices(c.build)]), 3);
    }
    // Alternatives change gear, trait or mutations, rather than only swapping
    // two equivalent rolls on the same item.
    const distinct = new Set<string>();
    const builds = top([...cache.values()], cache.size).filter(candidate => {
        const key = JSON.stringify([candidate.build.weaponId, candidate.build.armorId, candidate.build.traitId, candidate.build.mutations, candidate.build.teammateMonsterIds]);
        if (distinct.has(key)) return false;
        distinct.add(key);
        return true;
    }).slice(0, 3);
    const optimizedTeam = withRecommendationTeamConditions(monster, { ...maximum, teammateMonsterIds: builds[0].build.teammateMonsterIds });
    bestParts = {
        weapon: top([assess(optimizedTeam), ...gearChoices(optimizedTeam, "weapon")], 1)[0],
        armor: top([assess(optimizedTeam), ...gearChoices(optimizedTeam, "armor")], 1)[0],
        trait: top([assess(optimizedTeam), ...traitChoices(optimizedTeam)], 1)[0],
        mutation: top(mutationChoices(optimizedTeam).filter(c => c.build.mutations.length <= 1), 1)[0],
    };
    return { current: { build: current, metrics: baseline, score: 0 }, parts: bestParts, builds, evaluated: cache.size };
}

export function recommendationReason(build: Build, part?: RecommendationPart): string {
    if (part === "trait") return getTrait(build.traitId)?.effects.map(e => e.description).join(" · ") ?? "This monster cannot use traits, or no trait improves this goal.";
    if (part === "mutation") return build.mutations.map(mutation => {
        const effects = MUTATION_EFFECTS[mutation];
        if (mutation.startsWith("fairy")) return `${Math.round((1 - getMutationCooldownMultiplier([mutation])) * 100)}% shorter cooldown · ${getMutationIncomingDamageReduction([mutation])}% less incoming damage; no raw HP or damage bonus.`;
        if (mutation.startsWith("huge")) return `+${Math.round((effects.healthMultiplier - 1) * 100)}% HP and damage; no cooldown or crit bonus.`;
        if (mutation.startsWith("shiny")) return `+${Math.round((effects.damageMultiplier - 1) * 100)}% damage · +${effects.critChanceBonus}% crit chance; reduced benefit near the crit cap.`;
        return `+${effects.critChanceBonus}% crit chance · ${effects.critMultiplier}× critical damage; benefit depends on your existing crit chance.`;
    }).join(" · ") || "No single mutation improves the selected goal.";
    const ids = part === "weapon" ? [build.weaponId] : part === "armor" ? [build.armorId] : [build.weaponId, build.armorId];
    return ids.flatMap(id => {
        const gear = getEquipment(id);
        if (!gear) return [];
        const selected = gear.type === "weapon" ? build.weaponAttributeIds : build.armorAttributeIds;
        return [`${gear.name}: ${gear.percentage}% ${gear.type === "weapon" ? "ATK" : "HP"}`, ...[...getFixedAttributeIds(gear.id), ...selected].map(id => getAttribute(id)).filter(a => a != null).map(a => `${a.name} (${a.value}${a.effectType === "damage_immunity" ? "s" : "%"}${a.hpCondition ? `, HP ${a.hpCondition}%` : ""})`)];
    }).join(" · ");
}

export function applyRecommendation(current: Build, recommended: Build, part?: RecommendationPart): Build {
    const conditions = { combatContext: recommended.combatContext, targetIsBoss: recommended.targetIsBoss,
        targetStatused: recommended.targetStatused, rallyingWarCryActive: recommended.rallyingWarCryActive,
        vulnerabilityActive: recommended.vulnerabilityActive, teammateMonsterIds: [...recommended.teammateMonsterIds] as Build["teammateMonsterIds"] };
    let next = { ...current, ...conditions };
    next = withTeamDungeonLevel(next, next.combatContext === "dungeon");
    next = { ...next, level: recommended.level, preDungeonLevel: recommended.preDungeonLevel,
        enhancement: recommended.enhancement, evolutionPercent: recommended.evolutionPercent, healthGeneticPotential: recommended.healthGeneticPotential,
        damageGeneticPotential: recommended.damageGeneticPotential };
    if (!part || part === "weapon") next = { ...next, weaponId: recommended.weaponId, weaponAttributeIds: [...recommended.weaponAttributeIds] };
    if (!part || part === "armor") next = { ...next, armorId: recommended.armorId, armorAttributeIds: [...recommended.armorAttributeIds] };
    if (!part || part === "trait") next = { ...next, traitId: recommended.traitId };
    if (!part || part === "mutation") next = { ...next, mutations: [...recommended.mutations] };
    return applyBreedingLimits(next, next.monsterId);
}
