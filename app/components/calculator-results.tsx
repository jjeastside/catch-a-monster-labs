import { useEffect, useRef, useState } from "react";
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
    getActiveEnemyVulnerability,
    getActiveRallyingWarCryDamageIncrease,
    getEnemyVulnerability,
    getMonsterDamageIncrease,
    getSkillDisplayName,
    getSkillTotalHits,
    getSkillTotalMultiplier,
} from "../data/skills";
import { getEquipment } from "../data/equipments";
import { getTrait } from "../data/traits";
import { calculateSkillAttributeEffects } from "../lib/calculations/attributes";
import { assetPath } from "../lib/asset-path";
import type { BuildSharePreview } from "../lib/build-sharing";
import { CURRENT_MAX_LEVEL, EXPERIMENTAL_MAX_LEVEL, MIN_LEVEL } from "../lib/level-config";

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
import type { SkillStatusEffect } from "../types/skill";
import type { Trait } from "../types/trait";

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

function DamageIncreaseEffect({ effect }: { effect: SkillStatusEffect }) {
    const targetLabel = effect.target === "Team" ? "Team" : "Self";
    const durationLabel = `${formatNumber(effect.durationSeconds ?? 2)}s`;
    const tooltip = [
        `Increases ${targetLabel.toLowerCase()} damage by ${formatNumber(effect.amountPercent ?? 0)}%.`,
        `Lasts ${durationLabel}.`,
        effect.condition ? `Requires: ${effect.condition}.` : null,
    ].filter(Boolean).join(" ");

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#f0a14a]/35 bg-[#3a2818]/45 px-3 py-2">
            <img
                src={assetPath("/icons/damage-increase.png")}
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#f3b767]">
                        Damage Increase
                    </p>
                    <InfoTooltip label="Explain Damage Increase" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    +{formatNumber(effect.amountPercent ?? 0)}%
                    <span className="ml-1.5 text-xs font-semibold text-[#c9a879]">{targetLabel}</span>
                    {durationLabel && (
                        <span className="ml-1.5 text-xs font-semibold text-[#8e99ad]">• {durationLabel}</span>
                    )}
                </p>
                {effect.condition && (
                    <p className="mt-0.5 truncate text-[10px] text-[#b7a58e]" title={effect.condition}>
                        {effect.condition}
                    </p>
                )}
            </div>
        </div>
    );
}

function VulnerabilityEffect({
    effect,
    effectivenessBonus = 0,
}: {
    effect: SkillStatusEffect;
    effectivenessBonus?: number;
}) {
    const targetLabel = effect.target === "Enemy" ? "Enemy" : "Self";
    const effectiveAmount = (effect.amountPercent ?? 0) * (1 + effectivenessBonus / 100);
    const durationLabel = effect.durationSeconds !== undefined
        ? `${formatNumber(effect.durationSeconds)}s`
        : null;
    const tooltip = [
        `${targetLabel} takes ${formatNumber(effectiveAmount)}% more incoming damage.`,
        effectivenessBonus > 0
            ? `Includes +${formatNumber(effectivenessBonus)}% Vulnerability Effectiveness.`
            : null,
        durationLabel ? `Lasts ${durationLabel}.` : null,
        effect.condition ? `Requires: ${effect.condition}.` : null,
    ].filter(Boolean).join(" ");

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#b26fff]/35 bg-[#2b2040]/45 px-3 py-2">
            <img src={assetPath("/icons/vulnerability.png")} alt="" className="size-8 shrink-0 object-contain" />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#c99aff]">Vulnerability</p>
                    <InfoTooltip label="Explain Vulnerability" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    +{formatNumber(effectiveAmount)}%
                    <span className="ml-1.5 text-xs font-semibold text-[#bda2d8]">{targetLabel}</span>
                    <span className="ml-1.5 text-xs font-semibold text-[#8e99ad]">• {durationLabel}</span>
                </p>
                {effect.condition && <p className="mt-0.5 truncate text-[10px] text-[#b7a6c7]" title={effect.condition}>{effect.condition}</p>}
            </div>
        </div>
    );
}

function StunEffect({ effect }: { effect: SkillStatusEffect }) {
    const durationLabel = `${formatNumber(effect.durationSeconds ?? 2)}s`;
    const tooltip = durationLabel
        ? `Prevents the enemy from acting for ${durationLabel}.`
        : "Temporarily prevents the enemy from acting.";

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#72b7ff]/35 bg-[#1d3048]/45 px-3 py-2">
            <img
                src={assetPath("/icons/stun-effect.png")}
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8ac5ff]">Stun</p>
                    <InfoTooltip label="Explain Stun" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    {durationLabel ?? "Temporary"}
                    <span className="ml-1.5 text-xs font-semibold text-[#a9c7e4]">Enemy</span>
                </p>
            </div>
        </div>
    );
}

function KnockbackEffect({ effect }: { effect: SkillStatusEffect }) {
    const targetLabel = effect.target === "Enemy" ? "Enemy" : effect.target;
    const tooltip = targetLabel === "Enemy"
        ? "Pushes the enemy away from the caster."
        : `Pushes the ${targetLabel.toLowerCase()} away.`;

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#e7e13d]/35 bg-[#383518]/45 px-3 py-2">
            <img
                src={assetPath("/icons/knockback.png")}
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#f0eb62]">Knockback</p>
                    <InfoTooltip label="Explain Knockback" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    {targetLabel}
                </p>
            </div>
        </div>
    );
}

