import type { Skill, SkillStatusEffect } from "../types/skill";
import type { MonsterPassive } from "../types/build";

/**
 * A transparent composition heuristic, NOT a predicted win rate, simulated combat
 * result, or an in-game statistic. Scores useful shared effects, conditional
 * encounter passives and smaller amounts of self-sustain that round out a team.
 * Direct teammate-passive changes are supplied by the existing calculator engine.
 */
export type SynergyMember = {
  id: string;
  name: string;
  skills: Skill[];
  passives?: MonsterPassive[];
  dps: number;
  effectiveHealth: number;
  soloDps: number;
  soloEffectiveHealth: number;
  /** Fragility - Burn/Poison Damage, not generic vulnerability Fragility. */
  statusDamagePercent?: number;
};

export type SynergyCategory = {
  key: "passives" | "offense" | "defense" | "control" | "combos";
  label: string;
  score: number;
  max: number;
  details: string[];
};

export type TeamSynergy = {
  score: number;
  categories: SynergyCategory[];
  summary: string;
};

type OfferedEffect = {
  provider: string;
  providerName: string;
  skillId: string;
  effect: SkillStatusEffect;
  strength: number;
  reliability: number;
};

const limits = { passives: 20, offense: 25, defense: 15, control: 15, combos: 25 } as const;
const cap = (x: number, max: number) => Math.max(0, Math.min(max, x));
const percent = (value: number) => `${Math.round(value * 100)}%`;
const numeric = (value: number | undefined) => typeof value === "number" && Number.isFinite(value) ? value : 0;
const positive = (value: number | undefined) => Math.max(0, numeric(value));

/** Treat missing effect numbers as unknown, not as a made-up 20% bonus. */
function strength(effect: SkillStatusEffect): number {
  const reported = positive(effect.amountPercent);
  if (reported) return Math.min(reported, 100);
  if (effect.maxAmountPercent) return Math.min(positive(effect.maxAmountPercent), 100) * 0.5;
  return 0;
}

/** Conservative availability proxy. This does NOT simulate rotations/uptime. */
function reliability(effect: SkillStatusEffect, cooldown: number | null): number {
  const chance = cap(effect.chancePercent == null ? 1 : effect.chancePercent / 100, 1);
  const duration = positive(effect.durationSeconds);
  const interval = cooldown != null && cooldown > 0 ? cooldown : 8;
  const uptime = duration > 0 ? Math.min(1, duration / interval) : 0.45;
  const conditional = effect.condition ? 0.65 : 1;
  return chance * uptime * conditional;
}

function memberEffects(members: SynergyMember[]): OfferedEffect[] {
  return members.flatMap((member) => member.skills.flatMap((skill) =>
    (skill.statusEffects ?? []).map((effect) => ({
      provider: member.id,
      providerName: member.name,
      skillId: skill.id,
      effect,
      strength: strength(effect),
      reliability: reliability(effect, skill.cooldown),
    })),
  ));
}

function byType(effects: OfferedEffect[], type: SkillStatusEffect["type"], target?: SkillStatusEffect["target"]): OfferedEffect[] {
  return effects.filter((offered) => offered.effect.type === type && (!target || offered.effect.target === target));
}

/** Repeated applications provide backup coverage, never another full bonus. */
function effectiveMagnitude(effects: OfferedEffect[], base: number, max: number): number {
  const candidates = effects.map((offered) =>
    (base === 0 ? 1 : cap(offered.strength / base, 1.5)) * offered.reliability,
  ).sort((a, b) => b - a);
  const [primary = 0, ...backups] = candidates;
  return cap(primary + backups.reduce((sum, value) => sum + value * 0.2, 0), max);
}

function category(key: SynergyCategory["key"], label: string, score: number, details: string[]): SynergyCategory {
  return { key, label, score: Math.round(cap(score, limits[key]) * 10) / 10, max: limits[key], details };
}

function ids(effects: OfferedEffect[]): Set<string> {
  return new Set(effects.filter((effect) => effect.reliability > 0).map((effect) => effect.provider));
}

