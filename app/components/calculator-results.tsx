import { useState } from "react";

import { getMonsterStatData } from "../data/monster-stats";
import {
    getPassiveImagePath,
    PASSIVE_DEFINITIONS,
} from "../data/passives";
import {
    getSkill,
    getSkillTotalHits,
    getSkillTotalMultiplier,
} from "../data/skills";
import { getEquipment } from "../data/equipments";
import { calculateSkillAttributeEffects } from "../lib/calculations/attributes";

import {
    calculateStats,
    type CalculatedStats,
} from "../lib/calculations/stats";

import {
    calculateCombatDamage,
} from "../lib/calculations/combat";
import {
    getMutationCooldownMultiplier,
} from "../lib/calculations/mutations";

import type { Build, MonsterPassive, Mutation, PassiveEffectStat, Rank } from "../types/build";
import type { Monster } from "../types/monster";
import type { MonsterStatData } from "../types/monster-stats";

import { MonsterOverviewCard } from "./monster-overview-card";
import { Panel } from "./panel";

function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
    }).format(value);
}

function roundToSignificantFigures(value: number, figures = 4): number {
    if (value === 0 || !Number.isFinite(value)) return value;

    const magnitude = Math.floor(Math.log10(Math.abs(value)));
    const precision = figures - magnitude - 1;
    const factor = 10 ** precision;

    return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatStatNumber(value: number): string {
    if (!Number.isFinite(value)) return "—";

    const roundedValue = roundToSignificantFigures(value);
    const absoluteValue = Math.abs(roundedValue);
    const units = [
        { threshold: 1_000_000_000_000_000, suffix: "Qd" },
        { threshold: 1_000_000_000_000, suffix: "T" },
        { threshold: 1_000_000_000, suffix: "B" },
        { threshold: 1_000_000, suffix: "M" },
        { threshold: 100_000, suffix: "K" },
    ];
    const unit = units.find(({ threshold }) => absoluteValue >= threshold);

    if (!unit) {
        return new Intl.NumberFormat("en-US", {
            maximumFractionDigits: Math.max(
                0,
                4 - Math.floor(Math.log10(absoluteValue || 1)) - 1,
            ),
        }).format(roundedValue);
    }

    const scaledValue = roundedValue / unit.threshold;
    const scaledMagnitude = Math.floor(Math.log10(Math.abs(scaledValue)));

    return `${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: Math.max(0, 4 - scaledMagnitude - 1),
    }).format(scaledValue)}${unit.suffix}`;
}

const passiveEffectLabels: Record<PassiveEffectStat, string> = {
    damage: "Combat Damage",
    incomingDamage: "Incoming Damage",
    critChance: "Crit Chance",
    critDamage: "Crit Damage",
    bossDamage: "Boss Damage",
    bossIncomingDamage: "Incoming Boss Damage",
    spireDamage: "Spire Damage",
    spireIncomingDamage: "Incoming Spire Damage",
    riftDamage: "Rift Damage",
    riftIncomingDamage: "Incoming Rift Damage",
    dungeonDamage: "Dungeon Damage",
    dungeonIncomingDamage: "Incoming Dungeon Damage",
    coinGain: "Coins",
    xpGain: "XP",
    rankLuck: "Rank Luck",
    healthRestore: "Health Restore",
    mutationRate: "Mutation Rate",
    stunImmunity: "Stun Immunity",
};

function formatPassiveEffect(stat: PassiveEffectStat, value: number | boolean): string {
    if (typeof value === "boolean") {
        return value ? passiveEffectLabels[stat] : `No ${passiveEffectLabels[stat]}`;
    }

    return `${value >= 0 ? "+" : ""}${formatNumber(value)}% ${passiveEffectLabels[stat]}`;
}

function getPassiveActivation(
    passive: MonsterPassive,
    build: Build,
): { active: boolean; label: string } {
    if (
        passive.id === "vitalSurge" &&
        typeof passive.condition === "number"
    ) {
        const active = build.currentHpPercent > passive.condition;
        return {
            active,
            label: active
                ? `Active · ${build.currentHpPercent}% HP`
                : `Requires above ${passive.condition}% HP`,
        };
    }
    if (passive.id === "sacredBeetle") {
        const bossDamageActive =
            build.combatContext === "boss";

        return {
            active: true,
            label: bossDamageActive
                ? "Stun Immunity always active · Boss Damage active"
                : "Stun Immunity always active · Boss Damage requires Boss combat",
        };
    }

    const contextByStat: Partial<Record<PassiveEffectStat, Build["combatContext"]>> = {
        bossDamage: "boss",
        bossIncomingDamage: "boss",
        spireDamage: "spire",
        spireIncomingDamage: "spire",
        riftDamage: "rift",
        riftIncomingDamage: "rift",
        dungeonDamage: "dungeon",
        dungeonIncomingDamage: "dungeon",
    };
    const requiredContext = passive.effects
        .map((effect) => contextByStat[effect.stat])
        .find((context): context is Build["combatContext"] => context !== undefined);

    if (requiredContext) {
        const active = build.combatContext === requiredContext;
        return {
            active,
            label: active
                ? `Active in ${requiredContext}`
                : `Requires ${requiredContext} combat`,
        };
    }

    return { active: true, label: "Always active" };
}

function getPassiveDisplayEffects(passive: MonsterPassive): string[] {
    if (passive.id === "lastBlessing") {
        const restorePercent =
            passive.values?.[0] ?? 80;

        return [
            `${formatNumber(restorePercent)}% Ally Health Restore on death`,
        ];
    }

    if (passive.effects.length > 0) {
        return passive.effects.map((effect) =>
            formatPassiveEffect(effect.stat, effect.value),
        );
    }

    if (passive.id === "dragonsCurse") {
        return ["Applies 15 Stacks of Poison when defeated"];
    }

    if (passive.id === "potentialSeeker") {
        return [
            passive.values?.[0] !== undefined
                ? `+${formatNumber(passive.values[0])}% Genetic Potential chance`
                : "Increased Genetic Potential chance",
        ];
    }

    return passive.values?.map((value) => `+${formatNumber(value)}% effect`) ?? ["Special passive effect"];
}

function getDamageHealingPercent(notes: string | undefined): number | null {
    const match = notes?.match(/(\d+(?:\.\d+)?)% of damage/i);
    return match ? Number(match[1]) : null;
}

function getHealthHealingPercent(notes: string | undefined): number | null {
    const match = notes?.match(/(\d+(?:\.\d+)?)% of (?:max(?:imum)? )?health/i);
    return match ? Number(match[1]) : null;
}

const rankColors: Record<Rank, string> = {
    E: "#a3a3aa",
    D: "#35d328",
    C: "#23bfd3",
    B: "#e45bd8",
    A: "#ffad0a",
    S: "#67e879",
    SS: "#ff5a62",
};

function CombatRank({ rank }: { rank: Rank | null }) {
    if (!rank) return <span>—</span>;

    if (rank === "S") {
        return (
            <span
                className="font-bold"
                style={{
                    backgroundImage: "linear-gradient(100deg,#ff4545 4%,#ffd83d 25%,#43e86e 45%,#31cbea 65%,#8e62ff 82%,#ff58a8 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                }}
            >
                S
            </span>
        );
    }

    return (
        <span className="font-bold" style={{ color: rankColors[rank] }}>
            {rank}
        </span>
    );
}

type BuildStatProps = {
    iconSrc: string;
    label: string;
    value: string;
};

function BuildStat({
                       iconSrc,
                       label,
                       value,
                   }: BuildStatProps) {
    return (
        <div className="rounded-lg border border-[#303848] bg-[#131720] p-4">
            <div className="flex items-center gap-2">
                <img
                    src={iconSrc}
                    alt=""
                    className="size-5 shrink-0 object-contain"
                />

                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                    {label}
                </p>
            </div>

            <p className="mt-3 text-2xl font-semibold text-[#e8ebf0]">
                {value}
            </p>
        </div>
    );
}

function InfoTooltip({ label, text }: { label: string; text: string }) {
    return (
        <span className="group/help relative inline-flex">
            <button
                type="button"
                aria-label={label}
                className="inline-flex size-4 items-center justify-center rounded-full border border-current/40 leading-none opacity-70 transition hover:opacity-100 focus:opacity-100 focus:outline-none"
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 6 10"
                    className="h-[8px] w-[5px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M1 2.6C1.15 1.45 1.95.8 3.05.8c1.2 0 2.05.7 2.05 1.8 0 .9-.45 1.35-1.2 1.8-.7.42-.95.82-.95 1.55v.25" />
                    <path d="M2.95 8.55h.01" />
                </svg>
            </button>
            <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 translate-y-1 rounded-lg border border-[#3a4354] bg-[#11151e] px-3 py-2 text-left text-xs font-normal normal-case leading-5 tracking-normal text-[#c5cbd5] opacity-0 shadow-2xl transition group-hover/help:translate-y-0 group-hover/help:opacity-100 group-focus-within/help:translate-y-0 group-focus-within/help:opacity-100"
            >
                {text}
            </span>
        </span>
    );
}

const mutationSummary: Record<Mutation, { label: string; icon: string }> = {
    huge: { label: "Huge", icon: "/icons/Huge.png" },
    "huge-x": { label: "Huge X", icon: "/icons/huge-x.png" },
    shiny: { label: "Shiny", icon: "/icons/Shiny.png" },
    "shiny-x": { label: "Shiny X", icon: "/icons/shiny-x.png" },
    bloodlit: { label: "Bloodlit", icon: "/icons/Bloodlit.png" },
    "bloodlit-x": { label: "Bloodlit X", icon: "/icons/bloodlit-x.png" },
    fairy: { label: "Fairy", icon: "/icons/Fairy.png" },
    "fairy-x": { label: "Fairy X", icon: "/icons/fairy-x.png" },
};

type SkillDamagePanelProps = {
    monster: Monster;
    skill: NonNullable<ReturnType<typeof getSkill>>;
    stats: CalculatedStats;
    build: Build;
    skillNumber: number;
    skillCount: number;
};

function SkillDamagePanel({
                              monster,
                              skill,
                              stats,
                              build,
                              skillNumber,
                              skillCount,
                          }: SkillDamagePanelProps) {
    const [showDetails, setShowDetails] = useState(false);
    const totalHits = getSkillTotalHits(skill);
    const totalMultiplier =
        getSkillTotalMultiplier(skill);

    const isDamagingSkill =
        skill.damageInstances.length > 0;
    const hasComplexBreakdown = skill.damageInstances.length > 1 || totalHits > 1;
    const attributeEffects = calculateSkillAttributeEffects(build, skill.element);
    const accountRiftDamageMultiplier = build.combatContext === "rift"
        ? stats.accountRiftDamageMultiplier
        : 1;

    const cooldownMultiplier = getMutationCooldownMultiplier(build.mutations);
    const hasFairy = cooldownMultiplier < 1;
    const fairyLabel = build.mutations.includes("fairy-x") ? "Fairy X" : "Fairy";

    const combatDamage = calculateCombatDamage({
        monster,
        baseDamage: stats.damage * totalMultiplier * attributeEffects.skillDamageMultiplier * accountRiftDamageMultiplier,
        critMultiplier: stats.critMultiplier,
        combatContext: build.combatContext,
        currentHpPercent: build.currentHpPercent,
    });

    // Overload replaces the normal Overvolt Tempest cast; it is not a third skill.
    const hasOvervoltTempestOverload =
        skill.id === "overvolt-tempest";
    const alternateTotalMultiplier = hasOvervoltTempestOverload
        ? 0.4 * 11
        : null;
    const alternateCombatDamage = alternateTotalMultiplier === null
        ? null
        : calculateCombatDamage({
            monster,
            baseDamage:
                stats.damage *
                alternateTotalMultiplier *
                attributeEffects.skillDamageMultiplier *
                accountRiftDamageMultiplier,
            critMultiplier: stats.critMultiplier,
            combatContext: build.combatContext,
            currentHpPercent: build.currentHpPercent,
        });

    const damageHealingPercent = getDamageHealingPercent(skill.notes);
    const healthHealingPercent = getHealthHealingPercent(skill.notes);
    const healingEffectivenessMultiplier = 1 + attributeEffects.healEffectiveness / 100;
    const healingDamageBase = isDamagingSkill
        ? combatDamage.normalDamage
        : stats.damage;
    const damageHealingAmount = damageHealingPercent === null
        ? 0
        : healingDamageBase * (damageHealingPercent / 100);
    const healthHealingAmount = healthHealingPercent === null
        ? 0
        : stats.health * (healthHealingPercent / 100);
    const hasCalculatedHealing = damageHealingPercent !== null || healthHealingPercent !== null;
    const healingAmount = hasCalculatedHealing
        ? (damageHealingAmount + healthHealingAmount) * healingEffectivenessMultiplier
        : null;
    const criticalHealingAmount = !hasCalculatedHealing || !isDamagingSkill
        ? null
        : (
        (damageHealingPercent === null
            ? 0
            : combatDamage.criticalDamage * (damageHealingPercent / 100)) +
        healthHealingAmount
    ) * healingEffectivenessMultiplier;
    const lifeStealAmount = combatDamage.normalDamage * (attributeEffects.lifeSteal / 100);
    const criticalLifeStealAmount = combatDamage.criticalDamage * (attributeEffects.lifeSteal / 100);

    const damagePassiveDetails = combatDamage.activePassiveEffects.map((effect) => ({
        name: PASSIVE_DEFINITIONS[effect.name].name,
        stat: effect.stat,
        multiplier: effect.multiplier,
    }));
    const displayedCooldown =
        skill.cooldown === null
            ? null
            : skill.cooldown * cooldownMultiplier;
    const isTriggeredSkill =
        skill.cooldown === null &&
        skill.notes?.toLowerCase().includes("triggered");
    const cooldownLabel = displayedCooldown !== null
        ? `${formatNumber(displayedCooldown)}s`
        : isTriggeredSkill
            ? "Triggered"
            : "Unknown";

    const skillIconPath = `/skill-icons/${skill.id}.png`;
    const elementIconPath = `/element-icons/${skill.element.toLowerCase()}.png`;

    return (
        <section className="p-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-center gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#3a4354] bg-[#11151e] p-0.5 shadow-[0_6px_14px_rgba(0,0,0,0.2)]">
                        <img
                            src={skillIconPath}
                            alt={`${skill.name} skill`}
                            className="h-full w-full scale-[1.4] rounded-md object-cover"
                            onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = elementIconPath;
                                event.currentTarget.className = "size-7 object-contain";
                            }}
                        />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7585ff]">
                            Skill {skillNumber} of {skillCount}
                        </p>

                        <h3 className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-[#f2f4f8]">
                            {skill.name}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8993a5]">
                            <span className="flex items-center gap-1">
                                <img src={elementIconPath} alt="" className="size-3.5 object-contain" />
                                {skill.element}
                            </span>
                            {isDamagingSkill && (
                                <>
                                    <span aria-hidden="true" className="text-[#465064]">•</span>
                                    <span><strong className="text-[#d8dee9]">{formatNumber(totalMultiplier)}×</strong> multiplier</span>
                                    <span aria-hidden="true" className="text-[#465064]">•</span>
                                    <span><strong className="text-[#d8dee9]">{totalHits}</strong> {totalHits === 1 ? "hit" : "hits"}</span>
                                </>
                            )}
                            <span aria-hidden="true" className="text-[#465064]">•</span>
                            <span>
                                <strong className="text-[#d8dee9]">{cooldownLabel}</strong>
                                {!isTriggeredSkill && " cooldown"}
                            </span>
                            {hasFairy && (
                                <span className="rounded border border-[#c28cff]/30 bg-[#201b35] px-1.5 py-0.5 font-semibold text-[#d8b7ff]">
                                    {fairyLabel}
                                </span>
                            )}
                        </div>

                        {isTriggeredSkill && skill.notes && (
                            <p className="mt-2 text-[10px] leading-4 text-[#99a2b3]">
                                {skill.notes}
                            </p>
                        )}
                    </div>
                </div>

                {isDamagingSkill && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="min-w-0 rounded-lg border border-[#39415a] bg-[#1c2130] p-3">
                            <div className="flex items-center gap-1.5 text-[#aeb7ff]">
                                <img src="/account-icons/damage.png" alt="" className="size-4 shrink-0 object-contain" />
                                <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Normal</p>
                                <InfoTooltip
                                    label="Explain total skill damage"
                                    text="The total normal damage dealt by this skill after its skill multiplier, passive effects, and applicable attributes."
                                />
                            </div>
                            <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f2f4f8]" title={formatStatNumber(combatDamage.normalDamage)}>
                                {formatStatNumber(combatDamage.normalDamage)}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-lg border border-[#ff7448]/35 bg-[#3a201b]/35 p-3">
                            <div className="flex items-center gap-1.5 text-[#ff936d]">
                                <img src="/account-icons/critical-damage.png" alt="" className="size-4 shrink-0 object-contain" />
                                <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Critical</p>
                                <InfoTooltip
                                    label="Explain critical damage"
                                    text={`The total skill damage when a critical hit occurs, using the current ${formatNumber(stats.critMultiplier)}× critical multiplier.`}
                                />
                            </div>
                            <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f2f4f8]" title={formatStatNumber(combatDamage.criticalDamage)}>
                                {formatStatNumber(combatDamage.criticalDamage)}
                            </p>
                        </div>

                        {hasOvervoltTempestOverload && alternateCombatDamage && alternateTotalMultiplier !== null && (
                            <>
                                <div className="min-w-0 rounded-lg border border-[#5363a8]/45 bg-[#20263a] p-3">
                                    <div className="flex items-center gap-1.5 text-[#aeb7ff]">
                                        <img src="/account-icons/damage.png" alt="" className="size-4 shrink-0 object-contain" />
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Normal (Overload)</p>
                                        <InfoTooltip
                                            label="Explain Overvolt Tempest Overload"
                                            text="The 25% chance Overvolt Tempest Overload cast. It uses the same 11-hit attack and cooldown with +100% damage, increasing each hit from 0.2× to 0.4× Attack."
                                        />
                                    </div>
                                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f2f4f8]" title={formatStatNumber(alternateCombatDamage.normalDamage)}>
                                        {formatStatNumber(alternateCombatDamage.normalDamage)}
                                    </p>
                                </div>

                                <div className="min-w-0 rounded-lg border border-[#ff7448]/45 bg-[#43231f]/45 p-3">
                                    <div className="flex items-center gap-1.5 text-[#ff936d]">
                                        <img src="/account-icons/critical-damage.png" alt="" className="size-4 shrink-0 object-contain" />
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Critical (Overload)</p>
                                        <InfoTooltip
                                            label="Explain critical Overvolt Tempest Overload"
                                            text={`The critical result for the 25% chance Overvolt Tempest Overload cast. It deals +100% skill damage and uses the current ${formatNumber(stats.critMultiplier)}× critical multiplier.`}
                                        />
                                    </div>
                                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f2f4f8]" title={formatStatNumber(alternateCombatDamage.criticalDamage)}>
                                        {formatStatNumber(alternateCombatDamage.criticalDamage)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {!isDamagingSkill ? (
                <div className="mt-3 rounded-md border border-dashed border-[#303848] bg-[#11151e]/45 p-3">
                    <p className="text-sm text-[#99a2b3]">
                        {skill.notes ?? "This skill does not deal damage."}
                    </p>
                    {healingAmount !== null && (
                        <div className="mt-3 rounded-md border border-[#7585ff]/25 bg-[#1f2540]/35 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#aeb7ff]">Healing</p>
                            <p className="mt-1 text-lg font-bold text-[#e8ebf0]">{formatStatNumber(healingAmount)}</p>
                            <p className="mt-1 text-xs text-[#99a2b3]">
                                {damageHealingPercent !== null && (
                                    <>{formatStatNumber(healingDamageBase)} Damage × {formatNumber(damageHealingPercent)}%</>
                                )}
                                {damageHealingPercent !== null && healthHealingPercent !== null ? " + " : ""}
                                {healthHealingPercent !== null && (
                                    <>{formatStatNumber(stats.health)} Health × {formatNumber(healthHealingPercent)}%</>
                                )}
                                {attributeEffects.healEffectiveness > 0
                                    ? ` × ${formatNumber(healingEffectivenessMultiplier)} healing effectiveness`
                                    : ""}
                                {" = "}{formatStatNumber(healingAmount)} healed
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setShowDetails((current) => !current)}
                        className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#303848] bg-[#131720] px-3 py-2 text-left text-xs text-[#99a2b3] transition hover:border-[#465166] hover:text-[#d8dee9]"
                    >
                        <span>{showDetails ? "Hide calculation details" : "View calculation details"}</span>
                        <span className={`text-base transition-transform ${showDetails ? "rotate-180" : ""}`}>⌄</span>
                    </button>

                    {showDetails && (
                        <div className="mt-3 space-y-4 rounded-lg border border-[#303848] bg-[#11151e]/45 p-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">Calculation</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#99a2b3]">
                                    <span className="rounded-lg border border-[#303848] bg-[#131720] px-3 py-2">Damage <strong className="ml-1 text-[#e8ebf0]">{formatStatNumber(stats.damage)}</strong></span>
                                    <span className="text-base font-bold text-[#788295]">×</span>
                                    <span className="rounded-lg border border-[#303848] bg-[#131720] px-3 py-2">Skill <strong className="ml-1 text-[#e8ebf0]">{formatNumber(totalMultiplier)}×</strong></span>
                                    {combatDamage.passiveDamageMultiplier !== 1 && (
                                        <>
                                            <span className="text-base font-bold text-[#788295]">×</span>
                                            <span className="rounded-lg border border-[#303848] bg-[#131720] px-3 py-2">Passive <strong className="ml-1 text-[#e8ebf0]">{formatNumber(combatDamage.passiveDamageMultiplier)}×</strong></span>
                                        </>
                                    )}
                                    {attributeEffects.skillDamageMultiplier !== 1 && (
                                        <>
                                            <span className="text-base font-bold text-[#788295]">×</span>
                                            <span className="rounded-lg border border-[#303848] bg-[#131720] px-3 py-2">Attribute <strong className="ml-1 text-[#e8ebf0]">{formatNumber(attributeEffects.skillDamageMultiplier)}×</strong></span>
                                        </>
                                    )}
                                    {accountRiftDamageMultiplier !== 1 && (
                                        <>
                                            <span className="text-base font-bold text-[#788295]">×</span>
                                            <span className="rounded-lg border border-[#303848] bg-[#131720] px-3 py-2">Account Rift <strong className="ml-1 text-[#e8ebf0]">{formatNumber(accountRiftDamageMultiplier)}×</strong></span>
                                        </>
                                    )}
                                    <span className="text-base font-bold text-[#788295]">=</span>
                                    <span className="rounded-lg border border-[#7585ff]/45 bg-[#1f2540]/45 px-3 py-2 text-[#7585ff]">Total <strong className="ml-1">{formatStatNumber(combatDamage.normalDamage)}</strong></span>
                                </div>
                            </div>

                            {damagePassiveDetails.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">Passive Effects</p>
                                    {damagePassiveDetails.map((passive, index) => (
                                        <p key={`${passive.name}-${index}`} className="mt-1 text-xs text-[#99a2b3]">
                                            {passive.name}: {formatNumber(passive.multiplier)}× {passiveEffectLabels[passive.stat]}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {attributeEffects.active.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">Attribute Effects</p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        {attributeEffects.lifeSteal > 0 && (
                                            <span className="rounded bg-[#1f2540] px-2 py-1 text-[#7585ff]">
                                                Life Siphon: {formatStatNumber(combatDamage.normalDamage)} × {formatNumber(attributeEffects.lifeSteal)}% = {formatStatNumber(lifeStealAmount)} healed
                                                {" · "}{formatStatNumber(criticalLifeStealAmount)} on critical
                                            </span>
                                        )}
                                        {attributeEffects.cooldownSkipChance > 0 && <span className="rounded bg-[#201b35] px-2 py-1 text-[#c28cff]">{attributeEffects.cooldownSkipChance}% cooldown-skip chance</span>}
                                        {attributeEffects.healEffectiveness > 0 && <span className="rounded bg-[#1f2540] px-2 py-1 text-[#7585ff]">+{attributeEffects.healEffectiveness}% healing</span>}
                                        {attributeEffects.shieldEffectiveness > 0 && <span className="rounded bg-[#17283a] px-2 py-1 text-[#70b7ff]">+{attributeEffects.shieldEffectiveness}% shield gain</span>}
                                        {attributeEffects.shieldDamage > 0 && <span className="rounded bg-[#342612] px-2 py-1 text-[#f4bd6a]">+{attributeEffects.shieldDamage}% damage to shields</span>}
                                        {attributeEffects.skillResistance > 0 && <span className="rounded bg-[#17283a] px-2 py-1 text-[#70b7ff]">-{attributeEffects.skillResistance}% incoming {skill.element} skill damage</span>}
                                        {attributeEffects.damageRedirect > 0 && <span className="rounded bg-[#17283a] px-2 py-1 text-[#70b7ff]">{attributeEffects.damageRedirect}% damage redirect</span>}
                                        {attributeEffects.damageImmunitySeconds > 0 && <span className="rounded bg-[#342612] px-2 py-1 text-[#f4bd6a]">{attributeEffects.damageImmunitySeconds}s damage immunity</span>}
                                        {attributeEffects.maxHpRegenPerSecond > 0 && <span className="rounded bg-[#1f2540] px-2 py-1 text-[#7585ff]">Healing Pulse: restore {attributeEffects.maxHpRegenPerSecond}% max HP every second ({formatStatNumber(stats.health * attributeEffects.maxHpRegenPerSecond / 100)} HP/s)</span>}
                                    </div>
                                </div>
                            )}

                            {healingAmount !== null && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">Healing Calculation</p>
                                    <div className="mt-2 rounded-lg border border-[#7585ff]/25 bg-[#1f2540]/35 p-3 text-xs text-[#99a2b3]">
                                        <p>
                                            {damageHealingPercent !== null && (
                                                <>{formatStatNumber(healingDamageBase)} Damage × {formatNumber(damageHealingPercent)}%</>
                                            )}
                                            {damageHealingPercent !== null && healthHealingPercent !== null ? " + " : ""}
                                            {healthHealingPercent !== null && (
                                                <>{formatStatNumber(stats.health)} Health × {formatNumber(healthHealingPercent)}%</>
                                            )}
                                            {attributeEffects.healEffectiveness > 0
                                                ? ` × ${formatNumber(healingEffectivenessMultiplier)} healing effectiveness`
                                                : ""}
                                            {" = "}<strong className="text-[#aeb7ff]">{formatStatNumber(healingAmount)} healed</strong>
                                        </p>
                                        {criticalHealingAmount !== null && (
                                            <p className="mt-1">
                                                Critical: {damageHealingPercent !== null && (
                                                <>{formatStatNumber(combatDamage.criticalDamage)} Damage × {formatNumber(damageHealingPercent)}%</>
                                            )}
                                                {damageHealingPercent !== null && healthHealingPercent !== null ? " + " : ""}
                                                {healthHealingPercent !== null && (
                                                    <>{formatStatNumber(stats.health)} Health × {formatNumber(healthHealingPercent)}%</>
                                                )}
                                                {attributeEffects.healEffectiveness > 0
                                                    ? ` × ${formatNumber(healingEffectivenessMultiplier)}`
                                                    : ""}
                                                {" = "}<strong className="text-[#ff936d]">{formatStatNumber(criticalHealingAmount)} healed</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {hasComplexBreakdown && (
                                <div>
                                    <div className="flex flex-wrap items-end justify-between gap-2">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">Per-Hit Breakdown</p>
                                            <p className="mt-1 text-xs text-[#99a2b3]">
                                                {skill.damageInstances.length === 1
                                                    ? `${totalHits} identical hits at ${formatNumber(skill.damageInstances[0].multiplier * 100)}% of Attack each`
                                                    : `${totalHits} hits with different Attack multipliers`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-2">
                                        {skill.damageInstances.map((instance, index) => {
                                            const baseDamagePerHit =
                                                stats.damage *
                                                instance.multiplier *
                                                attributeEffects.skillDamageMultiplier *
                                                accountRiftDamageMultiplier;

                                            const combatDamagePerHit =
                                                calculateCombatDamage({
                                                    monster,
                                                    baseDamage: baseDamagePerHit,
                                                    critMultiplier: stats.critMultiplier,
                                                    combatContext: build.combatContext,
                                                    currentHpPercent: build.currentHpPercent,
                                                });

                                            const damagePerHit =
                                                combatDamagePerHit.normalDamage;

                                            const criticalDamagePerHit =
                                                combatDamagePerHit.criticalDamage;

                                            const instanceTotalDamage =
                                                damagePerHit *
                                                instance.hits;

                                            const instanceTotalCriticalDamage =
                                                criticalDamagePerHit *
                                                instance.hits;

                                            return (
                                                <div
                                                    key={`${instance.multiplier}-${instance.hits}-${index}`}
                                                    className="rounded-lg border border-[#303848] bg-[#131720] p-3"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-[#e8ebf0]">
                                                            {skill.damageInstances.length === 1 ? "Repeated Hits" : `Damage Part ${index + 1}`}
                                                        </p>
                                                        <span className="rounded-md border border-[#303848] bg-[#11151e] px-2 py-1 text-xs text-[#99a2b3]">
                                                    {instance.hits} {instance.hits === 1 ? "hit" : "hits"} · {formatNumber(instance.multiplier * 100)}% of Attack
                                                </span>
                                                    </div>

                                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                        <div className="rounded-md border border-[#7585ff]/25 bg-[#1f2540]/35 p-2.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7585ff]">Normal {instance.hits > 1 ? "/ Hit" : "Damage"}</p>
                                                            <p className="mt-1 text-sm font-semibold text-[#e8ebf0]">{formatStatNumber(damagePerHit)}</p>
                                                        </div>
                                                        <div className="rounded-md border border-[#ff7448]/25 bg-[#3a201b]/35 p-2.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff936d]">Critical {instance.hits > 1 ? "/ Hit" : "Damage"}</p>
                                                            <p className="mt-1 text-sm font-semibold text-[#e8ebf0]">{formatStatNumber(criticalDamagePerHit)}</p>
                                                        </div>
                                                    </div>

                                                    {instance.hits > 1 && (
                                                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#303848] pt-2 text-xs text-[#99a2b3]">
                                                            <span>All {instance.hits} hits: <strong className="text-[#7585ff]">{formatStatNumber(instanceTotalDamage)}</strong> normal</span>
                                                            <span><strong className="text-[#ff936d]">{formatStatNumber(instanceTotalCriticalDamage)}</strong> critical</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {skill.damageInstances.length > 1 && (
                                        <div className="mt-3 grid gap-2 rounded-lg border border-[#3a4354] bg-[#131720] p-3 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7585ff]">Total Normal Damage</p>
                                                <p className="mt-1 text-lg font-bold text-[#e8ebf0]">{formatStatNumber(combatDamage.normalDamage)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff936d]">Total Critical Damage</p>
                                                <p className="mt-1 text-lg font-bold text-[#e8ebf0]">{formatStatNumber(combatDamage.criticalDamage)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

type PassiveAnalysisPanelProps = {
    passive: MonsterPassive;
    build: Build;
    passiveNumber: number;
    passiveCount: number;
};

function PassiveAnalysisPanel({
                                  passive,
                                  build,
                                  passiveNumber,
                                  passiveCount,
                              }: PassiveAnalysisPanelProps) {
    const imagePath = getPassiveImagePath(passive);
    const definition = PASSIVE_DEFINITIONS[passive.id];
    const activation = getPassiveActivation(passive, build);
    const effects = getPassiveDisplayEffects(passive);

    return (
        <section className="p-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-center gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border shadow-[0_6px_14px_rgba(0,0,0,0.2)] ${
                            activation.active
                                ? "border-[#3a4354] bg-[#11151e]"
                                : "border-[#3a4354] bg-[#11151e]"
                        }`}
                    >
                        {imagePath ? (
                            <img
                                src={imagePath}
                                alt={`${definition.name} passive`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-sm font-black text-[#7585ff]">
                                {definition.name.slice(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7585ff]">
                            Passive {passiveNumber} of {passiveCount}
                        </p>
                        <h3 className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-[#f2f4f8]">
                            {definition.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                            {passive.id === "sacredBeetle" ? (
                                <>
                                    <span className="rounded border border-[#3a4354] bg-[#131720] px-1.5 py-0.5 font-semibold text-[#aeb7ff]">
                                        Stun Immunity always active
                                    </span>

                                    <span
                                        className={`rounded border px-1.5 py-0.5 font-semibold ${
                                            build.combatContext === "boss"
                                                ? "border-[#3a4354] bg-[#131720] text-[#aeb7ff]"
                                                : "border-[#f4bd6a]/30 bg-[#342612]/45 text-[#f4bd6a]"
                                        }`}
                                    >
                                        {build.combatContext === "boss"
                                            ? "Boss Damage active"
                                            : "Boss Damage requires Boss combat"}
                                    </span>
                                </>
                            ) : (
                                <span
                                    className={`rounded border px-1.5 py-0.5 font-semibold ${
                                        activation.active
                                            ? "border-[#3a4354] bg-[#131720] text-[#aeb7ff]"
                                            : "border-[#f4bd6a]/30 bg-[#342612]/45 text-[#f4bd6a]"
                                    }`}
                                >
                                    {activation.label}
                                </span>
                            )}
                            {typeof passive.condition === "number" && (
                                <span className="text-[#8993a5]">HP condition: above {passive.condition}%</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`grid gap-2 ${effects.length > 1 ? "sm:grid-cols-2" : ""}`}>
                    {effects.map((effect, index) => (
                        <div
                            key={`${passive.id}-${effect}-${index}`}
                            className={`min-w-0 rounded-lg border p-3 ${activation.active ? "border-[#3a4354] bg-[#131720]" : "border-[#3a4354] bg-[#131720]"}`}
                        >
                            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#788295]">
                                Effect {effects.length > 1 ? index + 1 : ""}
                            </p>
                            <p className={`mt-1 text-sm font-semibold ${activation.active ? "text-[#c7ceff]" : "text-[#b8c0ce]"}`}>
                                {effect}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

type AdvancedCalculationsProps = {
    stats: CalculatedStats | null;
    build: Build;
    statData: MonsterStatData | null;
};

function AdvancedCalculations({
                                  stats,
                                  build,
                                  statData,
                              }: AdvancedCalculationsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeStat, setActiveStat] = useState<"health" | "damage">("damage");

    return (
        <section className="overflow-hidden rounded-lg border border-[#303848] bg-[#1a1f2a]">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7585ff]">
                        Advanced Calculations
                    </p>

                    <p className="mt-1 text-xs text-[#788295]">
                        Explore stat growth and every multiplier in the final result
                    </p>
                </div>

                <span className="text-sm text-[#99a2b3]">
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>

            {isOpen && (
                <div className="border-t border-[#303848] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex rounded-lg border border-[#303848] bg-[#11151e] p-1">
                            {(["health", "damage"] as const).map((stat) => (
                                <button
                                    key={stat}
                                    type="button"
                                    onClick={() => setActiveStat(stat)}
                                    className={`rounded-md px-4 py-2 text-xs font-semibold capitalize transition ${activeStat === stat ? (stat === "health" ? "bg-[#1f2540] text-[#7585ff]" : "bg-[#351d22] text-[#ff936d]") : "text-[#788295] hover:text-[#c5cbd5]"}`}
                                >
                                    {stat}
                                </button>
                            ))}
                        </div>

                        {stats && (
                            <p className="whitespace-nowrap text-xs text-[#788295]">
                                Total multiplier{" "}
                                <strong className="text-[#d8dee9]">
                                    {formatNumber(activeStat === "health" ? stats.healthTotalMultiplier : stats.damageTotalMultiplier)}×
                                </strong>
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,31rem),1fr))] gap-3">
                        <GrowthPreview activeStat={activeStat} build={build} statData={statData}/>
                        <FormulaBreakdown activeStat={activeStat} stats={stats} build={build}/>
                    </div>
                </div>
            )}
        </section>
    );
}

type FormulaBreakdownProps = {
    stats: CalculatedStats | null;
    build: Build;
    activeStat: "health" | "damage";
};

function FormulaBreakdown({ stats, build, activeStat }: FormulaBreakdownProps) {
    const [copied, setCopied] = useState(false);

    if (!stats) {
        return (
            <section className="rounded-lg border border-dashed border-[#303848] bg-[#11151e]/45 p-4">
                <h3 className="text-sm font-semibold text-[#e8ebf0]">
                    Formula Breakdown
                </h3>

                <p className="mt-2 text-sm text-[#788295]">
                    Stat data is not available for this monster yet.
                </p>
            </section>
        );
    }

    const isHealth = activeStat === "health";
    const accent = isHealth ? "text-[#7585ff]" : "text-[#ff936d]";
    const baseValue = isHealth ? stats.eRankHealth : stats.eRankDamage;
    const geneticMultiplier = isHealth ? stats.healthGeneticMultiplier : stats.damageGeneticMultiplier;
    const mutationMultiplier = isHealth ? stats.mutationHealthMultiplier : stats.mutationDamageMultiplier;
    const equipmentMultiplier = isHealth ? stats.equipmentHealthMultiplier : stats.equipmentDamageMultiplier;
    const accountMultiplier = isHealth ? stats.accountHealthMultiplier : stats.accountDamageMultiplier;
    const finalValue = isHealth ? stats.health : stats.damage;

    let runningValue = baseValue;
    const multiplierRows = [
        { label: `Rank Multiplier (${build.rank ?? "—"})`, multiplier: stats.rankMultiplier },
        { label: `Enhancement (+${build.enhancement})`, multiplier: stats.enhancementMultiplier },
        { label: `Genetic Potential (${isHealth ? build.healthGeneticPotential : build.damageGeneticPotential}%)`, multiplier: geneticMultiplier },
        { label: `Evolution (${build.evolutionPercent}%)`, multiplier: stats.evolutionMultiplier },
        { label: "Mutation", multiplier: mutationMultiplier },
        { label: isHealth ? "Armor" : "Weapon", multiplier: equipmentMultiplier },
        { label: "Account Multiplier", multiplier: accountMultiplier },
    ];
    const rows = [
        { label: `Base ${isHealth ? "Health" : "Damage"} (E Lv. ${build.level})`, multiplier: null as number | null, value: baseValue },
        ...multiplierRows.map((row) => {
            runningValue *= row.multiplier;
            return { ...row, value: runningValue };
        }),
    ];
    const copyBreakdown = async () => {
        const text = rows
            .map((row) => `${row.label}: ${row.multiplier === null ? "base" : `${formatNumber(row.multiplier)}×`} = ${formatStatNumber(row.value)}`)
            .concat(`Final ${isHealth ? "Health" : "Damage"}: ${formatStatNumber(finalValue)}`)
            .join("\n");

        if (!navigator.clipboard) return;

        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <section className="min-w-0 rounded-xl border border-[#303848] bg-[#131720] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-[#e8ebf0]">Formula Breakdown</h3>
                    <p className={`mt-1 text-xs ${accent}`}>
                        {isHealth ? "Health" : "Damage"} at level {build.level}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={copyBreakdown}
                    title={copied ? "Copied!" : "Copy formula breakdown"}
                    aria-label={copied ? "Formula breakdown copied" : "Copy formula breakdown"}
                    className={`inline-flex min-w-[5.5rem] items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${copied ? "border-[#7585ff]/50 bg-[#1f2540]/60 text-[#7585ff]" : "border-[#303848] text-[#99a2b3] hover:border-[#465064] hover:bg-[#1a1f2a] hover:text-[#e8ebf0]"}`}
                >
                    {copied ? (
                        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 shrink-0">
                            <path d="m4.5 10.5 3.25 3.25 7.75-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    ) : (
                        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 shrink-0">
                            <rect x="6.5" y="6.5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M13.5 6.5V5A1.5 1.5 0 0 0 12 3.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    )}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#343b4b] text-xs">
                {rows.map((row, index) => (
                    <div
                        key={row.label}
                        className={`grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(4.75rem,auto)] items-start gap-1.5 px-2.5 py-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem] sm:items-center sm:gap-2 sm:px-3 ${index % 2 === 0 ? "bg-[#151a24]" : "bg-[#11151e]"}`}
                    >
                        <span className="min-w-0 break-words pr-1 leading-5 text-[#b8c0ce]">
                            {index === 0 ? "" : "× "}{row.label}
                        </span>
                        <span className="whitespace-nowrap text-right tabular-nums leading-5 text-[#8993a5]">
                            {row.multiplier === null ? "—" : `${formatNumber(row.multiplier)}×`}
                        </span>
                        <strong className="whitespace-nowrap text-right tabular-nums leading-5 text-[#d8dee9]">
                            {formatStatNumber(row.value)}
                        </strong>
                    </div>
                ))}
                <div className={`grid grid-cols-[minmax(0,1fr)_minmax(4.75rem,auto)] items-center gap-2 border-t border-[#3a4354] bg-[#191f2b] px-2.5 py-3 sm:grid-cols-[minmax(0,1fr)_6.5rem] sm:gap-3 sm:px-3 ${accent}`}>
                    <strong className="min-w-0 break-words">= Final {isHealth ? "Health" : "Damage"}</strong>
                    <strong className="whitespace-nowrap text-right text-sm tabular-nums">
                        {formatStatNumber(finalValue)}
                    </strong>
                </div>
            </div>
        </section>
    );
}

type GrowthPreviewProps = {
    build: Build;
    statData: MonsterStatData | null;
    activeStat: "health" | "damage";
};

function compactNumber(value: number): string {
    return formatStatNumber(value);
}

function GrowthPreview({ build, statData, activeStat }: GrowthPreviewProps) {
    const width = 440;
    const height = 230;
    const padding = { top: 16, right: 18, bottom: 34, left: 52 };
    const levels = Array.from({ length: 105 }, (_, index) => index + 1);
    const points = statData
        ? levels.map((level) => {
            const levelStats = calculateStats(statData, { ...build, level });
            return levelStats
                ? activeStat === "health"
                    ? levelStats.health
                    : levelStats.damage
                : 0;
        })
        : [];
    const maxValue = Math.max(...points, 1);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const xForLevel = (level: number) =>
        padding.left + ((level - 1) / 104) * plotWidth;
    const yForValue = (value: number) =>
        padding.top + plotHeight - (value / maxValue) * plotHeight;
    const path = points
        .map((value, index) =>
            `${index === 0 ? "M" : "L"} ${xForLevel(index + 1).toFixed(2)} ${yForValue(value).toFixed(2)}`,
        )
        .join(" ");
    const currentValue = points[build.level - 1] ?? 0;
    const accent = activeStat === "health" ? "#72df79" : "#ff7568";

    return (
        <section className="min-w-0 rounded-xl border border-[#303848] bg-[#131720] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-[#e8ebf0]">Growth Preview</h3>
                    <p className="mt-1 text-xs text-[#788295]">Current build bonuses · Levels 1–105</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                        Level {build.level}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums" style={{ color: accent }}>
                        {compactNumber(currentValue)}
                    </p>
                </div>
            </div>

            {points.length > 0 ? (
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="mt-3 h-auto w-full"
                    role="img"
                    aria-label={`${activeStat} growth from level 1 to 105`}
                >
                    <defs>
                        <linearGradient id={`growth-fill-${activeStat}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accent} stopOpacity="0.22"/>
                            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
                        </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padding.top + plotHeight * ratio;
                        return (
                            <g key={ratio}>
                                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#27303d"/>
                                <text x={padding.left - 9} y={y + 4} textAnchor="end" fill="#788295" fontSize="10">
                                    {compactNumber(maxValue * (1 - ratio))}
                                </text>
                            </g>
                        );
                    })}

                    {[1, 20, 40, 60, 80, 105].map((level) => (
                        <g key={level}>
                            <line x1={xForLevel(level)} x2={xForLevel(level)} y1={padding.top} y2={padding.top + plotHeight} stroke="#222a36"/>
                            <text x={xForLevel(level)} y={height - 12} textAnchor="middle" fill="#788295" fontSize="10">
                                {level}
                            </text>
                        </g>
                    ))}

                    <path
                        d={`${path} L ${xForLevel(105)} ${padding.top + plotHeight} L ${xForLevel(1)} ${padding.top + plotHeight} Z`}
                        fill={`url(#growth-fill-${activeStat})`}
                    />
                    <path d={path} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line
                        x1={xForLevel(build.level)}
                        x2={xForLevel(build.level)}
                        y1={padding.top}
                        y2={padding.top + plotHeight}
                        stroke={accent}
                        strokeOpacity="0.35"
                        strokeDasharray="4 4"
                    />
                    <circle
                        cx={xForLevel(build.level)}
                        cy={yForValue(currentValue)}
                        r="4.5"
                        fill="#131720"
                        stroke={accent}
                        strokeWidth="2.5"
                    />
                    <text x={width / 2} y={height} textAnchor="middle" fill="#99a2b3" fontSize="10">
                        Level
                    </text>
                </svg>
            ) : (
                <div className="mt-4 grid min-h-52 place-items-center rounded-lg border border-dashed border-[#303848] text-sm text-[#788295]">
                    Growth data unavailable
                </div>
            )}
        </section>
    );
}

type BuildResultsPanelProps = {
    monster: Monster | null;
    build: Build;
    stats: CalculatedStats | null;
};

function BuildResultsPanel({
                               monster,
                               build,
                               stats,
                           }: BuildResultsPanelProps) {
    const selectedWeapon = getEquipment(build.weaponId);
    const selectedArmor = getEquipment(build.armorId);

    return (
        <section className="overflow-hidden rounded-lg border border-[#303848] bg-[#1a1f2a]">
            <div className="border-b border-[#303848] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7585ff]">
                    Combat Stats
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#99a2b3]">
                    <span className="whitespace-nowrap">
                        Level{" "}
                        <strong className="font-semibold text-[#d8dee9]">
                            {build.level}
                        </strong>
                    </span>

                    <span className="whitespace-nowrap">
                        Rank{" "}
                        <strong className="font-semibold">
                            <CombatRank rank={build.rank}/>
                        </strong>
                    </span>

                    <span className="whitespace-nowrap">
                        Enhancement{" "}
                        <strong className={`font-bold ${build.enhancement === 0 ? "text-[#d8dee9]" : "text-[#4d96ff]"}`}>
                            +{build.enhancement}
                        </strong>
                    </span>

                    <span className="flex items-center gap-2 whitespace-nowrap">
                        <span>Genetic Potential</span>
                        <span className="flex items-center gap-1" title="Damage Genetic Potential">
                            <img src="/icons/breed-attack.png" alt="Damage" className="size-5 object-contain" />
                            <strong className="font-semibold text-[#d8dee9]">{build.damageGeneticPotential}%</strong>
                        </span>
                        <span className="flex items-center gap-1" title="Health Genetic Potential">
                            <img src="/icons/breed-health.png" alt="Health" className="size-5 object-contain" />
                            <strong className="font-semibold text-[#d8dee9]">{build.healthGeneticPotential}%</strong>
                        </span>
                    </span>

                    {build.mutations.length > 0 && (
                        <span className="flex items-center gap-1.5">
                            <span className="mr-0.5">Mutations</span>
                            {build.mutations.map((mutation) => {
                                const summary = mutationSummary[mutation];

                                return (
                                    <img
                                        key={mutation}
                                        src={summary.icon}
                                        alt={summary.label}
                                        title={summary.label}
                                        className="size-6 rounded object-contain"
                                    />
                                );
                            })}
                        </span>
                    )}

                    {monster?.isEvolved && (
                        <span className="whitespace-nowrap">
                            EM{" "}
                            <strong className="font-semibold text-[#d8dee9]">{build.evolutionPercent}%</strong>
                        </span>
                    )}

                    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap" title={selectedWeapon?.name ?? "No weapon equipped"}>
                        <span>Weapon</span>
                        {selectedWeapon ? (
                            <>
                                <img src={`/gear/${selectedWeapon.id}.png`} alt="" className="size-6 rounded object-contain" />
                                <strong className="font-semibold text-[#d8dee9]">{selectedWeapon.percentage}%</strong>
                            </>
                        ) : (
                            <strong className="font-semibold text-[#d8dee9]">None</strong>
                        )}
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap" title={selectedArmor?.name ?? "No armor equipped"}>
                        <span>Armor</span>
                        {selectedArmor ? (
                            <>
                                <img src={`/gear/${selectedArmor.id}.png`} alt="" className="size-6 rounded object-contain" />
                                <strong className="font-semibold text-[#d8dee9]">{selectedArmor.percentage}%</strong>
                            </>
                        ) : (
                            <strong className="font-semibold text-[#d8dee9]">None</strong>
                        )}
                    </span>
                </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                <BuildStat
                    iconSrc="/account-icons/damage.png"
                    label="Damage"
                    value={
                        stats
                            ? formatStatNumber(stats.damage)
                            : "Data pending"
                    }
                />

                <BuildStat
                    iconSrc="/account-icons/health.png"
                    label="Health"
                    value={
                        stats
                            ? formatStatNumber(stats.health)
                            : "Data pending"
                    }
                />

                <BuildStat
                    iconSrc="/account-icons/critical-chance.png"
                    label="Crit Chance"
                    value={
                        stats
                            ? `${formatNumber(stats.critChance)}%`
                            : "Data pending"
                    }
                />

                <BuildStat
                    iconSrc="/account-icons/critical-damage.png"
                    label="Crit Multiplier"
                    value={
                        stats
                            ? `${formatNumber(stats.critMultiplier)}×`
                            : "Data pending"
                    }
                />
            </div>

        </section>
    );
}

function EmptyCalculatorState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-[#303848] bg-[#1a1f2a] text-2xl text-[#7585ff]">
                ✦
            </div>

            <p className="text-base font-semibold text-[#e8ebf0]">
                Select a monster to start
            </p>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#99a2b3]">
                Choose a monster from the browser to view its current data and
                configure a build.
            </p>
        </div>
    );
}

type CalculatorResultsProps = {
    monster: Monster | null;
    build: Build;
    isFavorite: boolean;
    onToggleFavorite: () => void;
};

export function CalculatorResults({
                                      monster,
                                      build,
                                      isFavorite,
                                      onToggleFavorite,
                                  }: CalculatorResultsProps) {
    const monsterSkills =
        monster?.skillIds
            .map(getSkill)
            .filter(
                (skill): skill is NonNullable<ReturnType<typeof getSkill>> =>
                    skill !== null,
            ) ?? [];

    const monsterStatData = monster
        ? getMonsterStatData(monster.id)
        : null;

    const stats =
        build.rank && monsterStatData
            ? calculateStats(
                monsterStatData,
                build,
                monster?.passives ?? [],
            )
            : null;

    return (
        <Panel
            eyebrow="Analyze"
            title="Calculator Results"
            action={
                monster ? (
                    <span className="text-xs font-medium text-[#7585ff]">
            {monster.name}
          </span>
                ) : null
            }
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
                {!monster ? (
                    <EmptyCalculatorState/>
                ) : (
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-2 pb-5">
                        <MonsterOverviewCard
                            monster={monster}
                            isFavorite={isFavorite}
                            onToggleFavorite={onToggleFavorite}
                        />
                        <BuildResultsPanel
                            monster={monster}
                            build={build}
                            stats={stats}
                        />
                        {stats && (monsterSkills.length > 0 || (monster.passives?.length ?? 0) > 0) && (
                            <section className="overflow-hidden rounded-xl border border-[#303848] bg-[#1a1f2a]">
                                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303848] px-4 py-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7585ff]">
                                            Skill Analysis
                                        </p>
                                        <h2 className="mt-0.5 text-base font-semibold text-[#e8ebf0]">
                                            Monster Skills & Passives
                                        </h2>
                                    </div>
                                    <span className="rounded-full border border-[#303848] bg-[#131720] px-2.5 py-1 text-xs font-medium text-[#99a2b3]">
                                        {monsterSkills.length} {monsterSkills.length === 1 ? "skill" : "skills"}
                                        {(monster.passives?.length ?? 0) > 0 && ` · ${monster.passives?.length} ${monster.passives?.length === 1 ? "passive" : "passives"}`}
                                    </span>
                                </div>

                                <div className="divide-y divide-[#303848]">
                                    {monsterSkills.map((skill, index) => (
                                        <SkillDamagePanel
                                            key={`${skill.id}-${index}`}
                                            monster={monster}
                                            skill={skill}
                                            stats={stats}
                                            build={build}
                                            skillNumber={index + 1}
                                            skillCount={monsterSkills.length}
                                        />
                                    ))}

                                    {(monster.passives?.length ?? 0) > 0 && (
                                        <>
                                            <div className="bg-[#151b24] px-4 py-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7585ff]">
                                                    Passive Analysis
                                                </p>
                                                <p className="mt-0.5 text-xs text-[#8993a5]">
                                                    Effects and activation conditions for this monster
                                                </p>
                                            </div>
                                            {monster.passives?.map((passive, index) => (
                                                <PassiveAnalysisPanel
                                                    key={`${passive.id}-${index}`}
                                                    passive={passive}
                                                    build={build}
                                                    passiveNumber={index + 1}
                                                    passiveCount={monster.passives?.length ?? 0}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            </section>
                        )}

                        <AdvancedCalculations
                            stats={stats}
                            build={build}
                            statData={monsterStatData}
                        />
                    </div>
                )}
            </div>
        </Panel>
    );
}