function TauntEffect({ effect }: { effect: SkillStatusEffect }) {
    const targetLabel = effect.target === "Self" ? "Self" : "Enemy";
    const durationLabel = `${formatNumber(effect.durationSeconds ?? 2)}s`;
    const tooltip = effect.target === "Self"
        ? `Forces enemies to target the caster for ${durationLabel}.`
        : `Forces the affected enemy to target the caster for ${durationLabel}.`;

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#f5c934]/35 bg-[#3b2f16]/45 px-3 py-2">
            <img
                src={assetPath("/icons/taunt.png")}
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#ffd85c]">Taunt</p>
                    <InfoTooltip label="Explain Taunt" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    {durationLabel}
                    <span className="ml-1.5 text-xs font-semibold text-[#d8c58b]">{targetLabel}</span>
                </p>
            </div>
        </div>
    );
}

function PoisonEffect({ effect }: { effect: SkillStatusEffect }) {
    const stacks = effect.stacks ?? 1;
    const maxStacks = effect.maxStacks ?? 10;
    const damagePercent = effect.amountPercent ?? 0.4;
    const attackReduction = effect.attackReductionPercent ?? 4;
    const duration = effect.durationSeconds ?? 20;
    const tooltip = `Applies ${formatNumber(stacks)} ${stacks === 1 ? "stack" : "stacks"} for ${formatNumber(duration)} seconds. Poison deals one damage tick per second. Each stack deals ${formatNumber(damagePercent)}% of the enemy's current HP per tick and reduces its Attack by ${formatNumber(attackReduction)}%, up to ${formatNumber(maxStacks)} stacks.`;

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#21df6b]/35 bg-[#173626]/45 px-3 py-2">
            <img src={assetPath("/icons/poison-effect.png")} alt="" className="size-8 shrink-0 object-contain" />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#5aee91]">Poison</p>
                    <InfoTooltip label="Explain Poison" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    {formatNumber(stacks)} {stacks === 1 ? "Stack" : "Stacks"}
                    <span className="ml-1.5 text-xs font-semibold text-[#8bd2a6]">• {formatNumber(duration)}s</span>
                </p>
            </div>
        </div>
    );
}

function BurnEffect({
    effect,
    durationBonus = 0,
}: {
    effect: SkillStatusEffect;
    durationBonus?: number;
}) {
    const stacks = effect.stacks ?? 1;
    const maxStacks = effect.maxStacks ?? 10;
    const damagePercent = effect.amountPercent ?? 0.5;
    const baseDuration = effect.durationSeconds ?? 8;
    const duration = baseDuration * (1 + durationBonus / 100);
    const tooltip = [
        `Applies ${formatNumber(stacks)} ${stacks === 1 ? "stack" : "stacks"}.`,
        `Each stack deals ${formatNumber(damagePercent)}% of the enemy's Max HP per second for ${formatNumber(duration)} seconds, up to ${formatNumber(maxStacks)} stacks.`,
        durationBonus > 0 ? `Includes +${formatNumber(durationBonus)}% Burn Duration.` : null,
    ].filter(Boolean).join(" ");

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#ef2020]/35 bg-[#401b1b]/45 px-3 py-2">
            <img src={assetPath("/icons/burn-effect.png")} alt="" className="size-8 shrink-0 object-contain" />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#ff7777]">Burn</p>
                    <InfoTooltip label="Explain Burn" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    {formatNumber(stacks)} {stacks === 1 ? "Stack" : "Stacks"}
                    <span className="ml-1.5 text-xs font-semibold text-[#e3a0a0]">• {formatNumber(duration)}s</span>
                </p>
            </div>
        </div>
    );
}

function DamageDecreaseEffect({
    effect,
    effectivenessBonus = 0,
    effectivenessTrait,
}: {
    effect: SkillStatusEffect;
    effectivenessBonus?: number;
    effectivenessTrait?: Trait | null;
}) {
    const effectivenessMultiplier = 1 + effectivenessBonus / 100;
    const amount = (effect.amountPercent ?? 0) * effectivenessMultiplier;
    const maxAmount = effect.maxAmountPercent !== undefined
        ? effect.maxAmountPercent * effectivenessMultiplier
        : undefined;
    const amountLabel = maxAmount !== undefined
        ? `${formatNumber(amount)}–${formatNumber(maxAmount)}%`
        : `${formatNumber(amount)}%`;
    const targetLabel = effect.target === "Enemy" ? "Enemy" : effect.target;
    const durationLabel = effect.durationSeconds !== undefined
        ? `${formatNumber(effect.durationSeconds)}s`
        : null;
    const tooltip = [
        maxAmount !== undefined
            ? `Reduces ${targetLabel.toLowerCase()} damage dealt by ${amountLabel}.`
            : `Reduces ${targetLabel.toLowerCase()} damage dealt by ${formatNumber(amount)}%.`,
        effectivenessBonus > 0
            ? `Includes +${formatNumber(effectivenessBonus)}% Attack Reduction Effectiveness from ${effectivenessTrait?.name ?? "the selected trait"}.`
            : null,
        durationLabel ? `Lasts ${durationLabel}.` : null,
        effect.condition ? `Requires: ${effect.condition}.` : null,
    ].filter(Boolean).join(" ");

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#e06b72]/35 bg-[#3c1d24]/45 px-3 py-2">
            <img
                src={assetPath("/icons/damage-decrease.png")}
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#f08a91]">Damage Decrease</p>
                    <InfoTooltip label="Explain Damage Decrease" text={tooltip} />
                </div>
                <p className="mt-0.5 flex flex-wrap items-center text-sm font-bold text-[#f6f8fc]">
                    <span
                        style={effectivenessBonus > 0 ? {
                            display: "inline-block",
                            backgroundImage: "linear-gradient(90deg, #ff2f7f, #a24cff 27%, #15d3ff 50%, #4dff70 72%, #ffb12e)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                            WebkitTextFillColor: "transparent",
                        } : undefined}
                        className={effectivenessBonus > 0 ? "vitiate-rainbow-value" : undefined}
                    >-{amountLabel}</span>
                    <span className="ml-1.5 text-xs font-semibold text-[#d8a1a5]">{targetLabel}</span>
                    {durationLabel && <span className="ml-1.5 text-xs font-semibold text-[#8e99ad]">• {durationLabel}</span>}
                    {effectivenessBonus > 0 && effectivenessTrait && (
                        <span
                            className="ml-1 inline-flex scale-[0.68] origin-center"
                            title={`${effectivenessTrait.name}: +${formatNumber(effectivenessBonus)}% Attack Reduction Effectiveness`}
                        >
                            <TraitIcon trait={effectivenessTrait} size="combat" />
                        </span>
                    )}
                </p>
                {effect.condition && (
                    <p className="mt-0.5 truncate text-[10px] text-[#c7a2a5]" title={effect.condition}>
                        {effect.condition}
                    </p>
                )}
            </div>
        </div>
    );
}