function hasExternal(effects: OfferedEffect[], memberId: string): boolean {
  return effects.some((effect) => effect.provider !== memberId && effect.reliability > 0);
}

function separateProviders(a: OfferedEffect[], b: OfferedEffect[]): boolean {
  return a.some((left) => left.reliability > 0 && b.some((right) =>
    right.reliability > 0 && left.provider !== right.provider));
}

export function calculateTeamSynergy(
  members: SynergyMember[],
  combatContext: "standard" | "boss" | "rift" | "spire" | "dungeon" = "standard",
): TeamSynergy {
  const present = members.filter((member) => member.id);
  const empty = [
    category("passives", "Passives & encounter fit", 0, []),
    category("offense", "Offensive support", 0, []),
    category("defense", "Defense & sustain", 0, []),
    category("control", "Enemy control", 0, []),
    category("combos", "Combos & coverage", 0, []),
  ];
  if (present.length < 2) return { score: 0, categories: empty, summary: "Equip at least two monsters to evaluate team interactions." };

  const effects = memberEffects(present);
  const vulnerability = byType(effects, "vulnerability", "Enemy");
  const teamBuff = byType(effects, "damageIncrease", "Team");
  const teamHeal = byType(effects, "healing", "Team");
  const teamShield = byType(effects, "shield", "Team");
  const selfHeal = byType(effects, "healing", "Self");
  const selfShield = byType(effects, "shield", "Self");
  const teamReduction = byType(effects, "damageReduction", "Team");
  const enemyDecrease = byType(effects, "damageDecrease", "Enemy");
  const stun = byType(effects, "stun", "Enemy");
  const taunt = byType(effects, "taunt", "Enemy");
  const knockback = byType(effects, "knockback", "Enemy");
  const burn = byType(effects, "burn", "Enemy");
  const poison = byType(effects, "poison", "Enemy");
  const dots = [...burn, ...poison];

  // Relative lift compares exactly the same builds, encounter, and account
  // multipliers with versus without teammate passives. Self-only and duplicated
  // passives cannot score as team contributions.
  const soloDps = present.reduce((sum, member) => sum + positive(member.soloDps), 0);
  const teamDps = present.reduce((sum, member) => sum + positive(member.dps), 0);
  const soloHealth = present.reduce((sum, member) => sum + positive(member.soloEffectiveHealth), 0);
  const teamHealth = present.reduce((sum, member) => sum + positive(member.effectiveHealth), 0);
  const dpsLift = soloDps > 0 ? Math.max(0, (teamDps - soloDps) / soloDps) : 0;
  const healthLift = soloHealth > 0 ? Math.max(0, (teamHealth - soloHealth) / soloHealth) : 0;
  const recipients = present.filter((member) =>
    member.dps > member.soloDps * 1.001 || member.effectiveHealth > member.soloEffectiveHealth * 1.001,
  ).length;
  const passiveDetails: string[] = [];
  if (dpsLift > 0.001) passiveDetails.push(`Teammate passives: ${percent(dpsLift)} calculated team DPS lift.`);
  if (healthLift > 0.001) passiveDetails.push(`Teammate passives: ${percent(healthLift)} effective-HP lift.`);
  if (recipients) passiveDetails.push(`${recipients} member${recipients === 1 ? "" : "s"} benefit after passive stacking rules.`);
  const statByContext = {
    standard: null,
    boss: ["bossDamage", "bossIncomingDamage"],
    rift: ["riftDamage", "riftIncomingDamage"],
    spire: ["spireDamage", "spireIncomingDamage"],
    dungeon: ["dungeonDamage", "dungeonIncomingDamage"],
  }[combatContext];
  const encounterBonus = present.reduce((total, member) => {
    if (!statByContext) return total;
    const contributions = (member.passives ?? []).flatMap((passive) => passive.effects)
      .filter((effect) => statByContext.includes(effect.stat) && typeof effect.value === "number" && effect.value > 0);
    // Context-specific self-passives improve the team's fit for that encounter,
    // but never masquerade as shared passive lift or unconditional DPS.
    return total + Math.min(7, contributions.reduce((sum, effect) => sum + Number(effect.value) * .12, 0));
  }, 0);
  if (encounterBonus > 0) passiveDetails.push(`${combatContext === "spire" ? "Tower / Spire" : combatContext[0].toUpperCase() + combatContext.slice(1)} passives match this encounter (+${encounterBonus.toFixed(1)} estimated fit points).`);
  const passives = category("passives", "Passives & encounter fit", dpsLift * 52 + healthLift * 35 + (recipients > 1 ? 2 : 0) + encounterBonus, passiveDetails);

  const offenseDetails: string[] = [];
  const vul = effectiveMagnitude(vulnerability, 20, 1.25);
  const buff = effectiveMagnitude(teamBuff, 25, 1.25);
  const dot = cap((ids(burn).size ? 1.5 * Math.max(...burn.map((e) => e.reliability)) : 0)
    + (ids(poison).size ? 1.5 * Math.max(...poison.map((e) => e.reliability)) : 0), 3);
  if (vul > 0) offenseDetails.push(`Enemy Vulnerability from ${ids(vulnerability).size} member(s): ${vulnerability.length} source(s); stronger/more available effects matter most.`);
  if (buff > 0) offenseDetails.push("Team-wide damage buff benefits other monsters, not just its caster.");
  if (dot > 0) offenseDetails.push("Burn/Poison offer status coverage; duplicate casts have diminishing returns.");
  // A reliable 20% Vulnerability is valuable to the entire team even when no
  // on-paper teammate passive is present; sparse teams should not score ~10/100.
  const offense = category("offense", "Offensive support", vul * 18 + buff * 16 + dot * 2, offenseDetails);

  const shield = effectiveMagnitude(teamShield, 20, 1.25);
  const heal = effectiveMagnitude(teamHeal, 20, 1.25);
  const reduction = effectiveMagnitude(teamReduction, 25, 1.25);
  const decrease = effectiveMagnitude(enemyDecrease, 25, 1.25);
  const personalShield = effectiveMagnitude(selfShield, 20, 1.25);
  const personalHeal = effectiveMagnitude(selfHeal, 20, 1.25);
  const lastBlessing = present.reduce((sum, member) => sum + (member.passives ?? [])
    .filter((passive) => passive.id === "lastBlessing")
    .reduce((total, passive) => total + positive(passive.values?.[0]) / 100, 0), 0);
  // On-death restoration is a real ally benefit, but it is conditional and
  // must not be counted as permanent healing or effective HP.
  const deathHeal = cap(lastBlessing * 2.5, 3);
  const defenseDetails: string[] = [];
  if (deathHeal > 0) defenseDetails.push("Last Blessing can restore allies on death; counted conservatively, not as constant healing.");
  if (shield > 0) defenseDetails.push("Team shields protect teammates; amount and cooldown/duration inform the estimate.");
  if (heal > 0) defenseDetails.push("Team healing supports allies; self-only healing earns no team points.");
  if (personalShield > 0 || personalHeal > 0) defenseDetails.push("Self-only shielding/healing adds a small survival credit; it does not count as team-wide support.");
  if (reduction > 0 || decrease > 0) defenseDetails.push("Team damage reduction or enemy attack reduction supports survival.");
  const defense = category("defense", "Defense & sustain", shield * 12 + heal * 10 + reduction * 10 + decrease * 8
    + Math.min(8, personalShield * 12 + personalHeal * 5) + deathHeal, defenseDetails);

  const stunValue = effectiveMagnitude(stun, 0, 1.2);
  const tauntValue = effectiveMagnitude(taunt, 0, 1.2);
  const knockbackValue = effectiveMagnitude(knockback, 0, 1.2);
  const control = category("control", "Enemy control", stunValue * 27 + tauntValue * 10 + knockbackValue * 5, [
    ...(stunValue ? ["Stun creates an opening for other monsters."] : []),
    ...(tauntValue ? ["Taunt redirects enemy attention."] : []),
    ...(knockbackValue ? ["Knockback provides positioning control."] : []),
  ]);

  const combos: string[] = [];
  let comboValue = 0;
  const recordCombo = (condition: boolean, points: number, explanation: string) => {
    if (condition) { comboValue += points; combos.push(explanation); }
  };
  recordCombo(separateProviders(vulnerability, teamBuff), 4,
    "Different monsters supply Vulnerability and a team damage buff.");
  recordCombo(separateProviders(dots, vulnerability), 2,
    "One monster applies Burn/Poison while another applies Vulnerability.");
  recordCombo(separateProviders(stun, [...vulnerability, ...teamBuff]), 2,
    "Crowd control creates an opening for a teammate's offensive support.");
  recordCombo(separateProviders(taunt, [...teamHeal, ...teamShield, ...teamReduction]), 3,
    "A taunt user is backed by a different monster's team sustain.");
  recordCombo(separateProviders(enemyDecrease, [...teamHeal, ...teamShield, ...teamReduction]), 2,
    "Enemy damage suppression combines with another monster's team protection.");
  recordCombo(separateProviders([...vulnerability, ...stun, ...taunt], [...teamShield, ...teamHeal, ...selfShield]), 4,
    "Offensive control/debuffs combine with another member's protection or sustain.");
  const fragilityRecipients = present.filter((member) =>
    positive(member.statusDamagePercent) > 0 && hasExternal(dots, member.id));
  if (fragilityRecipients.length) {
    const activeAmount = Math.max(...dots.map((effect) => effect.reliability), 0);
    const traitStrength = fragilityRecipients.reduce((sum, member) => sum + positive(member.statusDamagePercent) / 50, 0);
    recordCombo(activeAmount > 0, Math.min(7, traitStrength * 5 * activeAmount),
      `A teammate's Burn/Poison can activate Fragility's conditional damage for ${fragilityRecipients.map((member) => member.name).join(", ")}.`);
  }
  const activeProviders = ids(effects).size;
  const coveredRoles = [offense.score > 0, defense.score > 0, control.score > 0, passives.score > 0]
    .filter(Boolean).length;
  if (activeProviders > 1 && coveredRoles >= 2) {
    const coverage = coveredRoles >= 3 ? 8 : 4;
    comboValue += coverage;
    combos.push(`${activeProviders} monsters provide usable effects across ${coveredRoles} areas; mixed coverage is valuable even without a named combo.`);
  }
  // A damage carry with DIFFERENT monsters providing reliable debuffs/control
  // is a team interaction, not points awarded just for large raw DPS.
  const primaryDps = present.reduce((best, member) => member.dps > best.dps ? member : best, present[0]);
  const helperIds = ids(effects.filter((offered) => offered.provider !== primaryDps.id && (
    offered.effect.target === "Team" || offered.effect.target === "Enemy"
      && ["vulnerability", "stun", "taunt", "knockback", "damageDecrease", "burn", "poison"].includes(offered.effect.type)
  )));
  if (teamDps > 0 && primaryDps.dps / teamDps >= .5 && helperIds.size) {
    comboValue += Math.min(10, 5 + helperIds.size * 2.5);
    combos.push(`${primaryDps.name} supplies the primary DPS while ${helperIds.size} other member${helperIds.size === 1 ? "" : "s"} provide usable debuffs, control or team support.`);
  }
  const combo = category("combos", "Combos & coverage", comboValue, combos);
  const categories = [passives, offense, defense, control, combo];
  const score = Math.round(categories.reduce((sum, value) => sum + value.score, 0));
  return {
    score,
    categories,
    summary: "Custom composition estimate, recalibrated to reward reliable debuffs, control, sustain, matched encounter passives and different members covering different jobs. Effect availability is approximate; skill rotations and outcomes are not simulated.",
  };
}
