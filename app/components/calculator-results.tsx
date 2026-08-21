import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getMonsterStatData } from "../data/monster-stats";
import { monsters } from "../data/monsters";
import {
    getPassiveImagePath,
    getTransferablePassiveFromTeammate,
    mergeUniquePassives,
    PASSIVE_DEFINITIONS,
} from "../data/passives";
import {
    getSkill,
    getSkillDisplayName,
    getSkillTotalHits,
    getSkillTotalMultiplier,
} from "../data/skills";
import { getEquipment } from "../data/equipments";
import { getTrait } from "../data/traits";
import { calculateSkillAttributeEffects } from "../lib/calculations/attributes";
import { assetPath } from "../lib/asset-path";

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
import { getTraitCooldownMultiplier, getTraitDamageMultiplier, getTraitEffectValue } from "../lib/calculations/traits";

import type { Build, MonsterPassive, Mutation, PassiveEffectStat, Rank } from "../types/build";
import type { Monster } from "../types/monster";
import type { MonsterStatData } from "../types/monster-stats";

import { MonsterOverviewCard } from "./monster-overview-card";
import { Panel } from "./panel";
import { TraitIcon } from "./trait-icon";

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
    if (
        passive.id === "sacredBeetle" &&
        passive.effects.some((effect) => effect.stat === "stunImmunity")
    ) {
        const bossDamageActive =
            build.targetIsBoss;

        return {
            active: true,
            label: bossDamageActive
                ? "Stun Immunity always active · Boss Damage active"
                : "Stun Immunity always active · Boss Damage requires Boss target",
        };
    }

    const hasBossEffect = passive.effects.some(
        (effect) =>
            effect.stat === "bossDamage" ||
            effect.stat === "bossIncomingDamage",
    );

    if (hasBossEffect) {
        return {
            active: build.targetIsBoss,
            label: build.targetIsBoss
                ? "Active against Boss target"
                : "Requires Boss target",
        };
    }

    const contextByStat: Partial<Record<PassiveEffectStat, Build["combatContext"]>> = {
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
        <div className="rounded-lg border border-[#344050] bg-[#0f1620] p-4">
            <div className="flex items-center gap-2">
                <img
                    src={assetPath(iconSrc)}
                    alt=""
                    className="size-5 shrink-0 object-contain"
                />

                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">
                    {label}
                </p>
            </div>

            <p className="mt-3 text-2xl font-semibold text-[#e3e8f1]">
                {value}
            </p>
        </div>
    );
}

function InfoTooltip({ label, text }: { label: string; text: string }) {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const showTooltip = () => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();

        const tooltipWidth = 224;
        const tooltipHeight = 120;
        const gap = 8;

        let left = rect.left + rect.width / 2 - tooltipWidth / 2;
        let top = rect.bottom + gap;

        if (left < 8) {
            left = 8;
        }

        if (left + tooltipWidth > window.innerWidth - 8) {
            left = window.innerWidth - tooltipWidth - 8;
        }

        if (top + tooltipHeight > window.innerHeight - 8) {
            top = rect.top - tooltipHeight - gap;
        }

        setPosition({ top, left });
        setOpen(true);
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-label={label}
                onMouseEnter={showTooltip}
                onMouseLeave={() => setOpen(false)}
                onFocus={showTooltip}
                onBlur={() => setOpen(false)}
                className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-current/50 leading-none opacity-80 transition hover:opacity-100 focus:opacity-100 focus:outline-none"
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 6 10"
                    className="h-[10px] w-[6px]"
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

            {open &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        role="tooltip"
                        style={{
                            position: "fixed",
                            top: position.top,
                            left: position.left,
                            width: 224,
                            zIndex: 9999,
                        }}
                        className="pointer-events-none rounded-lg border border-[#41506a] bg-[#0d131d] px-3 py-2 text-left text-xs font-normal normal-case leading-5 tracking-normal text-[#bfc7d5] shadow-2xl"
                    >
                        {text}
                    </div>,
                    document.body,
                )}
        </>
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

function calculateSkillDps(
    monster: Monster,
    skill: NonNullable<ReturnType<typeof getSkill>>,
    stats: CalculatedStats,
    build: Build,
    effectivePassives: MonsterPassive[],
): number | null {
    if (skill.damageInstances.length === 0 || skill.cooldown === null || skill.cooldown <= 0) {
        return null;
    }

    const totalMultiplier = getSkillTotalMultiplier(skill);

    const attributeEffects = calculateSkillAttributeEffects(
        build,
        skill.element,
    );

    const accountRiftDamageMultiplier =
        build.combatContext === "rift"
            ? stats.accountRiftDamageMultiplier
            : 1;

    const traitDamageMultiplier = getTraitDamageMultiplier(
        build.traitId,
        {
            targetStatused: build.targetStatused,
        },
    );

    const combatDamage = calculateCombatDamage({
        monster,
        baseDamage:
            stats.damage *
            totalMultiplier *
            traitDamageMultiplier *
            attributeEffects.skillDamageMultiplier *
            accountRiftDamageMultiplier,
        critMultiplier: stats.critMultiplier,
        combatContext: build.combatContext,
        targetIsBoss: build.targetIsBoss,
        currentHpPercent: build.currentHpPercent,
        passives: effectivePassives,
    });

    const cooldownMultiplier =
        getMutationCooldownMultiplier(build.mutations) *
        getTraitCooldownMultiplier(build.traitId);

    const displayedCooldown =
        skill.cooldown * cooldownMultiplier;

    if (displayedCooldown <= 0) {
        return null;
    }

    const critChance = Math.min(
        Math.max(stats.critChance / 100, 0),
        1,
    );

    const expectedDamage =
        combatDamage.normalDamage * (1 - critChance) +
        combatDamage.criticalDamage * critChance;

    return expectedDamage / displayedCooldown;
}

type SkillDamagePanelProps = {
    monster: Monster;
    skill: NonNullable<ReturnType<typeof getSkill>>;
    stats: CalculatedStats;
    build: Build;
    effectivePassives: MonsterPassive[];
    skillNumber: number;
    skillCount: number;
};