function DamageReductionEffect({ effect }: { effect: SkillStatusEffect }) {
    const amount = effect.amountPercent ?? 0;
    const targetLabel = effect.target === "Self" ? "Self" : effect.target;
    const durationLabel = effect.durationSeconds !== undefined
        ? `${formatNumber(effect.durationSeconds)}s`
        : null;
    const tooltip = [
        `Reduces incoming damage taken by ${formatNumber(amount)}%.`,
        targetLabel !== "Self" ? `Applies to ${targetLabel.toLowerCase()}.` : "Applies to the caster.",
        `Lasts ${durationLabel}.`,
        effect.condition ? `Requires: ${effect.condition}.` : null,
    ].filter(Boolean).join(" ");

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#67b7e8]/35 bg-[#173247]/45 px-3 py-2">
            <img
                src={assetPath("/icons/attribute-resistance.png")}
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#82c8f2]">Damage Reduction</p>
                    <InfoTooltip label="Explain Damage Reduction" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    -{formatNumber(amount)}% Incoming
                    <span className="ml-1.5 text-xs font-semibold text-[#9fc5dc]">{targetLabel}</span>
                    <span className="ml-1.5 text-xs font-semibold text-[#8e99ad]">• {durationLabel}</span>
                </p>
                {effect.condition && (
                    <p className="mt-0.5 truncate text-[10px] text-[#9fc5dc]" title={effect.condition}>
                        {effect.condition}
                    </p>
                )}
            </div>
        </div>
    );
}