function SkillDamagePanel({
                              monster,
                              skill,
                              stats,
                              build,
                              effectivePassives,
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

    const mutationCooldownMultiplier = getMutationCooldownMultiplier(build.mutations);
    const traitCooldownMultiplier = getTraitCooldownMultiplier(build.traitId);
    const cooldownMultiplier = mutationCooldownMultiplier * traitCooldownMultiplier;
    const hasFairy = mutationCooldownMultiplier < 1;
    const hasFairyX = build.mutations.includes("fairy-x");
    const fairyIconPath = hasFairyX ? "/icons/fairy-x.png" : "/icons/Fairy.png";
    const selectedTrait = getTrait(build.traitId);
    const traitDamageMultiplier = getTraitDamageMultiplier(build.traitId, {
        targetStatused: build.targetStatused,
    });
    const notes = skill.notes?.toLowerCase() ?? "";
    const skillHasHealing = getDamageHealingPercent(skill.notes) !== null || getHealthHealingPercent(skill.notes) !== null;
    const skillHasCooldown = skill.cooldown !== null && skill.cooldown > 0;
    const appliesAttackReduction = /attack.{0,20}(reduc|lower)|(?:reduc|lower).{0,20}attack/.test(notes);
    const appliesVulnerability = notes.includes("vulnerab") || skill.id === "root-spike";
    const appliesBurn = notes.includes("burn");
    const traitSkillEffects = selectedTrait?.effects
        .filter((effect) => {
            switch (effect.type) {
                case "damage":
                    return isDamagingSkill;
                case "healingEffectiveness":
                    return skillHasHealing;
                case "cooldownReduction":
                    return skillHasCooldown;
                case "attackReductionEffectiveness":
                    return appliesAttackReduction;
                case "vulnerabilityEffectiveness":
                    return appliesVulnerability;
                case "burnDuration":
                    return appliesBurn;
                default:
                    return false;
            }
        })
        .map((effect) => ({
            ...effect,
            active: effect.condition === "targetStatused" ? build.targetStatused : true,
        })) ?? [];
    const traitAffectsSkill = traitSkillEffects.length > 0;
    const isTraitEffectActive = traitSkillEffects.some((effect) => effect.active);
    const hasHasten = traitSkillEffects.some((effect) => effect.type === "cooldownReduction");
    const showTraitMetadataLabel = traitAffectsSkill && !hasHasten;
    const fairyCooldownColor = hasFairyX ? "#a970ff" : "#d8b7ff";
    const hastenCooldownColor = selectedTrait?.id === "hasten-3"
        ? "#f2a04b"
        : selectedTrait?.id === "hasten-2"
            ? "#c28cff"
            : "#70a7ff";
    const cooldownValueStyle = hasFairy && hasHasten
        ? {
            backgroundImage: `linear-gradient(to right, ${fairyCooldownColor}, ${hastenCooldownColor})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
        }
        : hasFairy
            ? { color: fairyCooldownColor }
            : hasHasten
                ? { color: hastenCooldownColor }
                : { color: "#e3e8f1" };

    const combatDamage = calculateCombatDamage({
        monster,
        baseDamage: stats.damage * totalMultiplier * traitDamageMultiplier * attributeEffects.skillDamageMultiplier * accountRiftDamageMultiplier,
        critMultiplier: stats.critMultiplier,
        combatContext: build.combatContext,
        targetIsBoss: build.targetIsBoss,
        currentHpPercent: build.currentHpPercent,
        passives: effectivePassives,
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
                traitDamageMultiplier *
                attributeEffects.skillDamageMultiplier *
                accountRiftDamageMultiplier,
            critMultiplier: stats.critMultiplier,
            combatContext: build.combatContext,
            targetIsBoss: build.targetIsBoss,
            currentHpPercent: build.currentHpPercent,
            passives: effectivePassives,
        });

    const damageHealingPercent = getDamageHealingPercent(skill.notes);
    const healthHealingPercent = getHealthHealingPercent(skill.notes);
    const traitHealingEffectiveness = getTraitEffectValue(build.traitId, "healingEffectiveness");
    const totalHealingEffectiveness = attributeEffects.healEffectiveness + traitHealingEffectiveness;
    const healingEffectivenessMultiplier = 1 + totalHealingEffectiveness / 100;
    // Damage-based healing scales from the monster's base Damage stat,
    // not the skill's post-multiplier damage result.
    const healingDamageBase = stats.damage;
    const criticalHealingDamageBase = stats.damage * stats.critMultiplier;
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
            : criticalHealingDamageBase * (damageHealingPercent / 100)) +
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
    const critChance =
        Math.min(
            Math.max(stats.critChance / 100, 0),
            1,
        );

    const expectedDamage =
        isDamagingSkill
            ? combatDamage.normalDamage * (1 - critChance) +
            combatDamage.criticalDamage * critChance
            : null;

    const skillDps =
        expectedDamage !== null &&
        displayedCooldown !== null &&
        displayedCooldown > 0
            ? expectedDamage / displayedCooldown
            : null;
    const isTriggeredSkill =
        skill.cooldown === null &&
        skill.notes?.toLowerCase().includes("triggered");
    const cooldownLabel = displayedCooldown !== null
        ? `${formatNumber(displayedCooldown)}s`
        : isTriggeredSkill
            ? "Triggered"
            : "Unknown";

    const skillDisplayName = getSkillDisplayName(skill.name);
    const skillIconPath = `/skill-icons/${skill.id}.png`;
    const elementIconPath = `/element-icons/${skill.element.toLowerCase()}.png`;
    const usesPoison = /\bpoison\b/i.test(skill.notes ?? "");
    const usesBurn = /\bburn\b/i.test(skill.notes ?? "");
    const burnDurationBonus = getTraitEffectValue(build.traitId, "burnDuration");
    const baseBurnDuration = 8;
    const burnDuration = baseBurnDuration * (1 + burnDurationBonus / 100);
    const burnTooltip = burnDurationBonus > 0
        ? `Burn deals 0.5% of the target's Max HP per second for ${formatNumber(burnDuration)} seconds, up to 10 stacks. ${selectedTrait?.name ?? "The active trait"} increases Burn Duration by ${formatNumber(burnDurationBonus)}%.`
        : "Burn deals 0.5% of the target's Max HP per second for 8 seconds, up to 10 stacks.";

    return (
        <section className="p-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-center gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#41506a] bg-[#0d131d] p-0.5 shadow-[0_6px_14px_rgba(0,0,0,0.2)]">
                        <img
                            src={assetPath(skillIconPath)}
                            alt={`${skillDisplayName} skill`}
                            className="h-full w-full scale-[1.4] rounded-md object-cover"
                            onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = elementIconPath;
                                event.currentTarget.className = "size-7 object-contain";
                            }}
                        />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7182ff]">
                            Skill {skillNumber} of {skillCount}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1.5">
                            <h3 className="text-lg font-bold leading-tight tracking-tight text-[#f6f8fc]">
                                {skillDisplayName}
                            </h3>
                            {usesPoison && (
                                <InfoTooltip
                                    label="Explain Poison"
                                    text="Each stack of Poison deals 0.4% of current HP per second and reduces enemy Attack by 4%, up to 10 stacks."
                                />
                            )}
                            {usesBurn && (
                                <InfoTooltip
                                    label="Explain Burn"
                                    text={burnTooltip}
                                />
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#7f8b9e]">
                            <span className="flex items-center gap-1">
                                <img src={assetPath(elementIconPath)} alt="" className="size-3.5 object-contain" />
                                {skill.element}
                            </span>
                            {isDamagingSkill && (
                                <>
                                    <span aria-hidden="true" className="text-[#5c6a80]">•</span>
                                    <span><strong className="text-[#e3e8f1]">{formatNumber(totalMultiplier)}×</strong> multiplier</span>
                                    <span aria-hidden="true" className="text-[#5c6a80]">•</span>
                                    <span><strong className="text-[#e3e8f1]">{totalHits}</strong> {totalHits === 1 ? "hit" : "hits"}</span>
                                </>
                            )}
                            <span aria-hidden="true" className="text-[#5c6a80]">•</span>
                            <span style={cooldownValueStyle}>
                                <strong>{cooldownLabel}</strong>
                                {!isTriggeredSkill && " cooldown"}
                            </span>
                            {(hasFairy || (hasHasten && selectedTrait)) && (
                                <span
                                    className="inline-flex items-center -space-x-0.5"
                                    title={[hasFairy ? (hasFairyX ? "Fairy X" : "Fairy") : null, hasHasten ? selectedTrait?.name : null]
                                        .filter(Boolean)
                                        .join(" + ")}
                                >
                                    {hasFairy && (
                                        <img
                                            src={assetPath(fairyIconPath)}
                                            alt={hasFairyX ? "Fairy X" : "Fairy"}
                                            className="size-[17px] shrink-0 object-contain"
                                        />
                                    )}
                                    {hasHasten && selectedTrait && (
                                        <span className="inline-flex scale-[0.62] origin-center -mx-1">
                                            <TraitIcon trait={selectedTrait} size="combat" />
                                        </span>
                                    )}
                                </span>
                            )}
                            {showTraitMetadataLabel && selectedTrait && (
                                <>
                                    <span aria-hidden="true" className="text-[#5c6a80]">•</span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 font-semibold ${
                                            isTraitEffectActive ? "text-[#d8e0ee]" : "text-[#f4bd6a]"
                                        }`}
                                    >
                                        <span className="inline-flex scale-[0.78] origin-center -mx-0.5">
                                            <TraitIcon trait={selectedTrait} size="combat" />
                                        </span>
                                        <span>{selectedTrait.name}</span>
                                    </span>
                                </>
                            )}
                        </div>

                        {isTriggeredSkill && skill.notes && (
                            <p className="mt-2 text-[10px] leading-4 text-[#8e99ad]">
                                {skill.notes}
                            </p>
                        )}

                    </div>
                </div>

                {isDamagingSkill && (
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                        <div className="min-w-0 rounded-lg border border-[#39415a] bg-[#1c2130] p-3">
                            <div className="flex items-center gap-1.5 text-[#aeb8ff]">
                                <img src={assetPath("/account-icons/damage.png")} alt=""
                                     className="size-4 shrink-0 object-contain"/>
                                <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Normal</p>
                                <InfoTooltip
                                    label="Explain total skill damage"
                                    text="The total normal damage dealt by this skill after its skill multiplier, passive effects, and applicable attributes."
                                />
                            </div>
                            <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                               title={formatStatNumber(combatDamage.normalDamage)}>
                                {formatStatNumber(combatDamage.normalDamage)}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-lg border border-[#ff7448]/35 bg-[#3a201b]/35 p-3">
                            <div className="flex items-center gap-1.5 text-[#ff936d]">
                                <img src={assetPath("/account-icons/critical-damage.png")} alt=""
                                     className="size-4 shrink-0 object-contain"/>
                                <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Critical</p>
                                <InfoTooltip
                                    label="Explain critical damage"
                                    text={`The total skill damage when a critical hit occurs, using the current ${formatNumber(stats.critMultiplier)}× critical multiplier.`}
                                />
                            </div>
                            <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                               title={formatStatNumber(combatDamage.criticalDamage)}>
                                {formatStatNumber(combatDamage.criticalDamage)}
                            </p>
                        </div>

                        {skillDps !== null && (
                            <div className="min-w-0 rounded-lg border border-[#7182ff]/35 bg-[#202846]/35 p-3">
                                <div className="flex items-center gap-1.5 text-[#aeb8ff]">
                                    <img
                                        src={assetPath("/account-icons/damage.png")}
                                        alt=""
                                        className="size-4 shrink-0 object-contain"
                                    />

                                    <p className="text-[9px] font-bold uppercase tracking-[0.1em]">
                                        DPS
                                    </p>

                                    <InfoTooltip
                                        label="Explain skill DPS"
                                        text="Expected damage per second using this skill's normal damage, critical damage, critical chance, and adjusted cooldown."
                                    />
                                </div>

                                <p
                                    className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                                    title={`${formatStatNumber(skillDps)} DPS`}
                                >
                                    {formatStatNumber(skillDps)}
                                    <span className="ml-1 text-xs font-semibold text-[#7f8b9e]">
                                        /s
                                    </span>
                                </p>
                            </div>
                        )}

                        {healingAmount !== null && (
                            <div className="min-w-0 rounded-lg border border-[#7182ff]/35 bg-[#202846]/35 p-3">
                                <div className="flex items-center gap-1.5 text-[#aeb8ff]">
                                    <img src={assetPath("/account-icons/health.png")} alt="" className="size-4 shrink-0 object-contain" />
                                    <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Healing</p>
                                    <InfoTooltip
                                        label="Explain healing"
                                        text="The amount healed by this skill using its current damage and/or Max HP healing scaling."
                                    />
                                </div>
                                <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]" title={formatStatNumber(healingAmount)}>
                                    {formatStatNumber(healingAmount)}
                                </p>
                            </div>
                        )}

                        {hasOvervoltTempestOverload && alternateCombatDamage && alternateTotalMultiplier !== null && (
                            <>
                                <div className="min-w-0 rounded-lg border border-[#5363a8]/45 bg-[#20263a] p-3">
                                    <div className="flex items-center gap-1.5 text-[#aeb8ff]">
                                        <img src={assetPath("/account-icons/damage.png")} alt=""
                                             className="size-4 shrink-0 object-contain"/>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Normal
                                            (Overload)</p>
                                        <InfoTooltip
                                            label="Explain Overvolt Tempest Overload"
                                            text="The 25% chance Overvolt Tempest Overload cast. It uses the same 11-hit attack and cooldown with +100% damage, increasing each hit from 0.2× to 0.4× Attack."
                                        />
                                    </div>
                                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                                       title={formatStatNumber(alternateCombatDamage.normalDamage)}>
                                        {formatStatNumber(alternateCombatDamage.normalDamage)}
                                    </p>
                                </div>

                                <div className="min-w-0 rounded-lg border border-[#ff7448]/45 bg-[#43231f]/45 p-3">
                                    <div className="flex items-center gap-1.5 text-[#ff936d]">
                                        <img src={assetPath("/account-icons/critical-damage.png")} alt=""
                                             className="size-4 shrink-0 object-contain"/>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Critical
                                            (Overload)</p>
                                        <InfoTooltip
                                            label="Explain critical Overvolt Tempest Overload"
                                            text={`The critical result for the 25% chance Overvolt Tempest Overload cast. It deals +100% skill damage and uses the current ${formatNumber(stats.critMultiplier)}× critical multiplier.`}
                                        />
                                    </div>
                                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                                       title={formatStatNumber(alternateCombatDamage.criticalDamage)}>
                                        {formatStatNumber(alternateCombatDamage.criticalDamage)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {!isDamagingSkill ? (
                <>
                    {healingAmount !== null ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
                            <div className="min-w-0 rounded-lg border border-[#7182ff]/35 bg-[#202846]/35 p-3">
                                <div className="flex items-center gap-1.5 text-[#aeb8ff]">
                                    <img
                                        src={assetPath("/account-icons/health.png")}
                                        alt=""
                                        className="size-4 shrink-0 object-contain"
                                    />
                                    <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Healing</p>
                                    <InfoTooltip
                                        label="Explain healing"
                                        text="The amount healed by this skill using its current damage and/or Max HP healing scaling."
                                    />
                                </div>
                                <p
                                    className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                                    title={formatStatNumber(healingAmount)}
                                >
                                    {formatStatNumber(healingAmount)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-3 rounded-md border border-dashed border-[#344050] bg-[#0d131d]/45 p-3">
                            <p className="text-sm text-[#8e99ad]">
                                {skill.notes ?? "This skill does not deal damage."}
                            </p>
                        </div>
                    )}

                    {healingAmount !== null && (
                        <>
                            <button
                                type="button"
                                onClick={() => setShowDetails((current) => !current)}
                                className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#344050] bg-[#0f1620] px-3 py-2 text-left text-xs text-[#8e99ad] transition hover:border-[#465166] hover:text-[#e3e8f1]"
                            >
                                <span>{showDetails ? "Hide calculation details" : "View calculation details"}</span>
                                <span className={`text-base transition-transform ${showDetails ? "rotate-180" : ""}`}>⌄</span>
                            </button>

                            {showDetails && (
                                <div className="mt-3 rounded-lg border border-[#344050] bg-[#0f1620] p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">
                                        Healing Calculation
                                    </p>
                                    <div className="mt-2 rounded-lg border border-[#7182ff]/25 bg-[#202846]/35 p-3 text-xs text-[#8e99ad]">
                                        <p>
                                            {damageHealingPercent !== null && (
                                                <>{formatStatNumber(healingDamageBase)} Damage × {formatNumber(damageHealingPercent)}%</>
                                            )}
                                            {damageHealingPercent !== null && healthHealingPercent !== null ? " + " : ""}
                                            {healthHealingPercent !== null && (
                                                <>{formatStatNumber(stats.health)} Health × {formatNumber(healthHealingPercent)}%</>
                                            )}
                                            {totalHealingEffectiveness > 0
                                                ? ` × ${formatNumber(healingEffectivenessMultiplier)} healing effectiveness`
                                                : ""}
                                            {" = "}
                                            <strong className="text-[#aeb8ff]">{formatStatNumber(healingAmount)} healed</strong>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setShowDetails((current) => !current)}
                        className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#344050] bg-[#0f1620] px-3 py-2 text-left text-xs text-[#8e99ad] transition hover:border-[#465166] hover:text-[#e3e8f1]"
                    >
                        <span>{showDetails ? "Hide calculation details" : "View calculation details"}</span>
                        <span className={`text-base transition-transform ${showDetails ? "rotate-180" : ""}`}>⌄</span>
                    </button>

                    {showDetails && (
                        <div className="mt-3 space-y-4 rounded-lg border border-[#344050] bg-[#0d131d]/45 p-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Calculation</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#8e99ad]">
                                    <span className="rounded-lg border border-[#344050] bg-[#0f1620] px-3 py-2">Damage <strong className="ml-1 text-[#e3e8f1]">{formatStatNumber(stats.damage)}</strong></span>
                                    <span className="text-base font-bold text-[#7f8b9e]">×</span>
                                    <span className="rounded-lg border border-[#344050] bg-[#0f1620] px-3 py-2">Skill <strong className="ml-1 text-[#e3e8f1]">{formatNumber(totalMultiplier)}×</strong></span>
                                    {combatDamage.passiveDamageMultiplier !== 1 && (
                                        <>
                                            <span className="text-base font-bold text-[#7f8b9e]">×</span>
                                            <span className="rounded-lg border border-[#344050] bg-[#0f1620] px-3 py-2">Passive <strong className="ml-1 text-[#e3e8f1]">{formatNumber(combatDamage.passiveDamageMultiplier)}×</strong></span>
                                        </>
                                    )}
                                    {traitDamageMultiplier !== 1 && (
                                        <>
                                            <span className="text-base font-bold text-[#7f8b9e]">×</span>
                                            <span className="rounded-lg border border-[#344050] bg-[#0f1620] px-3 py-2">Trait <strong className="ml-1 text-[#e3e8f1]">{formatNumber(traitDamageMultiplier)}×</strong></span>
                                        </>
                                    )}
                                    {attributeEffects.skillDamageMultiplier !== 1 && (
                                        <>
                                            <span className="text-base font-bold text-[#7f8b9e]">×</span>
                                            <span className="rounded-lg border border-[#344050] bg-[#0f1620] px-3 py-2">Attribute <strong className="ml-1 text-[#e3e8f1]">{formatNumber(attributeEffects.skillDamageMultiplier)}×</strong></span>
                                        </>
                                    )}
                                    {accountRiftDamageMultiplier !== 1 && (
                                        <>
                                            <span className="text-base font-bold text-[#7f8b9e]">×</span>
                                            <span className="rounded-lg border border-[#344050] bg-[#0f1620] px-3 py-2">Account Rift <strong className="ml-1 text-[#e3e8f1]">{formatNumber(accountRiftDamageMultiplier)}×</strong></span>
                                        </>
                                    )}
                                    <span className="text-base font-bold text-[#7f8b9e]">=</span>
                                    <span className="rounded-lg border border-[#7182ff]/45 bg-[#202846]/45 px-3 py-2 text-[#7182ff]">Total <strong className="ml-1">{formatStatNumber(combatDamage.normalDamage)}</strong></span>
                                </div>
                            </div>

                            {skillDps !== null && expectedDamage !== null && displayedCooldown !== null && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">
                                        DPS Calculation
                                    </p>

                                    <div className="mt-2 rounded-lg border border-[#344050] bg-[#0f1620] p-3">
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#8e99ad]">
                                            <span className="rounded-lg border border-[#344050] bg-[#0d131d] px-3 py-2">
                                                Normal
                                                <strong className="ml-1 text-[#e3e8f1]">
                                                    {formatStatNumber(combatDamage.normalDamage)}
                                                </strong>
                                            </span>

                                            <span>×</span>

                                            <span className="rounded-lg border border-[#344050] bg-[#0d131d] px-3 py-2">
                                                Non-Crit
                                                <strong className="ml-1 text-[#e3e8f1]">
                                                    {formatNumber((1 - critChance) * 100)}%
                                                </strong>
                                            </span>

                                            <span>+</span>

                                            <span className="rounded-lg border border-[#ff7448]/30 bg-[#3a201b]/35 px-3 py-2">
                                                Critical
                                                <strong className="ml-1 text-[#ff936d]">
                                                    {formatStatNumber(combatDamage.criticalDamage)}
                                                </strong>
                                            </span>

                                            <span>×</span>

                                            <span className="rounded-lg border border-[#ff7448]/30 bg-[#3a201b]/35 px-3 py-2">
                                                Crit Chance
                                                <strong className="ml-1 text-[#ff936d]">
                                                    {formatNumber(stats.critChance)}%
                                                </strong>
                                            </span>

                                            <span>=</span>

                                            <span className="rounded-lg border border-[#7182ff]/45 bg-[#202846]/45 px-3 py-2">
                                                Expected Damage
                                                <strong className="ml-1 text-[#aeb8ff]">
                                                    {formatStatNumber(expectedDamage)}
                                                </strong>
                                            </span>

                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#344050] pt-3 text-xs text-[#8e99ad]">
                                            <span className="rounded-lg border border-[#7182ff]/35 bg-[#202846]/35 px-3 py-2">
                                                {formatStatNumber(expectedDamage)}
                                            </span>

                                            <span>÷</span>

                                            <span className="rounded-lg border border-[#344050] bg-[#0d131d] px-3 py-2">
                                                {formatNumber(displayedCooldown)}s cooldown
                                            </span>

                                            <span>=</span>

                                            <span className="rounded-lg border border-[#7182ff]/45 bg-[#202846]/45 px-3 py-2 font-bold text-[#aeb8ff]">
                                                {formatStatNumber(skillDps)}/s
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {damagePassiveDetails.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Passive Effects</p>
                                    {damagePassiveDetails.map((passive, index) => (
                                        <p key={`${passive.name}-${index}`} className="mt-1 text-xs text-[#8e99ad]">
                                            {passive.name}: {formatNumber(passive.multiplier)}× {passiveEffectLabels[passive.stat]}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {attributeEffects.active.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Attribute Effects</p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        {attributeEffects.lifeSteal > 0 && (
                                            <span className="rounded bg-[#202846] px-2 py-1 text-[#7182ff]">
                                                Life Siphon: {formatStatNumber(combatDamage.normalDamage)} × {formatNumber(attributeEffects.lifeSteal)}% = {formatStatNumber(lifeStealAmount)} healed
                                                {" · "}{formatStatNumber(criticalLifeStealAmount)} on critical
                                            </span>
                                        )}
                                        {attributeEffects.cooldownSkipChance > 0 && <span className="rounded bg-[#201b35] px-2 py-1 text-[#c28cff]">{attributeEffects.cooldownSkipChance}% cooldown-skip chance</span>}
                                        {totalHealingEffectiveness > 0 && <span className="rounded bg-[#202846] px-2 py-1 text-[#7182ff]">+{formatNumber(totalHealingEffectiveness)}% healing effectiveness</span>}
                                        {attributeEffects.shieldEffectiveness > 0 && <span className="rounded bg-[#17283a] px-2 py-1 text-[#70b7ff]">+{attributeEffects.shieldEffectiveness}% shield gain</span>}
                                        {attributeEffects.shieldDamage > 0 && <span className="rounded bg-[#342612] px-2 py-1 text-[#f4bd6a]">+{attributeEffects.shieldDamage}% damage to shields</span>}
                                        {attributeEffects.skillResistance > 0 && <span className="rounded bg-[#17283a] px-2 py-1 text-[#70b7ff]">-{attributeEffects.skillResistance}% incoming {skill.element} skill damage</span>}
                                        {attributeEffects.damageRedirect > 0 && <span className="rounded bg-[#17283a] px-2 py-1 text-[#70b7ff]">{attributeEffects.damageRedirect}% damage redirect</span>}
                                        {attributeEffects.damageImmunitySeconds > 0 && <span className="rounded bg-[#342612] px-2 py-1 text-[#f4bd6a]">{attributeEffects.damageImmunitySeconds}s damage immunity</span>}
                                        {attributeEffects.maxHpRegenPerSecond > 0 && <span className="rounded bg-[#202846] px-2 py-1 text-[#7182ff]">Healing Pulse: restore {attributeEffects.maxHpRegenPerSecond}% max HP every second ({formatStatNumber(stats.health * attributeEffects.maxHpRegenPerSecond / 100)} HP/s)</span>}
                                    </div>
                                </div>
                            )}

                            {healingAmount !== null && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Healing Calculation</p>
                                    <div className="mt-2 rounded-lg border border-[#7182ff]/25 bg-[#202846]/35 p-3 text-xs text-[#8e99ad]">
                                        <p>
                                            {damageHealingPercent !== null && (
                                                <>{formatStatNumber(healingDamageBase)} Damage × {formatNumber(damageHealingPercent)}%</>
                                            )}
                                            {damageHealingPercent !== null && healthHealingPercent !== null ? " + " : ""}
                                            {healthHealingPercent !== null && (
                                                <>{formatStatNumber(stats.health)} Health × {formatNumber(healthHealingPercent)}%</>
                                            )}
                                            {totalHealingEffectiveness > 0
                                                ? ` × ${formatNumber(healingEffectivenessMultiplier)} healing effectiveness`
                                                : ""}
                                            {" = "}<strong className="text-[#aeb8ff]">{formatStatNumber(healingAmount)} healed</strong>
                                        </p>
                                        {criticalHealingAmount !== null && (
                                            <p className="mt-1">
                                                Critical: {damageHealingPercent !== null && (
                                                <>{formatStatNumber(criticalHealingDamageBase)} Damage × {formatNumber(damageHealingPercent)}%</>
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
                                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Per-Hit Breakdown</p>
                                            <p className="mt-1 text-xs text-[#8e99ad]">
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
                                                traitDamageMultiplier *
                                                attributeEffects.skillDamageMultiplier *
                                                accountRiftDamageMultiplier;

                                            const combatDamagePerHit =
                                                calculateCombatDamage({
                                                    monster,
                                                    baseDamage: baseDamagePerHit,
                                                    critMultiplier: stats.critMultiplier,
                                                    combatContext: build.combatContext,
                                                    targetIsBoss: build.targetIsBoss,
                                                    currentHpPercent: build.currentHpPercent,
                                                    passives: effectivePassives,
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
                                                    className="rounded-lg border border-[#344050] bg-[#0f1620] p-3"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-[#e3e8f1]">
                                                            {skill.damageInstances.length === 1 ? "Repeated Hits" : `Damage Part ${index + 1}`}
                                                        </p>
                                                        <span className="rounded-md border border-[#344050] bg-[#0d131d] px-2 py-1 text-xs text-[#8e99ad]">
                                                    {instance.hits} {instance.hits === 1 ? "hit" : "hits"} · {formatNumber(instance.multiplier * 100)}% of Attack
                                                </span>
                                                    </div>

                                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                        <div className="rounded-md border border-[#7182ff]/25 bg-[#202846]/35 p-2.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7182ff]">Normal {instance.hits > 1 ? "/ Hit" : "Damage"}</p>
                                                            <p className="mt-1 text-sm font-semibold text-[#e3e8f1]">{formatStatNumber(damagePerHit)}</p>
                                                        </div>
                                                        <div className="rounded-md border border-[#ff7448]/25 bg-[#3a201b]/35 p-2.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff936d]">Critical {instance.hits > 1 ? "/ Hit" : "Damage"}</p>
                                                            <p className="mt-1 text-sm font-semibold text-[#e3e8f1]">{formatStatNumber(criticalDamagePerHit)}</p>
                                                        </div>
                                                    </div>

                                                    {instance.hits > 1 && (
                                                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#344050] pt-2 text-xs text-[#8e99ad]">
                                                            <span>All {instance.hits} hits: <strong className="text-[#7182ff]">{formatStatNumber(instanceTotalDamage)}</strong> normal</span>
                                                            <span><strong className="text-[#ff936d]">{formatStatNumber(instanceTotalCriticalDamage)}</strong> critical</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {skill.damageInstances.length > 1 && (
                                        <div className="mt-3 grid gap-2 rounded-lg border border-[#41506a] bg-[#0f1620] p-3 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7182ff]">Total Normal Damage</p>
                                                <p className="mt-1 text-lg font-bold text-[#e3e8f1]">{formatStatNumber(combatDamage.normalDamage)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff936d]">Total Critical Damage</p>
                                                <p className="mt-1 text-lg font-bold text-[#e3e8f1]">{formatStatNumber(combatDamage.criticalDamage)}</p>
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
    sourceLabel?: string;
};

function PassiveAnalysisPanel({
                                  passive,
                                  build,
                                  passiveNumber,
                                  passiveCount,
                                  sourceLabel,
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
                                ? "border-[#41506a] bg-[#0d131d]"
                                : "border-[#41506a] bg-[#0d131d]"
                        }`}
                    >
                        {imagePath ? (
                            <img
                                src={assetPath(imagePath)}
                                alt={`${definition.name} passive`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-sm font-black text-[#7182ff]">
                                {definition.name.slice(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7182ff]">
                            Passive {passiveNumber} of {passiveCount}
                        </p>
                        <h3 className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-[#f6f8fc]">
                            {definition.name}
                        </h3>
                        {sourceLabel && (
                            <p className="mt-0.5 text-[10px] font-semibold text-[#8e99ad]">
                                From teammate: {sourceLabel}
                            </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                            {passive.id === "sacredBeetle" ? (
                                <>
                                    {passive.effects.some((effect) => effect.stat === "stunImmunity") && (
                                        <span className="rounded border border-[#41506a] bg-[#0f1620] px-1.5 py-0.5 font-semibold text-[#aeb8ff]">
                                            Stun Immunity always active
                                        </span>
                                    )}

                                    {passive.effects.some((effect) => effect.stat === "bossDamage") && (
                                        <span
                                            className={`rounded border px-1.5 py-0.5 font-semibold ${
                                                build.targetIsBoss
                                                    ? "border-[#41506a] bg-[#0f1620] text-[#aeb8ff]"
                                                    : "border-[#f4bd6a]/30 bg-[#342612]/45 text-[#f4bd6a]"
                                            }`}
                                        >
                                            {build.targetIsBoss
                                                ? "Boss Damage active"
                                                : "Boss Damage requires Boss target"}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span
                                    className={`rounded border px-1.5 py-0.5 font-semibold ${
                                        activation.active
                                            ? "border-[#41506a] bg-[#0f1620] text-[#aeb8ff]"
                                            : "border-[#f4bd6a]/30 bg-[#342612]/45 text-[#f4bd6a]"
                                    }`}
                                >
                                    {activation.label}
                                </span>
                            )}
                            {typeof passive.condition === "number" && (
                                <span className="text-[#7f8b9e]">HP condition: above {passive.condition}%</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`grid gap-2 ${effects.length > 1 ? "sm:grid-cols-2" : ""}`}>
                    {effects.map((effect, index) => (
                        <div
                            key={`${passive.id}-${effect}-${index}`}
                            className={`min-w-0 rounded-lg border p-3 ${activation.active ? "border-[#41506a] bg-[#0f1620]" : "border-[#41506a] bg-[#0f1620]"}`}
                        >
                            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#7f8b9e]">
                                Effect {effects.length > 1 ? index + 1 : ""}
                            </p>
                            <p className={`mt-1 text-sm font-semibold ${activation.active ? "text-[#c7ceff]" : "text-[#bfc7d5]"}`}>
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
        <section className="overflow-hidden rounded-lg border border-[#344050] bg-[#141c28]">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7182ff]">
                        Advanced Calculations
                    </p>

                    <p className="mt-1 text-xs text-[#7f8b9e]">
                        Explore stat growth and every multiplier in the final result
                    </p>
                </div>

                <span className="text-sm text-[#8e99ad]">
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>

            {isOpen && (
                <div className="border-t border-[#344050] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex rounded-lg border border-[#344050] bg-[#0d131d] p-1">
                            {(["health", "damage"] as const).map((stat) => (
                                <button
                                    key={stat}
                                    type="button"
                                    onClick={() => setActiveStat(stat)}
                                    className={`rounded-md px-4 py-2 text-xs font-semibold capitalize transition ${activeStat === stat ? (stat === "health" ? "bg-[#202846] text-[#7182ff]" : "bg-[#351d22] text-[#ff936d]") : "text-[#7f8b9e] hover:text-[#bfc7d5]"}`}
                                >
                                    {stat}
                                </button>
                            ))}
                        </div>

                        {stats && (
                            <p className="whitespace-nowrap text-xs text-[#7f8b9e]">
                                Total multiplier{" "}
                                <strong className="text-[#e3e8f1]">
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
            <section className="rounded-lg border border-dashed border-[#344050] bg-[#0d131d]/45 p-4">
                <h3 className="text-sm font-semibold text-[#e3e8f1]">
                    Formula Breakdown
                </h3>

                <p className="mt-2 text-sm text-[#7f8b9e]">
                    Stat data is not available for this monster yet.
                </p>
            </section>
        );
    }

    const isHealth = activeStat === "health";
    const accent = isHealth ? "text-[#7182ff]" : "text-[#ff936d]";
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
        <section className="min-w-0 rounded-xl border border-[#344050] bg-[#0f1620] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-[#e3e8f1]">Formula Breakdown</h3>
                    <p className={`mt-1 text-xs ${accent}`}>
                        {isHealth ? "Health" : "Damage"} at level {build.level}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={copyBreakdown}
                    title={copied ? "Copied!" : "Copy formula breakdown"}
                    aria-label={copied ? "Formula breakdown copied" : "Copy formula breakdown"}
                    className={`inline-flex min-w-[5.5rem] items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${copied ? "border-[#7182ff]/50 bg-[#202846]/60 text-[#7182ff]" : "border-[#344050] text-[#8e99ad] hover:border-[#5c6a80] hover:bg-[#141c28] hover:text-[#e3e8f1]"}`}
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

            <div className="mt-4 overflow-hidden rounded-lg border border-[#3b4759] text-xs">
                {rows.map((row, index) => (
                    <div
                        key={row.label}
                        className={`grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(4.75rem,auto)] items-start gap-1.5 px-2.5 py-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem] sm:items-center sm:gap-2 sm:px-3 ${index % 2 === 0 ? "bg-[#151a24]" : "bg-[#0d131d]"}`}
                    >
                        <span className="min-w-0 break-words pr-1 leading-5 text-[#bfc7d5]">
                            {index === 0 ? "" : "× "}{row.label}
                        </span>
                        <span className="whitespace-nowrap text-right tabular-nums leading-5 text-[#7f8b9e]">
                            {row.multiplier === null ? "—" : `${formatNumber(row.multiplier)}×`}
                        </span>
                        <strong className="whitespace-nowrap text-right tabular-nums leading-5 text-[#e3e8f1]">
                            {formatStatNumber(row.value)}
                        </strong>
                    </div>
                ))}
                <div className={`grid grid-cols-[minmax(0,1fr)_minmax(4.75rem,auto)] items-center gap-2 border-t border-[#41506a] bg-[#191f2b] px-2.5 py-3 sm:grid-cols-[minmax(0,1fr)_6.5rem] sm:gap-3 sm:px-3 ${accent}`}>
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
    const graphMaxLevel = build.level > 105 ? 110 : 105;
    const levels = Array.from({ length: graphMaxLevel }, (_, index) => index + 1);
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
        <section className="min-w-0 rounded-xl border border-[#344050] bg-[#0f1620] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-[#e3e8f1]">Growth Preview</h3>
                    <p className="mt-1 text-xs text-[#7f8b9e]">Current build bonuses · Levels 1–{graphMaxLevel}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">
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
                    aria-label={`${activeStat} growth from level 1 to ${graphMaxLevel}`}
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
                                <text x={padding.left - 9} y={y + 4} textAnchor="end" fill="#7f8b9e" fontSize="10">
                                    {compactNumber(maxValue * (1 - ratio))}
                                </text>
                            </g>
                        );
                    })}

                    {(graphMaxLevel === 110 ? [1, 20, 40, 60, 80, 100, 110] : [1, 20, 40, 60, 80, 105]).map((level) => (
                        <g key={level}>
                            <line x1={xForLevel(level)} x2={xForLevel(level)} y1={padding.top} y2={padding.top + plotHeight} stroke="#222a36"/>
                            <text x={xForLevel(level)} y={height - 12} textAnchor="middle" fill="#7f8b9e" fontSize="10">
                                {level}
                            </text>
                        </g>
                    ))}

                    <path
                        d={`${path} L ${xForLevel(graphMaxLevel)} ${padding.top + plotHeight} L ${xForLevel(1)} ${padding.top + plotHeight} Z`}
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
                        fill="#0f1620"
                        stroke={accent}
                        strokeWidth="2.5"
                    />
                    <text x={width / 2} y={height} textAnchor="middle" fill="#8e99ad" fontSize="10">
                        Level
                    </text>
                </svg>
            ) : (
                <div className="mt-4 grid min-h-52 place-items-center rounded-lg border border-dashed border-[#344050] text-sm text-[#7f8b9e]">
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
    const selectedTrait = getTrait(build.traitId);

    return (
        <section className="overflow-hidden rounded-lg border border-[#344050] bg-[#141c28]">
            <div className="border-b border-[#344050] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7182ff]">
                    Combat Stats
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8e99ad]">
                    <span className="whitespace-nowrap">
                        Level{" "}
                        <strong className="font-semibold text-[#e3e8f1]">
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
                        <strong className={`font-bold ${build.enhancement === 0 ? "text-[#e3e8f1]" : "text-[#4d96ff]"}`}>
                            +{build.enhancement}
                        </strong>
                    </span>

                    <span className="flex items-center gap-2 whitespace-nowrap">
                        <span>Genetic Potential</span>
                        <span className="flex items-center gap-1" title="Damage Genetic Potential">
                            <img src={assetPath("/icons/breed-attack.png")} alt="Damage" className="size-5 object-contain" />
                            <strong className="font-semibold text-[#e3e8f1]">{build.damageGeneticPotential}%</strong>
                        </span>
                        <span className="flex items-center gap-1" title="Health Genetic Potential">
                            <img src={assetPath("/icons/breed-health.png")} alt="Health" className="size-5 object-contain" />
                            <strong className="font-semibold text-[#e3e8f1]">{build.healthGeneticPotential}%</strong>
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
                                        src={assetPath(summary.icon)}
                                        alt={summary.label}
                                        title={summary.label}
                                        className="size-6 rounded object-contain"
                                    />
                                );
                            })}
                        </span>
                    )}

                    {selectedTrait && (
                        <span className="flex items-center gap-1.5 whitespace-nowrap" title={selectedTrait.effects.map(({ description }) => description).join(" · ")}>
                            <span>Trait</span>
                            <TraitIcon trait={selectedTrait} size="combat" />
                            <strong className="font-semibold text-[#e3e8f1]">{selectedTrait.name}</strong>
                        </span>
                    )}

                    {monster?.isEvolved && (
                        <span className="whitespace-nowrap">
                            EM{" "}
                            <strong className="font-semibold text-[#e3e8f1]">{build.evolutionPercent}%</strong>
                        </span>
                    )}

                    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap" title={selectedWeapon?.name ?? "No weapon equipped"}>
                        <span>Weapon</span>
                        {selectedWeapon ? (
                            <>
                                <img src={assetPath(`/gear/${selectedWeapon.id}.png`)} alt="" className="size-6 rounded object-contain" />
                                <strong className="font-semibold text-[#e3e8f1]">{selectedWeapon.percentage}%</strong>
                            </>
                        ) : (
                            <strong className="font-semibold text-[#e3e8f1]">None</strong>
                        )}
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap" title={selectedArmor?.name ?? "No armor equipped"}>
                        <span>Armor</span>
                        {selectedArmor ? (
                            <>
                                <img src={assetPath(`/gear/${selectedArmor.id}.png`)} alt="" className="size-6 rounded object-contain" />
                                <strong className="font-semibold text-[#e3e8f1]">{selectedArmor.percentage}%</strong>
                            </>
                        ) : (
                            <strong className="font-semibold text-[#e3e8f1]">None</strong>
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
            <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-[#344050] bg-[#141c28] text-2xl text-[#7182ff]">
                ✦
            </div>

            <p className="text-base font-semibold text-[#e3e8f1]">
                Select a monster to start
            </p>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#8e99ad]">
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

    const teammateMonsters = (build.teammateMonsterIds ?? [null, null])
        .map((id) => id ? monsters.find((candidate) => candidate.id === id) ?? null : null)
        .filter((candidate): candidate is Monster => candidate !== null);

    const effectivePassives = mergeUniquePassives(
        monster?.passives,
        ...teammateMonsters.map((teammate) => teammate.passives),
    );

    const ownPassiveNames = new Set(
        (monster?.passives ?? []).map((passive) => PASSIVE_DEFINITIONS[passive.id].name.toLowerCase()),
    );
    const seenTeamPassiveNames = new Set(ownPassiveNames);
    const teamPassiveEntries = teammateMonsters.flatMap((teammate) =>
        (teammate.passives ?? []).flatMap((passive) => {
            const transferablePassive =
                getTransferablePassiveFromTeammate(passive);

            if (!transferablePassive) return [];

            const nameKey =
                PASSIVE_DEFINITIONS[transferablePassive.id].name.toLowerCase();

            if (seenTeamPassiveNames.has(nameKey)) return [];

            seenTeamPassiveNames.add(nameKey);

            return [{
                passive: transferablePassive,
                sourceName: teammate.name,
            }];
        }),
    );

    const stats =
        build.rank && monsterStatData
            ? calculateStats(
                monsterStatData,
                build,
                effectivePassives,
            )
            : null;

    const skillDpsValues =
        monster && stats
            ? monsterSkills
                .map((skill) =>
                    calculateSkillDps(
                        monster,
                        skill,
                        stats,
                        build,
                        effectivePassives,
                    ),
                )
                .filter(
                    (dps): dps is number =>
                        dps !== null,
                )
            : [];

    const totalSkillDps =
        skillDpsValues.reduce(
            (total, dps) => total + dps,
            0,
        );

    return (
        <Panel
            eyebrow="Analyze"
            title="Calculator Results"
            action={
                monster ? (
                    <span className="text-xs font-medium text-[#7182ff]">
            {monster.name}
          </span>
                ) : null
            }
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-visible p-3 sm:p-5 lg:overflow-hidden">
                {!monster ? (
                    <EmptyCalculatorState/>
                ) : (
                    <div className="min-h-0 flex-1 space-y-4 overflow-visible pb-5 lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
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
                        {stats && (monsterSkills.length > 0 || effectivePassives.length > 0) && (
                            <section className="overflow-hidden rounded-xl border border-[#344050] bg-[#141c28]">
                                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#344050] px-4 py-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7182ff]">
                                            Skill Analysis
                                        </p>
                                        <h2 className="mt-0.5 text-base font-semibold text-[#e3e8f1]">
                                            Monster Skills & Passives
                                        </h2>
                                    </div>
                                    <span className="rounded-full border border-[#344050] bg-[#0f1620] px-2.5 py-1 text-xs font-medium text-[#8e99ad]">
                                        {monsterSkills.length} {monsterSkills.length === 1 ? "skill" : "skills"}
                                        {effectivePassives.length > 0 && ` · ${effectivePassives.length} ${effectivePassives.length === 1 ? "passive" : "passives"}`}
                                    </span>
                                </div>

                                <div className="divide-y divide-[#344050]">
                                    {monsterSkills.map((skill, index) => (
                                        <SkillDamagePanel
                                            key={`${skill.id}-${index}`}
                                            monster={monster}
                                            skill={skill}
                                            stats={stats}
                                            build={build}
                                            effectivePassives={effectivePassives}
                                            skillNumber={index + 1}
                                            skillCount={monsterSkills.length}
                                        />
                                    ))}

                                    {skillDpsValues.length > 1 && (
                                        <div className="bg-[#151b24] px-4 py-4">
                                            <div className="rounded-lg border border-[#7182ff]/35 bg-[#202846]/35 p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <img
                                                                src={assetPath("/account-icons/damage.png")}
                                                                alt=""
                                                                className="size-4 object-contain"
                                                            />

                                                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#aeb8ff]">
                                                                Total Skill DPS
                                                            </p>

                                                            <InfoTooltip
                                                                label="Explain total DPS"
                                                                text="The sum of the individual DPS values for all damaging skills. This assumes every skill can be used immediately whenever its cooldown finishes."
                                                            />
                                                        </div>

                                                        <p className="mt-1 text-[11px] text-[#7f8b9e]">
                                                            {skillDpsValues
                                                                .map((dps) => formatStatNumber(dps))
                                                                .join(" + ")}
                                                        </p>
                                                    </div>

                                                    <p className="text-2xl font-bold tracking-tight text-[#f6f8fc]">
                                                        {formatStatNumber(totalSkillDps)}
                                                        <span className="ml-1 text-xs font-semibold text-[#7f8b9e]">
                                                            DPS
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {effectivePassives.length > 0 && (
                                        <>
                                            <div className="bg-[#151b24] px-4 py-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7182ff]">
                                                    Passive Analysis
                                                </p>
                                                <p className="mt-0.5 text-xs text-[#7f8b9e]">
                                                    Selected monster and active teammate passives · duplicate names apply once
                                                </p>
                                            </div>
                                            {(monster.passives ?? []).map((passive, index) => (
                                                <PassiveAnalysisPanel
                                                    key={`own-${passive.id}-${index}`}
                                                    passive={passive}
                                                    build={build}
                                                    passiveNumber={index + 1}
                                                    passiveCount={effectivePassives.length}
                                                />
                                            ))}
                                            {teamPassiveEntries.map(({ passive, sourceName }, index) => (
                                                <PassiveAnalysisPanel
                                                    key={`team-${sourceName}-${passive.id}-${index}`}
                                                    passive={passive}
                                                    build={build}
                                                    passiveNumber={(monster.passives?.length ?? 0) + index + 1}
                                                    passiveCount={effectivePassives.length}
                                                    sourceLabel={sourceName}
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