function HealingEffect({ effect, calculatedAmount, cooldown, description }: {
    effect: SkillStatusEffect;
    calculatedAmount: number | null;
    cooldown: number | null;
    description?: string;
}) {
    const amount = effect.amountPercent ?? 0;
    const displayTarget = effect.target === "Team" ? "Team" : effect.target === "Self" ? "Self" : "Enemy";
    const targetLabel = effect.target === "Self" ? "the caster" : "the team";
    const healingDescription = effect.scaling === "Damage"
        ? `Heals ${targetLabel} for ${formatNumber(amount)}% of the caster's Damage, including healing effectiveness bonuses.`
        : effect.scaling === "MaxHealth"
            ? calculatedAmount !== null
                ? `Heals ${targetLabel} for ${formatNumber(amount)}% of the caster's Max Health, including healing effectiveness bonuses.`
                : effect.target === "Self"
                    ? `Restores ${formatNumber(amount)}% of the caster's Max HP.`
                    : `Heals affected allies for ${formatNumber(amount)}% of their own Max Health.`
            : `Heals ${targetLabel} by ${formatNumber(amount)}%.`;
    const tooltip = [
        description ?? healingDescription,
        "Healing cannot critically heal.",
        effect.condition ? `Requires: ${effect.condition}.` : null,
    ].filter(Boolean).join(" ");

    return (
        <>
        <div className="min-w-0 rounded-lg border border-[#65d58a]/35 bg-[#173627]/45 p-3">
            <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[#7ee6a0]">
                    <img src={assetPath("/account-icons/health.png")} alt="" className="size-4 shrink-0 object-contain" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#7ee6a0]">Healing</p>
                    <InfoTooltip label="Explain Healing" text={tooltip} />
                </div>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-[#f6f8fc]">
                    {calculatedAmount !== null ? formatStatNumber(calculatedAmount) : `${formatNumber(amount)}%`}
                    <span className="ml-1.5 text-xs font-semibold text-[#9fd8b2]">{displayTarget}</span>
                </p>
                {effect.condition && (
                    <p className="mt-0.5 truncate text-[10px] text-[#9fc5dc]" title={effect.condition}>
                        {effect.condition}
                    </p>
                )}
            </div>
        </div>
        {calculatedAmount !== null && cooldown !== null && cooldown > 0 && (
            <div className="min-w-0 rounded-lg border border-[#65d58a]/35 bg-[#173627]/45 p-3">
                <div className="flex items-center gap-1.5 text-[#7ee6a0]">
                    <img src={assetPath("/account-icons/health.png")} alt="" className="size-4 shrink-0 object-contain" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em]">HPS</p>
                    <InfoTooltip label="Explain healing per second" text={`${formatStatNumber(calculatedAmount)} Healing ÷ ${formatNumber(cooldown)}s cooldown. Healing cannot critically heal.${effect.condition ? ` Requires: ${effect.condition}.` : ""}`} />
                </div>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-[#f6f8fc]">
                    {formatStatNumber(calculatedAmount / cooldown)}
                    <span className="ml-1 text-xs font-semibold text-[#9fd8b2]">/s</span>
                </p>
            </div>
        )}
        </>
    );
}

function DamageReflectionEffect({ effect }: { effect: SkillStatusEffect }) {
    const amount = effect.amountPercent ?? 0;
    const targetLabel = effect.target === "Team" ? "Team" : effect.target === "Self" ? "Self" : "Enemy";
    const duration = effect.durationSeconds ?? 2;
    const tooltip = [
        `Reflects ${formatNumber(amount)}% of incoming damage back to the attacker.`,
        `Lasts ${formatNumber(duration)} seconds.`,
        effect.condition ? `Requires: ${effect.condition}.` : null,
    ].filter(Boolean).join(" ");

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#a989ff]/35 bg-[#292044]/45 px-3 py-2">
            <img
                src={assetPath("/icons/damage-reflection.png")}
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#bba3ff]">Damage Reflection</p>
                    <InfoTooltip label="Explain Damage Reflection" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    {formatNumber(amount)}%
                    <span className="ml-1.5 text-xs font-semibold text-[#bba3d7]">{targetLabel}</span>
                    <span className="ml-1.5 text-xs font-semibold text-[#8e99ad]">• {formatNumber(duration)}s</span>
                </p>
                {effect.condition && (
                    <p className="mt-0.5 truncate text-[10px] text-[#bba3d7]" title={effect.condition}>
                        {effect.condition}
                    </p>
                )}
            </div>
        </div>
    );
}

function ShieldEffect({ effect }: { effect: SkillStatusEffect }) {
    const amount = effect.amountPercent ?? 0;
    const displayTarget = effect.target === "Team" ? "Team" : effect.target === "Self" ? "Self" : "Enemy";
    const durationLabel = `${formatNumber(effect.durationSeconds ?? 2)}s`;
    const targetLabel = effect.target === "Self" ? "the caster" : "the team";
    const scalingText = effect.scaling === "MaxHealth"
        ? " of Max Health"
        : "";
    const tooltip = [
        `Grants ${targetLabel} a shield equal to ${formatNumber(amount)}%${scalingText}.`,
        effect.durationSeconds !== undefined
            ? `Lasts ${formatNumber(effect.durationSeconds)} seconds.`
            : null,
        effect.chancePercent !== undefined
            ? `${formatNumber(effect.chancePercent)}% activation chance.`
            : null,
        effect.condition ? `Requires: ${effect.condition}.` : null,
    ].filter(Boolean).join(" ");

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#66b8ee]/35 bg-[#173147]/45 px-3 py-2">
            <img
                src={assetPath("/icons/attribute-resistance.png")}
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#82caf7]">Shield</p>
                    <InfoTooltip label="Explain Shield" text={tooltip} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#f6f8fc]">
                    {formatNumber(amount)}%
                    <span className="ml-1.5 text-xs font-semibold text-[#9fc5dc]">{displayTarget}</span>
                    <span className="ml-1.5 text-xs font-semibold text-[#8e99ad]">• {durationLabel}</span>
                </p>
                {effect.condition && (
                    <p className="mt-0.5 truncate text-[10px] text-[#9fc5dc]" title={effect.condition}>
                        {effect.condition}
                    </p>
                )}
            </div>
        </div>
    );
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
    // Max-HP restoration stays percentage-based; caster Health scaling is numeric.
    const match = notes?.match(/(\d+(?:\.\d+)?)% of (?:base )?health/i);
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

function InfoTooltip({ label, text, triggerText }: { label: string; text: string; triggerText?: string }) {
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
                onClick={showTooltip}
                onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
                className={triggerText ? "cursor-help underline decoration-dotted decoration-[#f4bd6a] underline-offset-4" : "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-current/50 leading-none opacity-80 transition hover:opacity-100 focus:opacity-100 focus:outline-none"}
            >
                {triggerText ?? <svg
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
                </svg>}
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
    const teammateSkillIdGroups = build.teammateMonsterIds.flatMap((monsterId) => {
        const teammate = monsters.find((candidate) => candidate.id === monsterId);
        return teammate ? [teammate.skillIds] : [];
    });
    const rallyingWarCryDamageIncrease = getActiveRallyingWarCryDamageIncrease(
        monster.skillIds,
        teammateSkillIdGroups,
    );
    const rallyingWarCryMultiplier = build.rallyingWarCryActive
        ? 1 + rallyingWarCryDamageIncrease / 100
        : 1;
    const ownVulnerability = getEnemyVulnerability(monster.skillIds);
    const activeVulnerability = getActiveEnemyVulnerability(monster.skillIds, teammateSkillIdGroups);
    const vulnerabilityEffectiveness = ownVulnerability >= activeVulnerability
        ? getTraitEffectValue(build.traitId, "vulnerabilityEffectiveness")
        : 0;
    const effectiveVulnerability = activeVulnerability * (1 + vulnerabilityEffectiveness / 100);
    const vulnerabilityMultiplier = build.vulnerabilityActive ? 1 + effectiveVulnerability / 100 : 1;

    const combatDamage = calculateCombatDamage({
        monster,
        baseDamage:
            stats.damage *
            totalMultiplier *
            traitDamageMultiplier *
            rallyingWarCryMultiplier *
            vulnerabilityMultiplier *
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
    const teammateSkillIdGroups = build.teammateMonsterIds.flatMap((monsterId) => {
        const teammate = monsters.find((candidate) => candidate.id === monsterId);
        return teammate ? [teammate.skillIds] : [];
    });
    const rallyingWarCryDamageIncrease = getActiveRallyingWarCryDamageIncrease(
        monster.skillIds,
        teammateSkillIdGroups,
    );
    const rallyingWarCryMultiplier = build.rallyingWarCryActive
        ? 1 + rallyingWarCryDamageIncrease / 100
        : 1;
    const monsterVulnerability = getEnemyVulnerability(monster.skillIds);
    const activeVulnerability = getActiveEnemyVulnerability(monster.skillIds, teammateSkillIdGroups);
    const vulnerabilityEffectiveness = monsterVulnerability >= activeVulnerability
        ? getTraitEffectValue(build.traitId, "vulnerabilityEffectiveness")
        : 0;
    const effectiveActiveVulnerability = activeVulnerability * (1 + vulnerabilityEffectiveness / 100);
    const effectiveMonsterVulnerability = monsterVulnerability * (1 + getTraitEffectValue(build.traitId, "vulnerabilityEffectiveness") / 100);
    const vulnerabilityMultiplier = build.vulnerabilityActive ? 1 + effectiveActiveVulnerability / 100 : 1;
    const notes = skill.notes?.toLowerCase() ?? "";
    const skillHasHealing =
        (skill.statusEffects ?? []).some((effect) => effect.type === "healing") ||
        getDamageHealingPercent(skill.notes) !== null ||
        getHealthHealingPercent(skill.notes) !== null;
    const skillHasCooldown = skill.cooldown !== null && skill.cooldown > 0;
    const appliesAttackReduction =
        (skill.statusEffects ?? []).some((effect) => effect.type === "damageDecrease") ||
        /attack.{0,20}(reduc|lower)|(?:reduc|lower).{0,20}attack/.test(notes);
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
        baseDamage: stats.damage * totalMultiplier * traitDamageMultiplier * rallyingWarCryMultiplier * vulnerabilityMultiplier * attributeEffects.skillDamageMultiplier * accountRiftDamageMultiplier,
        critMultiplier: stats.critMultiplier,
        combatContext: build.combatContext,
        targetIsBoss: build.targetIsBoss,
        currentHpPercent: build.currentHpPercent,
        passives: effectivePassives,
    });
    const monsterDamageIncrease = getMonsterDamageIncrease(monster.skillIds);
    const damageIncreaseCombatDamage = isDamagingSkill && monsterDamageIncrease > 0
        ? calculateCombatDamage({
            monster,
            baseDamage:
                stats.damage *
                totalMultiplier *
                traitDamageMultiplier *
                (1 + monsterDamageIncrease / 100) *
                vulnerabilityMultiplier *
                attributeEffects.skillDamageMultiplier *
                accountRiftDamageMultiplier,
            critMultiplier: stats.critMultiplier,
            combatContext: build.combatContext,
            targetIsBoss: build.targetIsBoss,
            currentHpPercent: build.currentHpPercent,
            passives: effectivePassives,
        })
        : null;
    const vulnerabilityCombatDamage = isDamagingSkill && effectiveMonsterVulnerability > 0
        ? calculateCombatDamage({
            monster,
            baseDamage:
                stats.damage *
                totalMultiplier *
                traitDamageMultiplier *
                rallyingWarCryMultiplier *
                (1 + effectiveMonsterVulnerability / 100) *
                attributeEffects.skillDamageMultiplier *
                accountRiftDamageMultiplier,
            critMultiplier: stats.critMultiplier,
            combatContext: build.combatContext,
            targetIsBoss: build.targetIsBoss,
            currentHpPercent: build.currentHpPercent,
            passives: effectivePassives,
        })
        : null;

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
                rallyingWarCryMultiplier *
                vulnerabilityMultiplier *
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
    const damageIncreaseDps =
        damageIncreaseCombatDamage !== null &&
        displayedCooldown !== null &&
        displayedCooldown > 0
            ? (
                damageIncreaseCombatDamage.normalDamage * (1 - critChance) +
                damageIncreaseCombatDamage.criticalDamage * critChance
            ) / displayedCooldown
            : null;
    const vulnerabilityDps =
        vulnerabilityCombatDamage !== null && displayedCooldown !== null && displayedCooldown > 0
            ? (
                vulnerabilityCombatDamage.normalDamage * (1 - critChance) +
                vulnerabilityCombatDamage.criticalDamage * critChance
            ) / displayedCooldown
            : null;

    // Any heal calculated from the caster's Damage or Health has a concrete HPS.
    const expectedHealing = healingAmount;
    const healingPerSecond =
        expectedHealing !== null &&
        displayedCooldown !== null &&
        displayedCooldown > 0
            ? expectedHealing / displayedCooldown
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
    const skillIconAliases: Record<string, string> = {
        "ghost-impact-vulnerability": "ghost-impact",
        "soul-reap-chain-vulnerability": "soul-reap-chain",
        "soul-reap-chain-scareharvest": "soul-reap-chain-poison",
    };
    const skillIconId = skillIconAliases[skill.id] ?? skill.id;
    const skillIconPath = `/skill-icons/${skillIconId}.png`;
    const elementIconPath = `/element-icons/${skill.element.toLowerCase()}.png`;
    const burnDurationBonus = getTraitEffectValue(build.traitId, "burnDuration");
    const attackReductionEffectiveness = getTraitEffectValue(build.traitId, "attackReductionEffectiveness");
    const damageIncreaseEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "damageIncrease",
    );
    const vulnerabilityEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "vulnerability",
    );
    const stunEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "stun",
    );
    const knockbackEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "knockback",
    );
    const tauntEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "taunt",
    );
    const poisonEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "poison",
    );
    const burnEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "burn",
    );
    const damageDecreaseEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "damageDecrease",
    );
    const damageReductionEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "damageReduction",
    );
    const healingEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "healing",
    );
    const shieldEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "shield",
    );
    const damageReflectionEffects = (skill.statusEffects ?? []).filter(
        (effect) => effect.type === "damageReflection",
    );

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

                        {skill.description?.trim() && (
                            <p className="mt-2 text-[11px] leading-relaxed text-[#a3aec0]">
                                {skill.description}
                            </p>
                        )}

                        {isTriggeredSkill && skill.notes && skill.notes.trim() !== skill.description?.trim() && (
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

                        {damageIncreaseCombatDamage && (
                            <>
                                <div className="min-w-0 rounded-lg border border-[#5363a8]/45 bg-[#20263a] p-3">
                                    <div className="flex items-center gap-1.5 text-[#aeb8ff]">
                                        <img src={assetPath("/icons/damage-increase.png")} alt="Damage Increase"
                                             title={`+${formatNumber(monsterDamageIncrease)}% Damage Increase`}
                                             className="size-4 shrink-0 object-contain"/>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em]">
                                            Normal
                                        </p>
                                        <InfoTooltip
                                            label="Explain increased skill damage"
                                            text={`${skillDisplayName} with +${formatNumber(monsterDamageIncrease)}% Damage Increase. If the same effect is active under Combat Conditions, it is not stacked twice.`}
                                        />
                                    </div>
                                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                                       title={formatStatNumber(damageIncreaseCombatDamage.normalDamage)}>
                                        {formatStatNumber(damageIncreaseCombatDamage.normalDamage)}
                                    </p>
                                </div>

                                <div className="min-w-0 rounded-lg border border-[#ff7448]/45 bg-[#43231f]/45 p-3">
                                    <div className="flex items-center gap-1.5 text-[#ff936d]">
                                        <img src={assetPath("/icons/damage-increase.png")} alt="Damage Increase"
                                             title={`+${formatNumber(monsterDamageIncrease)}% Damage Increase`}
                                             className="size-4 shrink-0 object-contain"/>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em]">
                                            Critical
                                        </p>
                                        <InfoTooltip
                                            label="Explain critical increased skill damage"
                                            text={`The critical ${skillDisplayName} result with +${formatNumber(monsterDamageIncrease)}% Damage Increase and the current ${formatNumber(stats.critMultiplier)}× critical multiplier.`}
                                        />
                                    </div>
                                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                                       title={formatStatNumber(damageIncreaseCombatDamage.criticalDamage)}>
                                        {formatStatNumber(damageIncreaseCombatDamage.criticalDamage)}
                                    </p>
                                </div>

                                {damageIncreaseDps !== null && (
                                    <div className="min-w-0 rounded-lg border border-[#7182ff]/35 bg-[#202846]/35 p-3">
                                        <div className="flex items-center gap-1.5 text-[#aeb8ff]">
                                            <img src={assetPath("/icons/damage-increase.png")} alt="Damage Increase"
                                                 title={`+${formatNumber(monsterDamageIncrease)}% Damage Increase`}
                                                 className="size-4 shrink-0 object-contain"/>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.1em]">DPS</p>
                                            <InfoTooltip
                                                label="Explain increased skill DPS"
                                                text={`Expected DPS for ${skillDisplayName} with +${formatNumber(monsterDamageIncrease)}% Damage Increase.`}
                                            />
                                        </div>
                                        <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]"
                                           title={`${formatStatNumber(damageIncreaseDps)} DPS`}>
                                            {formatStatNumber(damageIncreaseDps)}
                                            <span className="ml-1 text-xs font-semibold text-[#7f8b9e]">/s</span>
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {vulnerabilityCombatDamage && (
                            <>
                                <div className="min-w-0 rounded-lg border border-[#b26fff]/45 bg-[#2b2040]/45 p-3">
                                    <div className="flex items-center gap-1.5 text-[#c99aff]">
                                        <img src={assetPath("/icons/vulnerability.png")} alt="Vulnerability" title={`+${formatNumber(effectiveMonsterVulnerability)}% Damage Taken`} className="size-4 shrink-0 object-contain" />
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Normal</p>
                                        <InfoTooltip label="Explain vulnerable skill damage" text={`${skillDisplayName} against an enemy affected by +${formatNumber(effectiveMonsterVulnerability)}% Vulnerability. If Vulnerability is active under Combat Conditions, it is not stacked twice.`} />
                                    </div>
                                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]" title={formatStatNumber(vulnerabilityCombatDamage.normalDamage)}>{formatStatNumber(vulnerabilityCombatDamage.normalDamage)}</p>
                                </div>

                                <div className="min-w-0 rounded-lg border border-[#ff7448]/45 bg-[#43231f]/45 p-3">
                                    <div className="flex items-center gap-1.5 text-[#ff936d]">
                                        <img src={assetPath("/icons/vulnerability.png")} alt="Vulnerability" title={`+${formatNumber(effectiveMonsterVulnerability)}% Damage Taken`} className="size-4 shrink-0 object-contain" />
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em]">Critical</p>
                                        <InfoTooltip label="Explain critical vulnerable skill damage" text={`The critical ${skillDisplayName} result against an enemy with +${formatNumber(effectiveMonsterVulnerability)}% Vulnerability and the current ${formatNumber(stats.critMultiplier)}× critical multiplier.`} />
                                    </div>
                                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]" title={formatStatNumber(vulnerabilityCombatDamage.criticalDamage)}>{formatStatNumber(vulnerabilityCombatDamage.criticalDamage)}</p>
                                </div>

                                {vulnerabilityDps !== null && (
                                    <div className="min-w-0 rounded-lg border border-[#b26fff]/35 bg-[#2b2040]/35 p-3">
                                        <div className="flex items-center gap-1.5 text-[#c99aff]">
                                            <img src={assetPath("/icons/vulnerability.png")} alt="Vulnerability" title={`+${formatNumber(effectiveMonsterVulnerability)}% Damage Taken`} className="size-4 shrink-0 object-contain" />
                                            <p className="text-[9px] font-bold uppercase tracking-[0.1em]">DPS</p>
                                            <InfoTooltip label="Explain vulnerable skill DPS" text={`Expected DPS for ${skillDisplayName} against an enemy with +${formatNumber(effectiveMonsterVulnerability)}% Vulnerability.`} />
                                        </div>
                                        <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-[#f6f8fc]" title={`${formatStatNumber(vulnerabilityDps)} DPS`}>
                                            {formatStatNumber(vulnerabilityDps)}<span className="ml-1 text-xs font-semibold text-[#7f8b9e]">/s</span>
                                        </p>
                                    </div>
                                )}
                            </>
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

            {damageIncreaseEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {damageIncreaseEffects.map((effect, index) => (
                        <DamageIncreaseEffect
                            key={`${effect.type}-${effect.target}-${effect.amountPercent}-${effect.durationSeconds}-${index}`}
                            effect={effect}
                        />
                    ))}
                </div>
            )}

            {vulnerabilityEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {vulnerabilityEffects.map((effect, index) => (
                        <VulnerabilityEffect
                            key={`${effect.type}-${effect.target}-${effect.amountPercent}-${effect.durationSeconds}-${index}`}
                            effect={effect}
                            effectivenessBonus={effect.target === "Enemy"
                                ? getTraitEffectValue(build.traitId, "vulnerabilityEffectiveness")
                                : 0}
                        />
                    ))}
                </div>
            )}

            {stunEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {stunEffects.map((effect, index) => (
                        <StunEffect
                            key={`${effect.type}-${effect.target}-${effect.durationSeconds}-${index}`}
                            effect={effect}
                        />
                    ))}
                </div>
            )}

            {knockbackEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {knockbackEffects.map((effect, index) => (
                        <KnockbackEffect
                            key={`${effect.type}-${effect.target}-${index}`}
                            effect={effect}
                        />
                    ))}
                </div>
            )}

            {tauntEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {tauntEffects.map((effect, index) => (
                        <TauntEffect
                            key={`${effect.type}-${effect.target}-${effect.durationSeconds}-${index}`}
                            effect={effect}
                        />
                    ))}
                </div>
            )}

            {poisonEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {poisonEffects.map((effect, index) => (
                        <PoisonEffect
                            key={`${effect.type}-${effect.stacks}-${effect.durationSeconds}-${effect.amountPercent}-${index}`}
                            effect={effect}
                        />
                    ))}
                </div>
            )}

            {burnEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {burnEffects.map((effect, index) => (
                        <BurnEffect
                            key={`${effect.type}-${effect.stacks}-${effect.amountPercent}-${effect.durationSeconds}-${index}`}
                            effect={effect}
                            durationBonus={burnDurationBonus}
                        />
                    ))}
                </div>
            )}

            {damageDecreaseEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {damageDecreaseEffects.map((effect, index) => (
                        <DamageDecreaseEffect
                            key={`${effect.type}-${effect.target}-${effect.amountPercent}-${effect.maxAmountPercent}-${effect.durationSeconds}-${index}`}
                            effect={effect}
                            effectivenessBonus={attackReductionEffectiveness}
                            effectivenessTrait={attackReductionEffectiveness > 0 ? selectedTrait : null}
                        />
                    ))}
                </div>
            )}

            {damageReductionEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {damageReductionEffects.map((effect, index) => (
                        <DamageReductionEffect
                            key={`${effect.type}-${effect.target}-${effect.amountPercent}-${effect.durationSeconds}-${index}`}
                            effect={effect}
                        />
                    ))}
                </div>
            )}

            {healingEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {(skill.id === "holy-aura-djinn-lampyr" ? healingEffects.slice(0, 1) : healingEffects).map((effect, index) => (
                        <HealingEffect
                            key={`${effect.type}-${effect.target}-${effect.amountPercent}-${effect.scaling}-${index}`}
                            effect={effect}
                            description={skill.id === "holy-aura-djinn-lampyr"
                                ? "One team heal equal to 160% of the caster's Damage + 5% of the caster's Health, including healing effectiveness bonuses."
                                : undefined}
                            calculatedAmount={skill.id === "holy-aura-djinn-lampyr"
                                ? healingAmount
                                : effect.scaling === "Damage"
                                ? stats.damage * (effect.amountPercent ?? 0) / 100 * healingEffectivenessMultiplier
                                : effect.scaling === "MaxHealth" && healthHealingPercent !== null
                                    ? stats.health * (effect.amountPercent ?? 0) / 100 * healingEffectivenessMultiplier
                                    : null}
                            cooldown={displayedCooldown}
                        />
                    ))}
                </div>
            )}

            {shieldEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {shieldEffects.map((effect, index) => (
                        <ShieldEffect
                            key={`${effect.type}-${effect.target}-${effect.amountPercent}-${effect.durationSeconds}-${effect.chancePercent}-${index}`}
                            effect={effect}
                        />
                    ))}
                </div>
            )}

            {damageReflectionEffects.length > 0 && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2">
                    {damageReflectionEffects.map((effect, index) => (
                        <DamageReflectionEffect
                            key={`${effect.type}-${effect.target}-${effect.amountPercent}-${effect.durationSeconds}-${index}`}
                            effect={effect}
                        />
                    ))}
                </div>
            )}

            {!isDamagingSkill ? (
                <>
                    {(skill.statusEffects?.length ?? 0) === 0 ? (
                        <div className="mt-3 rounded-md border border-dashed border-[#344050] bg-[#0d131d]/45 p-3">
                            <p className="text-sm text-[#8e99ad]">
                                {skill.notes ?? "This skill does not deal damage."}
                            </p>
                        </div>
                    ) : null}

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
                                        {healingPerSecond !== null && displayedCooldown !== null && expectedHealing !== null && (
                                            <p className="mt-1.5">
                                                {formatStatNumber(healingAmount)} Healing ÷ {formatNumber(displayedCooldown)}s cooldown =
                                                <strong className="text-[#aeb8ff]">{formatStatNumber(healingPerSecond)} HPS</strong>
                                            </p>
                                        )}
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
                                                rallyingWarCryMultiplier *
                                                vulnerabilityMultiplier *
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
    const graphMaxLevel = build.level > CURRENT_MAX_LEVEL
        ? EXPERIMENTAL_MAX_LEVEL
        : CURRENT_MAX_LEVEL;
    const levels = Array.from(
        { length: graphMaxLevel - MIN_LEVEL + 1 },
        (_, index) => index + MIN_LEVEL,
    );
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
        padding.left +
        ((level - MIN_LEVEL) / (graphMaxLevel - MIN_LEVEL)) * plotWidth;
    const yForValue = (value: number) =>
        padding.top + plotHeight - (value / maxValue) * plotHeight;
    const path = points
        .map((value, index) =>
            `${index === 0 ? "M" : "L"} ${xForLevel(levels[index]).toFixed(2)} ${yForValue(value).toFixed(2)}`,
        )
        .join(" ");
    const currentValue = points[build.level - MIN_LEVEL] ?? 0;
    const accent = activeStat === "health" ? "#72df79" : "#ff7568";
    const graphTickLevels = [MIN_LEVEL, 20, 40, 60, 80, 100, graphMaxLevel]
        .filter((level, index, values) =>
            level <= graphMaxLevel && values.indexOf(level) === index,
        );

    return (
        <section className="min-w-0 rounded-xl border border-[#344050] bg-[#0f1620] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-[#e3e8f1]">Growth Preview</h3>
                    <p className="mt-1 text-xs text-[#7f8b9e]">Current build bonuses · Levels {MIN_LEVEL}–{graphMaxLevel}</p>
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
                    aria-label={`${activeStat} growth from level ${MIN_LEVEL} to ${graphMaxLevel}`}
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

                    {graphTickLevels.map((level) => (
                        <g key={level}>
                            <line x1={xForLevel(level)} x2={xForLevel(level)} y1={padding.top} y2={padding.top + plotHeight} stroke="#222a36"/>
                            <text x={xForLevel(level)} y={height - 12} textAnchor="middle" fill="#7f8b9e" fontSize="10">
                                {level}
                            </text>
                        </g>
                    ))}

                    <path
                        d={`${path} L ${xForLevel(graphMaxLevel)} ${padding.top + plotHeight} L ${xForLevel(MIN_LEVEL)} ${padding.top + plotHeight} Z`}
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
    onSharePreviewChange?: (preview: BuildSharePreview | null) => void;
};

export function CalculatorResults({
                                      monster,
                                      build,
                                      isFavorite,
                                      onToggleFavorite,
                                      onSharePreviewChange,
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

    const lastSharePreviewSignatureRef = useRef("");

    useEffect(() => {
        if (!onSharePreviewChange) return;

        if (!monster || !stats) {
            if (lastSharePreviewSignatureRef.current !== "") {
                lastSharePreviewSignatureRef.current = "";
                onSharePreviewChange(null);
            }
            return;
        }

        const preview = {
            monsterName: monster.name,
            rarity: monster.rarity,
            element: monster.element,
            damage: formatStatNumber(stats.damage),
            health: formatStatNumber(stats.health),
            critChance: `${formatNumber(stats.critChance)}%`,
            critMultiplier: `${formatNumber(stats.critMultiplier)}×`,
            imagePath: monster.image ? assetPath(monster.image) : undefined,
        };

        const signature = JSON.stringify(preview);

        // calculateStats() returns a fresh object during render. Without this
        // guard, the effect sees a new `stats` reference every render and sends
        // a fresh object back to AppShell, causing an infinite parent/child
        // update loop.
        if (signature === lastSharePreviewSignatureRef.current) return;

        lastSharePreviewSignatureRef.current = signature;
        onSharePreviewChange(preview);
    }, [
        monster,
        stats,
        onSharePreviewChange,
    ]);

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
