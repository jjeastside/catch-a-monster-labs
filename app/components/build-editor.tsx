"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
    EVOLUTION_STEP,
    MAX_EVOLUTION_PERCENT,
    MIN_EVOLUTION_PERCENT,
    clampEvolutionPercent,
    getEvolutionBarFill,
} from "../lib/calculations/evolution";
import type { Build, CombatContext, Mutation, PassiveEffect, Rank } from "../types/build";
import type { Monster } from "../types/monster";
import type { SkillStatusEffect } from "../types/skill";
import { ARMORS, WEAPONS, getEquipment } from "../data/equipments";
import { monsters } from "../data/monsters";
import { canSharePassiveFromTeammate, getPassiveDisplayName, getPassiveImagePath, getTransferablePassiveFromTeammate } from "../data/passives";
import { getAttribute, getAttributesForGear } from "../data/attributes";
import { getActiveAttributeIds, getAttributeSlotCount, getFixedAttributeIds } from "../lib/calculations/attributes";
import { getTraitEffectValue } from "../lib/calculations/traits";
import { assetPath } from "../lib/asset-path";
import {
    CURRENT_MAX_LEVEL,
    EXPERIMENTAL_MAX_LEVEL,
    MIN_LEVEL,
    getMaxLevel,
} from "../lib/level-config";
import {
    getActiveEnemyVulnerability,
    getActiveRallyingWarCryDamageIncrease,
    getEnemyVulnerability,
    getRallyingWarCryTeamDamageIncrease,
    getSkill,
} from "../data/skills";

import { CollapsibleSection } from "./collapsible-section";
import { EquipmentSelect } from "./equipment-select";
import { AttributeSelect } from "./attribute-select";
import { TraitSelect } from "./trait-select";
import { Panel } from "./panel";

const mutations: {
    id: Mutation;
    xId: Mutation;
    label: string;
    icon: string;
    effects: string[];
    xIcon: string;
    xEffects: string[];
    accent: string;
}[] = [
    {
        id: "huge",
        xId: "huge-x",
        label: "Huge",
        icon: "/icons/Huge.png",
        effects: [
            "+40% Health",
            "+40% Damage",
        ],
        xIcon: "/icons/huge-x.png",
        xEffects: ["+60% Health", "+60% Damage"],
        accent: "#e954d8",
    },
    {
        id: "shiny",
        xId: "shiny-x",
        label: "Shiny",
        icon: "/icons/Shiny.png",
        effects: [
            "+10% Damage",
            "+30% Crit Chance",
        ],
        xIcon: "/icons/shiny-x.png",
        xEffects: ["+25% Damage", "+35% Crit Chance"],
        accent: "#e8df39",
    },
    {
        id: "bloodlit",
        xId: "bloodlit-x",
        label: "Bloodlit",
        icon: "/icons/Bloodlit.png",
        effects: [
            "+10% Crit Chance",
            "+100% Crit Damage",
        ],
        xIcon: "/icons/bloodlit-x.png",
        xEffects: ["+15% Crit Chance", "+145% Crit Damage"],
        accent: "#ff515b",
    },
    {
        id: "fairy",
        xId: "fairy-x",
        label: "Fairy",
        icon: "/icons/Fairy.png",
        effects: [
            "-25% Incoming Damage",
            "-20% Cooldown",
        ],
        xIcon: "/icons/fairy-x.png",
        xEffects: ["-35% Incoming Damage", "-25% Cooldown"],
        accent: "#9f6cff",
    },
];

const combatContexts: Array<{ id: CombatContext; label: string }> = [
    { id: "standard", label: "Standard" },
    { id: "spire", label: "Spire" },
    { id: "rift", label: "Rift" },
    { id: "dungeon", label: "Dungeon" },
];

function getAggregatedMutationEffects(selectedMutations: Mutation[]) {
    const totals = new Map<string, number>();

    mutations.forEach((mutation) => {
        const isX = selectedMutations.includes(mutation.xId);
        const isNormal = selectedMutations.includes(mutation.id);
        if (!isX && !isNormal) return;

        const effects = isX ? mutation.xEffects : mutation.effects;
        effects.forEach((effect) => {
            const match = effect.match(/^([+-])(\d+(?:\.\d+)?)%\s+(.+)$/);
            if (!match) return;

            const [, sign, amount, stat] = match;
            const signedAmount = Number(amount) * (sign === "-" ? -1 : 1);
            totals.set(stat, (totals.get(stat) ?? 0) + signedAmount);
        });
    });

    return Array.from(totals, ([stat, value]) => ({
        stat,
        value,
        label: `${value >= 0 ? "+" : ""}${value}% ${stat}`,
    }));
}

const ranks: Rank[] = ["E", "D", "C", "B", "A", "S", "SS"];

const rankVisuals: Record<Rank, {
    color: string;
    activeBackground: string;
    labelBackground?: string;
}> = {
    E: {
        color: "#a3a3aa",
        activeBackground: "rgba(163,163,170,0.14)",
    },
    D: {
        color: "#35d328",
        activeBackground: "rgba(53,211,40,0.13)",
    },
    C: {
        color: "#23bfd3",
        activeBackground: "rgba(35,191,211,0.13)",
    },
    B: {
        color: "#e45bd8",
        activeBackground: "rgba(228,91,216,0.13)",
    },
    A: {
        color: "#ffad0a",
        activeBackground: "rgba(255,173,10,0.14)",
    },
    S: {
        color: "#67e879",
        activeBackground: "rgba(74,201,126,0.13)",
        labelBackground: "linear-gradient(100deg,#ff4545 4%,#ffd83d 25%,#43e86e 45%,#31cbea 65%,#8e62ff 82%,#ff58a8 100%)",
    },
    SS: {
        color: "#ff5a62",
        activeBackground: "rgba(255,90,98,0.14)",
    },
};

type SelectOption = {
    id: string;
    label: string;
};

type SelectFieldProps = {
    label: string;
    options: SelectOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    emptyLabel?: string;
};

function SelectField({
                         label,
                         options,
                         value,
                         onChange,
                         emptyLabel = "Select",
                     }: SelectFieldProps) {
    return (
        <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">
        {label}
      </span>

            <select
                value={value ?? ""}
                onChange={(event) =>
                    onChange(event.target.value || null)
                }
                className="w-full rounded-md border border-[#344050] bg-[#141c28] px-3 py-2 text-sm text-[#e3e8f1] outline-none focus:border-[#7182ff]"
            >
                {emptyLabel && (
                    <option value="">{emptyLabel}</option>
                )}

                {options.map((option, index) => (
                    <option key={`${option.id}-${index}`} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function HelpTooltip({
                         title,
                         text,
                         align = "center",
                     }: {
    title: string;
    text: string;
    align?: "center" | "left" | "right";
}) {
    return (
        <span className="group/help relative inline-flex">
            <span
                tabIndex={0}
                role="button"
                aria-label={`About ${title}`}
                className="grid size-5 place-items-center rounded-full border border-[#5c6a80] bg-[#141c28] text-[11px] font-black text-[#8e99ad] outline-none transition hover:border-[#7182ff] hover:text-[#7182ff] focus:border-[#7182ff] focus:text-[#7182ff]"
            >
                ?
            </span>
            <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-[70] mb-2 w-64 max-w-[calc(100vw-2rem)] translate-y-1 rounded-lg border border-[#344050] bg-[#0f1620] p-3 text-left text-xs font-normal leading-5 text-[#bfc7d5] opacity-0 shadow-2xl transition group-hover/help:translate-y-0 group-hover/help:opacity-100 group-focus-within/help:translate-y-0 group-focus-within/help:opacity-100 ${align === "right" ? "right-0" : align === "left" ? "left-0" : "left-0 sm:left-1/2 sm:-translate-x-1/2"}`}
            >
                <strong className="block font-semibold text-[#e3e8f1]">{title}</strong>
                <span className="mt-1 block">{text}</span>
            </span>
        </span>
    );
}

type GeneticPotentialSliderProps = {
    label: "Attack" | "Health";
    icon: string;
    value: number;
    color: string;
    onChange: (value: number) => void;
};

function GeneticPotentialSlider({
                                    label,
                                    icon,
                                    value,
                                    color,
                                    onChange,
                                }: GeneticPotentialSliderProps) {
    const filledSegments = value / 6;

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <img src={assetPath(icon)} alt="" className="size-6 rounded object-contain"/>
                    <span className="text-xs font-black uppercase tracking-wide text-[#e3e8f1]">
                        {label}
                    </span>
                </div>
                <strong className="text-sm font-black tabular-nums" style={{ color }}>
                    {value === 0 ? "0%" : `+${value}%`}
                </strong>
            </div>

            <div className="relative h-4">
                <div className="pointer-events-none absolute inset-0 grid grid-cols-10 gap-0.5 overflow-hidden rounded border border-[#41506a] bg-[#0d131d] p-0.5">
                    {Array.from({ length: 10 }, (_, index) => (
                        <span
                            key={index}
                            className="rounded-[2px] border border-white/[0.035]"
                            style={{
                                backgroundColor: index < filledSegments ? color : "#252b36",
                                opacity: index < filledSegments ? 1 : 0.72,
                            }}
                        />
                    ))}
                </div>
                <input
                    type="range"
                    min="0"
                    max="60"
                    step="6"
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    aria-label={`${label} Genetic Potential`}
                    className="absolute inset-0 h-4 w-full cursor-pointer appearance-none bg-transparent outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#0f1620] [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-0 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#0f1620] [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
                />
            </div>
        </div>
    );
}

type EvolutionMultiplierEditorProps = {
    value: number;
    onChange: (value: number) => void;
};

function EvolutionMultiplierEditor({
                                       value,
                                       onChange,
                                   }: EvolutionMultiplierEditorProps) {
    const [inputDraft, setInputDraft] = useState<string | null>(null);
    const [dragPreview, setDragPreview] = useState<number | null>(null);
    const [precisionRange, setPrecisionRange] = useState<{
        min: number;
        max: number;
    } | null>(null);
    const [precisionOverlay, setPrecisionOverlay] = useState<{
        left: number;
        top: number;
        width: number;
    } | null>(null);
    const dragState = useRef<{
        pointerId: number;
        left: number;
        top: number;
        width: number;
        overlayLeft: number;
        overlayWidth: number;
        startY: number;
        preview: number;
        precisionRange: { min: number; max: number } | null;
        precisionStartX: number | null;
        precisionStartValue: number | null;
    } | null>(null);
    const inputValue = inputDraft ?? value.toFixed(2);
    const displayedValue = dragPreview ?? value;

    const parsedValue = Number(inputValue);

    const isNumeric =
        inputValue.trim() !== "" &&
        Number.isFinite(parsedValue);

    const isOutOfRange =
        isNumeric &&
        (parsedValue < MIN_EVOLUTION_PERCENT ||
            parsedValue > MAX_EVOLUTION_PERCENT);

    const commitInputValue = () => {
        const normalizedValue = isNumeric
            ? clampEvolutionPercent(parsedValue)
            : value;

        onChange(normalizedValue);
        setInputDraft(null);
    };

    const evolutionBarFill = getEvolutionBarFill(displayedValue);
    const precisionFill = precisionRange
        ? ((displayedValue - precisionRange.min) /
        (precisionRange.max - precisionRange.min)) * 100
        : 0;

    return (
        <div>
            <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#e3e8f1]">EM</p>
                    <HelpTooltip
                        title="Evolution Multiplier (EM)"
                        text="EM is the percentage of an evolved monster's base Damage and Health used by the game. 100% keeps its normal base stats; for example, 160% gives 1.60× base Damage and Health. Drag normally for quick changes. While dragging, slide upward to open the 0.01% precision range, then release to apply."
                        align="left"
                    />
                </div>

                <label className="relative w-32">
                    <input
                        type="number"
                        min={MIN_EVOLUTION_PERCENT}
                        max={MAX_EVOLUTION_PERCENT}
                        step={EVOLUTION_STEP}
                        value={inputValue}
                        onChange={(event) => {
                            const nextInput = event.target.value;
                            const nextValue = Number(nextInput);

                            setInputDraft(nextInput);
                            if (
                                nextInput.trim() !== "" &&
                                Number.isFinite(nextValue) &&
                                nextValue >= MIN_EVOLUTION_PERCENT &&
                                nextValue <= MAX_EVOLUTION_PERCENT
                            ) {
                                onChange(nextValue);
                            }
                        }}
                        onBlur={commitInputValue}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                commitInputValue();
                                event.currentTarget.blur();
                            }
                        }}
                        aria-label="Exact EM percentage"
                        aria-invalid={!isNumeric || isOutOfRange}
                        className={`w-full rounded-md border bg-[#141c28] px-2.5 py-1.5 pr-6 text-right text-xs font-semibold tabular-nums text-[#e3e8f1] outline-none ${
                            !isNumeric || isOutOfRange
                                ? "border-[#ff7657] focus:border-[#ff7657]"
                                : "border-[#344050] focus:border-[#7182ff]"
                        }`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-[#7f8b9e]">%</span>
                </label>
            </div>

            <div className="relative">
                {precisionRange && (
                    <div
                        className="fixed z-[80] max-w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-full rounded-lg border border-[#f1a45c]/70 bg-[#0d131d]/95 px-3 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.48),0_0_18px_rgba(255,157,66,0.10)] backdrop-blur-sm"
                        style={{
                            left: precisionOverlay?.left ?? 0,
                            top: precisionOverlay?.top ?? 0,
                            width: precisionOverlay?.width,
                        }}
                    >
                        <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f3b170]">
                            Precision · 0.01%
                        </div>
                        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold tabular-nums text-[#8e99ad]">
                            <span>{precisionRange.min.toFixed(2)}%</span>
                            <strong className="rounded-md border border-[#f1a45c]/50 bg-[#342313] px-2.5 py-1 text-sm font-black text-white shadow-[0_0_12px_rgba(255,157,66,0.16)]">
                                EM:{displayedValue.toFixed(2)}%
                            </strong>
                            <span>{precisionRange.max.toFixed(2)}%</span>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-[#283140]">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-[#ff9d42]"
                                style={{ width: `${precisionFill}%` }}
                            />
                            <span
                                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#ff9d42] shadow-[0_0_0_3px_rgba(255,157,66,0.16)]"
                                style={{ left: `${precisionFill}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="relative rounded-lg border-2 border-[#f4d4b3] bg-[#343434] p-1 shadow-inner">
                    <div className="relative h-7 overflow-hidden rounded-md bg-[#3a3a3a]">
                        <div
                            className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffd2a3] via-[#ffb160] to-[#ff8a24]"
                            style={{ width: `${evolutionBarFill}%` }}
                        />

                        <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-sm font-black tabular-nums text-white [text-shadow:0_2px_0_#111,1px_0_0_#111,-1px_0_0_#111,0_-1px_0_#111]">
                        EM:{displayedValue.toFixed(2)}%
                    </span>

                        <input
                            type="range"
                            min={MIN_EVOLUTION_PERCENT}
                            max={MAX_EVOLUTION_PERCENT}
                            step={EVOLUTION_STEP}
                            value={value}
                            onPointerDown={(event) => {
                                event.preventDefault();
                                const track = event.currentTarget.parentElement?.getBoundingClientRect();
                                if (!track) {
                                    return;
                                }

                                const mainProgress = Math.min(
                                    1,
                                    Math.max(
                                        0,
                                        (event.clientX - (track.left + track.width / 2)) /
                                        (track.width / 2),
                                    ),
                                );
                                const preview = clampEvolutionPercent(
                                    MIN_EVOLUTION_PERCENT +
                                    mainProgress * (MAX_EVOLUTION_PERCENT - MIN_EVOLUTION_PERCENT),
                                );
                                const overlayWidth = Math.min(
                                    Math.max(track.width + 128, track.width * 1.28),
                                    window.innerWidth - 16,
                                );

                                dragState.current = {
                                    pointerId: event.pointerId,
                                    left: track.left,
                                    top: track.top,
                                    width: track.width,
                                    overlayLeft: track.left + track.width / 2,
                                    overlayWidth,
                                    startY: event.clientY,
                                    preview,
                                    precisionRange: null,
                                    precisionStartX: null,
                                    precisionStartValue: null,
                                };
                                event.currentTarget.setPointerCapture(event.pointerId);
                                setPrecisionRange(null);
                                setPrecisionOverlay(null);
                                setDragPreview(preview);
                            }}
                            onPointerMove={(event) => {
                                const drag = dragState.current;
                                if (!drag || drag.pointerId !== event.pointerId) {
                                    return;
                                }

                                if (!drag.precisionRange && drag.startY - event.clientY >= 24) {
                                    const desiredWidth = Math.max(
                                        drag.width + 128,
                                        drag.width * 1.28,
                                    );
                                    const availableHalfWidth = Math.max(
                                        0,
                                        Math.min(
                                            event.clientX - 8,
                                            window.innerWidth - event.clientX - 8,
                                        ),
                                    );

                                    drag.overlayLeft = event.clientX;
                                    drag.overlayWidth = Math.min(
                                        desiredWidth,
                                        availableHalfWidth * 2,
                                    );
                                    drag.precisionRange = {
                                        min: Math.max(MIN_EVOLUTION_PERCENT, drag.preview - 1),
                                        max: Math.min(MAX_EVOLUTION_PERCENT, drag.preview + 1),
                                    };
                                    drag.precisionStartX = event.clientX;
                                    drag.precisionStartValue = drag.preview;
                                    setPrecisionRange(drag.precisionRange);
                                    setPrecisionOverlay({
                                        left: drag.overlayLeft,
                                        top: drag.top - 12,
                                        width: drag.overlayWidth,
                                    });
                                    setDragPreview(drag.preview);
                                    return;
                                }

                                if (
                                    drag.precisionRange &&
                                    drag.precisionStartX !== null &&
                                    drag.precisionStartValue !== null
                                ) {
                                    const precisionSpan =
                                        drag.precisionRange.max - drag.precisionRange.min;
                                    drag.preview = clampEvolutionPercent(
                                        Math.min(
                                            drag.precisionRange.max,
                                            Math.max(
                                                drag.precisionRange.min,
                                                drag.precisionStartValue +
                                                ((event.clientX - drag.precisionStartX) / drag.overlayWidth) *
                                                precisionSpan,
                                            ),
                                        ),
                                    );
                                } else {
                                    const progress = Math.min(
                                        1,
                                        Math.max(
                                            0,
                                            (event.clientX - (drag.left + drag.width / 2)) /
                                            (drag.width / 2),
                                        ),
                                    );
                                    drag.preview = clampEvolutionPercent(
                                        MIN_EVOLUTION_PERCENT +
                                        progress * (MAX_EVOLUTION_PERCENT - MIN_EVOLUTION_PERCENT),
                                    );
                                }

                                setDragPreview(drag.preview);
                            }}
                            onPointerUp={(event) => {
                                const drag = dragState.current;
                                if (!drag || drag.pointerId !== event.pointerId) {
                                    return;
                                }

                                onChange(drag.preview);
                                setInputDraft(null);
                                setDragPreview(null);
                                setPrecisionRange(null);
                                setPrecisionOverlay(null);
                                dragState.current = null;
                                event.currentTarget.releasePointerCapture(event.pointerId);
                            }}
                            onPointerCancel={() => {
                                dragState.current = null;
                                setDragPreview(null);
                                setPrecisionRange(null);
                                setPrecisionOverlay(null);
                            }}
                            onChange={(event) => {
                                if (dragState.current) {
                                    return;
                                }

                                const nextValue = clampEvolutionPercent(
                                    Math.max(
                                        MIN_EVOLUTION_PERCENT,
                                        Number(event.target.value),
                                    ),
                                );
                                onChange(nextValue);
                                setInputDraft(null);
                            }}
                            aria-label="EM percentage"
                            aria-valuemin={MIN_EVOLUTION_PERCENT}
                            aria-valuemax={MAX_EVOLUTION_PERCENT}
                            aria-valuenow={displayedValue}
                            title="Drag upward while adjusting to open the precision slider."
                            className="absolute inset-0 z-20 h-full w-full cursor-ew-resize touch-none appearance-none bg-transparent opacity-0"
                        />
                    </div>
                </div>
            </div>

            {(!isNumeric || isOutOfRange) && (
                <p className="mt-2 text-[10px] text-[#ff9a7f]">
                    {!isNumeric
                        ? "Enter a valid EM percentage."
                        : `EM must be between ${MIN_EVOLUTION_PERCENT.toFixed(2)}% and ${MAX_EVOLUTION_PERCENT.toFixed(2)}%.`}
                </p>
            )}

        </div>
    );
}

type TeamEffectCategory =
    | "passive"
    | "criticalChance"
    | "damageIncrease"
    | "healing"
    | "shield"
    | "vulnerability"
    | "damageReduction"
    | "damageDecrease"
    | "damageReflection"
    | "stun"
    | "burn"
    | "poison"
    | "taunt"
    | "knockback";

type TeamPassiveContribution = {
    icon: string | null;
    text: string;
    category: TeamEffectCategory;
    target?: "Team" | "Enemy";
    skillName?: string;
};

type TeamPassiveOption = {
    id: string;
    label: string;
    image?: string;
    rarity?: Monster["rarity"];
    contributions: TeamPassiveContribution[];
    searchText: string;
};

const TEAM_EFFECT_FILTERS: Array<{ id: "all" | TeamEffectCategory; label: string; icon?: string | null }> = [
    {id: "all", label: "All", icon: null},
    {id: "criticalChance", label: "Critical Chance", icon: "/account-icons/critical-chance.png"},
    {id: "damageIncrease", label: "Team Damage", icon: "/icons/damage-increase.png"},
    {id: "healing", label: "Healing", icon: "/account-icons/health.png"},
    {id: "shield", label: "Shielding", icon: "/icons/attribute-resistance.png"},
    {id: "vulnerability", label: "Vulnerability", icon: "/icons/vulnerability.png"},
    {id: "damageReduction", label: "Damage Reduction", icon: "/icons/attribute-resistance.png"},
    {id: "damageDecrease", label: "Damage Decrease", icon: "/icons/damage-decrease.png"},
    {id: "damageReflection", label: "Reflection", icon: "/icons/damage-reflection.png"},
    {id: "stun", label: "Stun", icon: "/icons/stun-effect.png"},
    {id: "burn", label: "Burn", icon: "/icons/burn-effect.png"},
    {id: "poison", label: "Poison", icon: "/icons/poison-effect.png"},
    {id: "taunt", label: "Taunt", icon: "/icons/taunt.png"},
    {id: "knockback", label: "Knockback", icon: "/icons/knockback.png"},
    {id: "passive", label: "Passives", icon: null},
];

const TEAM_EFFECT_ICONS: Partial<Record<TeamEffectCategory, string>> = {
    damageIncrease: "/icons/damage-increase.png",
    healing: "/account-icons/health.png",
    shield: "/icons/attribute-resistance.png",
    vulnerability: "/icons/vulnerability.png",
    damageReduction: "/icons/attribute-resistance.png",
    damageDecrease: "/icons/damage-decrease.png",
    damageReflection: "/icons/damage-reflection.png",
    stun: "/icons/stun-effect.png",
    burn: "/icons/burn-effect.png",
    poison: "/icons/poison-effect.png",
    taunt: "/icons/taunt.png",
    knockback: "/icons/knockback.png",
};

const TEAM_EFFECT_LABELS: Partial<Record<TeamEffectCategory, string>> = {
    damageIncrease: "Damage Increase",
    healing: "Healing",
    shield: "Shield",
    vulnerability: "Vulnerability",
    damageReduction: "Damage Reduction",
    damageDecrease: "Damage Decrease",
    damageReflection: "Damage Reflection",
    stun: "Stun",
    burn: "Burn",
    poison: "Poison",
    taunt: "Taunt",
    knockback: "Knockback",
};

function formatTeamPassiveEffect(effect: PassiveEffect): string {
    if (typeof effect.value !== "number") {
        return "";
    }

    const amount = Math.abs(effect.value);
    const sign = effect.value < 0 ? "−" : "+";

    const labels: Record<PassiveEffect["stat"], string> = {
        damage: "Damage",
        incomingDamage: "Incoming Damage",
        critChance: "Crit Chance",
        critDamage: "Crit Damage",
        bossDamage: "Boss Damage",
        bossIncomingDamage: "Boss Incoming Damage",
        spireDamage: "Spire Damage",
        spireIncomingDamage: "Spire Incoming Damage",
        riftDamage: "Rift Damage",
        riftIncomingDamage: "Rift Incoming Damage",
        dungeonDamage: "Dungeon Damage",
        dungeonIncomingDamage: "Dungeon Incoming Damage",
        coinGain: "Coins",
        xpGain: "XP",
        rankLuck: "Rank Luck",
        healthRestore: "Health Restore",
        mutationRate: "Mutation Rate",
        stunImmunity: "Stun Immunity",
    };

    return `${sign}${amount}% ${labels[effect.stat]}`;
}

function formatTeamSkillEffect(effect: SkillStatusEffect): string {
    const category = effect.type as TeamEffectCategory;
    const label = TEAM_EFFECT_LABELS[category] ?? effect.type;

    if (category === "knockback") {
        return "Knockback";
    }

    const amount = typeof effect.amountPercent === "number" ? `${effect.amountPercent}% ` : "";
    const stacks = typeof effect.stacks === "number" ? `${effect.stacks} stack${effect.stacks === 1 ? "" : "s"} ` : "";
    const duration = typeof effect.durationSeconds === "number" ? ` · ${effect.durationSeconds}s` : "";
    const target = effect.target === "Team" ? "Team" : "Enemy";
    return `${amount}${stacks}${target} ${label}${duration}`;
}

function TeamContributionChip({
    contribution,
    compact = false,
}: {
    contribution: TeamPassiveContribution;
    compact?: boolean;
}) {
    return (
        <span
            className={`flex max-w-full items-start gap-1.5 rounded-lg border border-[#31405a] bg-[#141d2b] ${compact ? "px-2 py-1.5" : "px-2.5 py-2"}`}
        >
            {contribution.icon ? (
                <img
                    src={assetPath(contribution.icon)}
                    alt=""
                    className={`${compact ? "size-3.5" : "size-4"} mt-0.5 shrink-0 object-contain`}
                />
            ) : (
                <span className="mt-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-[#253149] text-[9px] text-[#c7cffc]">✦</span>
            )}
            <span className="min-w-0">
                {contribution.skillName && (
                    <span className={`${compact ? "text-[9px]" : "text-[10px]"} block whitespace-normal break-words font-semibold leading-tight text-[#eef2fb]`}>
                        {contribution.skillName}
                    </span>
                )}
                <span className={`${compact ? "text-[9px]" : "text-[10px]"} block whitespace-normal break-words font-medium leading-tight text-[#aeb8ff] ${contribution.skillName ? "mt-0.5" : ""}`}>
                    {contribution.text}
                </span>
            </span>
        </span>
    );
}

function TeamPassiveSelect({
                               label,
                               options,
                               value,
                               onChange,
                           }: {
    label: string;
    options: TeamPassiveOption[];
    value: string | null;
    onChange: (value: string | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [effectFilter, setEffectFilter] = useState<"all" | TeamEffectCategory>("all");
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selected = options.find((option) => option.id === value) ?? null;

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return options.filter((option) => {
            const matchesQuery = !normalizedQuery || option.searchText.includes(normalizedQuery);
            const matchesEffect = effectFilter === "all" || option.contributions.some(
                (contribution) =>
                    contribution.category === effectFilter ||
                    (effectFilter === "passive" && contribution.category === "criticalChance"),
            );
            return matchesQuery && matchesEffect;
        });
    }, [effectFilter, options, query]);

    return (
        <div ref={containerRef} className="relative min-w-0">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">
                {label}
            </span>

            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className={`flex min-h-[58px] w-full items-start justify-between gap-2 rounded-lg border border-[#344050] bg-[linear-gradient(180deg,#141c28_0%,#101823_100%)] px-2.5 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition ${open ? "border-[#6482ff] shadow-[0_0_0_1px_rgba(100,130,255,0.18)]" : "hover:border-[#5c6a80] hover:bg-[#172131]"}`}
            >
                {selected ? (
                    <span className="flex min-w-0 flex-1 items-start gap-2">
                        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#31405a] bg-[radial-gradient(circle_at_50%_35%,rgba(80,113,184,0.28),rgba(14,22,35,0.9)_75%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                            {selected.image ? (
                                <img
                                    src={assetPath(selected.image)}
                                    alt=""
                                    className="h-12 w-12 object-contain drop-shadow-[0_5px_7px_rgba(0,0,0,0.45)]"
                                />
                            ) : (
                                <span className="text-sm font-bold text-[#dfe5f6]">{selected.label.slice(0, 1)}</span>
                            )}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-[#eef2fb]">
                                {selected.label}
                            </span>
                            <span className="mt-1.5 flex max-w-full flex-col gap-1.5">
                                {selected.contributions.slice(0, 3).map((contribution, index) => (
                                    <TeamContributionChip key={`${contribution.skillName ?? "effect"}-${contribution.text}-${index}`} contribution={contribution} compact />
                                ))}
                                {selected.contributions.length > 3 && (
                                    <span className="pl-1 text-[10px] text-[#7f8b9e]">+{selected.contributions.length - 3} more</span>
                                )}
                            </span>
                        </span>
                    </span>
                ) : (
                    <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#31405a] bg-[#101722] text-[#6e7d94]">
                            +
                        </span>
                        <span>
                            <span className="block text-sm font-medium text-[#dce2ee]">None</span>
                            <span className="block text-[10px] text-[#7f8b9e]">Choose a teammate with transferable effects</span>
                        </span>
                    </span>
                )}
                <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[#31405a] bg-[#141c28] text-[#8e9bb0] transition-transform ${open ? "rotate-180" : ""}`}>
                    <svg viewBox="0 0 20 20" className="size-3.5 fill-current" aria-hidden="true">
                        <path d="M5.25 7.5 10 12.25 14.75 7.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {open && (
                <div className="absolute left-0 z-[90] mt-2 w-full max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-[#344050] bg-[rgba(12,18,30,0.97)] shadow-[0_18px_50px_rgba(0,0,0,0.52)] backdrop-blur-sm">
                    <div className="sticky top-0 z-10 border-b border-[#263142] bg-[rgba(12,18,30,0.98)] p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a7c0]">Select teammate</div>
                                <div className="text-[11px] text-[#6f7e95]">{filteredOptions.length} match{filteredOptions.length === 1 ? "" : "es"}</div>
                            </div>
                            {(query || effectFilter !== "all") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        setEffectFilter("all");
                                    }}
                                    className="rounded-full border border-[#334255] bg-[#131c28] px-2.5 py-1 text-[10px] font-semibold text-[#b5c1d4] transition hover:border-[#5d6d83] hover:text-[#eef2fb]"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#728198]">
                                <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8.5 3.75a4.75 4.75 0 1 0 2.988 8.445l2.908 2.908a.75.75 0 1 0 1.06-1.06l-2.907-2.909A4.75 4.75 0 0 0 8.5 3.75Zm-3.25 4.75a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0Z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search monster, skill, effect..."
                                className="w-full rounded-lg border border-[#344050] bg-[#111a26] py-2.5 pl-9 pr-9 text-sm text-[#e3e8f1] outline-none placeholder:text-[#65738a] focus:border-[#7182ff]"
                                autoFocus
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="absolute inset-y-0 right-2 flex items-center text-[#728198] transition hover:text-[#e3e8f1]"
                                >
                                    <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
                                        <path d="M5.72 5.72a.75.75 0 0 1 1.06 0L10 8.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L11.06 10l3.22 3.22a.75.75 0 1 1-1.06 1.06L10 11.06l-3.22 3.22a.75.75 0 1 1-1.06-1.06L8.94 10 5.72 6.78a.75.75 0 0 1 0-1.06Z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {TEAM_EFFECT_FILTERS.map((filter) => (
                                <span key={filter.id} className="group/filter relative inline-flex">
                                    <button
                                        type="button"
                                        onClick={() => setEffectFilter(filter.id)}
                                        aria-label={`Filter by ${filter.label}`}
                                        className={
                                            "relative inline-flex size-9 items-center justify-center rounded-lg border transition " +
                                            (effectFilter === filter.id
                                                ? "border-[#7182ff] bg-[#202846] text-[#dde4ff] shadow-[0_0_0_1px_rgba(113,130,255,0.14)]"
                                                : "border-[#2d3949] bg-[#141c28] text-[#8492a7] hover:border-[#526177] hover:bg-[#182131] hover:text-[#d6dce7]")
                                        }
                                    >
                                        {filter.icon ? (
                                            <img
                                                src={assetPath(filter.icon)}
                                                alt=""
                                                className="size-4 object-contain"
                                            />
                                        ) : (
                                            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#253149] text-[9px] text-[#c7cffc]">
                                                {filter.id === "all" ? "•" : "✦"}
                                            </span>
                                        )}
                                        <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full border border-[#46556c] bg-[#101722] text-[8px] font-black leading-none text-[#8795aa]">?</span>
                                    </button>
                                    <span
                                        role="tooltip"
                                        className="pointer-events-none absolute bottom-full left-1/2 z-[120] mb-2 w-max max-w-48 -translate-x-1/2 translate-y-1 rounded-md border border-[#344050] bg-[#0f1620] px-2 py-1.5 text-[10px] font-semibold text-[#d7deea] opacity-0 shadow-xl transition group-hover/filter:translate-y-0 group-hover/filter:opacity-100 group-focus-within/filter:translate-y-0 group-focus-within/filter:opacity-100"
                                    >
                                        {filter.label}
                                    </span>
                                </span>
                            ))}
                        </div>                    </div>

                    <div className="max-h-[360px] overflow-y-auto p-2">
                        <button
                            type="button"
                            onClick={() => {
                                onChange(null);
                                setOpen(false);
                            }}
                            className={
                                "mb-2 flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition " +
                                (value === null
                                    ? "border-[#5c72ff] bg-[#18223a]"
                                    : "border-[#233043] bg-[#111822] hover:border-[#44546a] hover:bg-[#151e2b]")
                            }
                        >
                            <span>
                                <span className="block text-sm font-semibold text-[#edf1fb]">None</span>
                                <span className="mt-0.5 block text-[11px] text-[#7f8b9e]">Do not use a teammate in this slot.</span>
                            </span>
                            {value === null && (
                                <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#5c72ff]/20 text-[#dce2ff]">
                                    <svg viewBox="0 0 20 20" className="size-3.5 fill-current" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.53 5.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 1 1 1.06-1.06l2.97 2.97 6.97-6.97a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                        </button>

                        {filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onChange(option.id);
                                    setOpen(false);
                                }}
                                className={
                                    "mb-2 w-full rounded-xl border px-3 py-3 text-left transition " +
                                    (value === option.id
                                        ? "border-[#5c72ff] bg-[#18223a] shadow-[0_0_0_1px_rgba(92,114,255,0.18)]"
                                        : "border-[#233043] bg-[#111822] hover:border-[#44546a] hover:bg-[#151e2b]")
                                }
                            >
                                <span className="flex items-start gap-3">
                                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#2a3950] bg-[radial-gradient(circle_at_50%_35%,rgba(80,113,184,0.28),rgba(14,22,35,0.9)_75%)]">
                                        {option.image ? (
                                            <img src={assetPath(option.image)} alt="" className="h-10 w-10 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)]" />
                                        ) : (
                                            <span className="text-sm font-bold text-[#dfe5f6]">{option.label.slice(0, 1)}</span>
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-start justify-between gap-3">
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-semibold text-[#edf1fb]">{option.label}</span>
                                                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-[#7f8b9e]">
                                                    {option.contributions.length} effect{option.contributions.length === 1 ? "" : "s"}
                                                </span>
                                            </span>
                                            {value === option.id && (
                                                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#5c72ff]/20 text-[#dce2ff]">
                                                    <svg viewBox="0 0 20 20" className="size-3.5 fill-current" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M16.53 5.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 1 1 1.06-1.06l2.97 2.97 6.97-6.97a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            )}
                                        </span>
                                        <span className="mt-2 flex flex-wrap gap-1.5">
                                            {option.contributions.slice(0, 4).map((contribution, index) => (
                                                <TeamContributionChip
                                                    key={`${option.id}-${contribution.skillName ?? "effect"}-${contribution.text}-${index}`}
                                                    contribution={contribution}
                                                />
                                            ))}
                                            {option.contributions.length > 4 && (
                                                <span className="inline-flex items-center rounded-full border border-[#2d3949] bg-[#141c28] px-2 py-1 text-[10px] font-medium text-[#7f8b9e]">
                                                    +{option.contributions.length - 4} more
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                </span>
                            </button>
                        ))}

                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-8 text-center">
                                <div className="text-sm font-semibold text-[#dbe3f1]">No matching teammates</div>
                                <div className="mt-1 text-[11px] text-[#65738a]">Try another search term or clear the current effect filter.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

type BuildEditorProps = {
    monster: Monster | null;
    build: Build;
    onBuildChangeAction: Dispatch<SetStateAction<Build>>;
    onResetAction: () => void;
    onOpenSaveBuildsAction: () => void;
    onOpenLoadBuildsAction: () => void;
    onShareBuildAction: () => void;
};

export function BuildEditor({
                                monster,
                                build,
                                onBuildChangeAction,
                                onResetAction,
                                onOpenSaveBuildsAction,
                                onOpenLoadBuildsAction,
                                onShareBuildAction,
                            }: BuildEditorProps) {
    const [experimentalLevelMode, setExperimentalLevelMode] = useState(false);
    const maxSelectableLevel = getMaxLevel(experimentalLevelMode);

    const [mutationHelpId, setMutationHelpId] = useState<string | null>(null);
    const [mutationEffectsOpen, setMutationEffectsOpen] = useState(false);
    const [geneticPotentialOpen, setGeneticPotentialOpen] = useState(false);

    const update = <K extends keyof Build>(
        key: K,
        value: Build[K],
    ) => {
        onBuildChangeAction((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const cycleMutation = (mutation: (typeof mutations)[number]) => {
        const withoutMutation = build.mutations.filter(
            (value) => value !== mutation.id && value !== mutation.xId,
        );

        if (build.mutations.includes(mutation.xId)) {
            update("mutations", withoutMutation);
        } else if (build.mutations.includes(mutation.id)) {
            update("mutations", [...withoutMutation, mutation.xId]);
        } else {
            update("mutations", [...withoutMutation, mutation.id]);
        }
    };

    const selectedWeapon = getEquipment(build.weaponId);
    const selectedArmor = getEquipment(build.armorId);
    const mutationHelp = mutations.find((mutation) => mutation.id === mutationHelpId) ?? null;
    const aggregatedMutationEffects = getAggregatedMutationEffects(build.mutations);
    const teammateIds = build.teammateMonsterIds ?? [null, null];
    const teammateMonsters = teammateIds.flatMap((monsterId) => {
        const teammate = monsters.find((candidate) => candidate.id === monsterId);
        return teammate ? [teammate] : [];
    });
    const rallyingWarCryDamageIncrease = getActiveRallyingWarCryDamageIncrease(
        monster?.skillIds ?? [],
        teammateMonsters.map((teammate) => teammate.skillIds),
    );
    const activeVulnerability = getActiveEnemyVulnerability(
        monster?.skillIds ?? [],
        teammateMonsters.map((teammate) => teammate.skillIds),
    );
    const monsterVulnerability = getEnemyVulnerability(monster?.skillIds ?? []);
    const vulnerabilityEffectiveness = monsterVulnerability >= activeVulnerability
        ? getTraitEffectValue(build.traitId, "vulnerabilityEffectiveness")
        : 0;
    const effectiveVulnerability = activeVulnerability * (1 + vulnerabilityEffectiveness / 100);
    const teammateOptions: TeamPassiveOption[] = monsters
        .filter((candidate) => candidate.id !== monster?.id)
        .map((candidate) => {
            const passiveContributions = (candidate.passives ?? [])
                .map(getTransferablePassiveFromTeammate)
                .filter((passive): passive is NonNullable<typeof passive> => passive !== null)
                .flatMap((passive) =>
                    passive.effects
                        .map((effect) => ({
                            icon: getPassiveImagePath(passive),
                            text: formatTeamPassiveEffect(effect),
                            category: effect.stat === "critChance" ? "criticalChance" as const : "passive" as const,
                            skillName: getPassiveDisplayName(passive),
                        }))
                        .filter((contribution) => contribution.text.length > 0),
                );

            const skillSearchParts: string[] = [];
            const skillContributions = candidate.skillIds.flatMap((skillId) => {
                const skill = getSkill(skillId);
                if (!skill) return [];

                skillSearchParts.push(skill.name, skill.description ?? "", skill.notes ?? "");

                return (skill.statusEffects ?? [])
                    .filter((effect) => effect.target === "Team" || effect.target === "Enemy")
                    .map((effect) => {
                        const category = effect.type as TeamEffectCategory;
                        return {
                            icon: TEAM_EFFECT_ICONS[category] ?? null,
                            text: formatTeamSkillEffect(effect),
                            category,
                            target: effect.target as "Team" | "Enemy",
                            skillName: skill.name,
                        };
                    });
            });

            const contributions = [...passiveContributions, ...skillContributions];
            const passiveSearchText = passiveContributions.map((contribution) => `${contribution.skillName ?? ""} ${contribution.text}`).join(" ");
            const contributionSearchText = contributions.map((contribution) => contribution.text).join(" ");

            return {
                id: candidate.id,
                label: candidate.name,
                image: candidate.image,
                rarity: candidate.rarity,
                contributions,
                searchText: [
                    candidate.name,
                    passiveSearchText,
                    contributionSearchText,
                    ...skillSearchParts,
                ].join(" ").toLowerCase(),
            };
        })
        .filter((option) => option.contributions.length > 0);

    const updateTeammate = (slot: 0 | 1, monsterId: string | null) => {
        onBuildChangeAction((current) => {
            const currentIds = current.teammateMonsterIds ?? [null, null];
            const nextIds: [string | null, string | null] = [
                currentIds[0] ?? null,
                currentIds[1] ?? null,
            ];

            if (monsterId && nextIds[slot === 0 ? 1 : 0] === monsterId) {
                nextIds[slot === 0 ? 1 : 0] = null;
            }

            nextIds[slot] = monsterId;

            return {
                ...current,
                teammateMonsterIds: nextIds,
            };
        });
    };
    const hasHpConditionalAttribute = getActiveAttributeIds(build)
        .map(getAttribute)
        .some((attribute) => Boolean(attribute?.hpCondition));
    const hasHpConditionalPassive = [
        ...(monster?.passives ?? []),
        ...teammateIds.flatMap((id) =>
            id ? monsters.find((candidate) => candidate.id === id)?.passives ?? [] : [],
        ),
    ].some((passive) => typeof passive.condition === "number");

    const updateAttribute = (
        key: "weaponAttributeIds" | "armorAttributeIds",
        index: number,
        value: string | null,
    ) => {
        const next = [...build[key]];
        if (value) next[index] = value;
        else next.splice(index, 1);
        update(key, next.filter(Boolean));
    };

    const updateLevel = (value: string) => {
        if (build.combatContext === "dungeon") return;

        const level = Number(value);

        if (
            Number.isInteger(level) &&
            level >= MIN_LEVEL &&
            level <= maxSelectableLevel
        ) {
            update("level", level);
        }
    };

    const updateCombatContext = (context: CombatContext) => {
        onBuildChangeAction((current) => {
            const isEnteringDungeon =
                current.combatContext !== "dungeon" && context === "dungeon";
            const isLeavingDungeon =
                current.combatContext === "dungeon" && context !== "dungeon";

            if (isEnteringDungeon) {
                return {
                    ...current,
                    combatContext: context,
                    preDungeonLevel: current.level,
                    level: 60,
                };
            }

            if (isLeavingDungeon) {
                return {
                    ...current,
                    combatContext: context,
                    level: current.preDungeonLevel ?? current.level,
                    preDungeonLevel: null,
                };
            }

            return {
                ...current,
                combatContext: context,
            };
        });
    };

    const updateEnhancement = (value: number) => {
        update("enhancement", Math.max(0, Math.min(10, value)));
    };

    return (
        <Panel
            eyebrow="Customize"
            title="Build Editor"
            action={
                <button
                    type="button"
                    onClick={onResetAction}
                    className="text-xs font-medium text-[#8e99ad]"
                >
                    Reset
                </button>
            }
        >
            <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-2 overflow-visible p-3 lg:overflow-x-hidden lg:overflow-y-auto">
                {!monster && (
                    <div className="rounded-lg border border-dashed border-[#344050] bg-[#0d131d]/45 p-4 text-center">
                        <p className="text-sm font-medium text-[#e3e8f1]">
                            No monster selected
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#7f8b9e]">
                            Pick a monster from the browser to begin editing
                            its build.
                        </p>
                    </div>
                )}

                <CollapsibleSection title="Pet">
                    <div className="space-y-4">
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label
                                    htmlFor="build-level-slider"
                                    className="text-xs font-medium text-[#bfc7d5]"
                                >
                                    Level
                                </label>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="build-level-number"
                                        name="build-level-number"
                                        type="number"
                                        min={MIN_LEVEL}
                                        max={maxSelectableLevel}
                                        step="1"
                                        value={build.level}
                                        onChange={(event) => updateLevel(event.target.value)}
                                        disabled={build.combatContext === "dungeon"}
                                        aria-label="Monster level"
                                        title={build.combatContext === "dungeon" ? "Dungeon mode forces Level 60." : undefined}
                                        className="w-[4.25rem] appearance-none rounded-md border border-[#344050] bg-[#0f1620] px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-[#e3e8f1] outline-none transition focus:border-[#4d96ff] disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <span className="text-xs tabular-nums text-[#7f8b9e]">/ {maxSelectableLevel}</span>
                                </div>
                            </div>

                            <input
                                id="build-level-slider"
                                type="range"
                                min={MIN_LEVEL}
                                max={maxSelectableLevel}
                                step="1"
                                value={build.level}
                                onChange={(event) => updateLevel(event.target.value)}
                                disabled={build.combatContext === "dungeon"}
                                title={build.combatContext === "dungeon" ? "Dungeon mode forces Level 60." : undefined}
                                style={{
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((build.level - MIN_LEVEL) / (maxSelectableLevel - MIN_LEVEL)) * 100}%, #283140 ${((build.level - MIN_LEVEL) / (maxSelectableLevel - MIN_LEVEL)) * 100}%, #283140 100%)`,
                                }}
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none disabled:cursor-not-allowed disabled:opacity-60 [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(59,130,246,0.16)]"
                            />
                        </div>

                        <div>
                            <p className="mb-1.5 text-xs font-medium text-[#bfc7d5]">Rank</p>
                            <div className="grid w-full min-w-0 grid-cols-[repeat(7,minmax(0,1fr))] overflow-hidden rounded-lg border border-[#344050] bg-[#0d131d]">
                                {ranks.map((rank, index) => {
                                    const selected = build.rank === rank;
                                    const visual = rankVisuals[rank];

                                    return (
                                        <button
                                            key={rank}
                                            type="button"
                                            onClick={() => update("rank", rank)}
                                            aria-pressed={selected}
                                            style={{
                                                background: selected ? visual.activeBackground : undefined,
                                                boxShadow: selected
                                                    ? `inset 0 0 0 1px ${visual.color}99, inset 0 1px 0 rgba(255,255,255,0.08)`
                                                    : undefined,
                                            }}
                                            className={`min-w-0 py-2 text-sm font-black tracking-wide transition hover:bg-[#141c28] ${index > 0 ? "border-l border-[#344050]" : ""}`}
                                        >
                                            <span
                                                style={visual.labelBackground
                                                    ? {
                                                        backgroundImage: visual.labelBackground,
                                                        backgroundClip: "text",
                                                        WebkitBackgroundClip: "text",
                                                        color: "transparent",
                                                        textShadow: "none",
                                                        filter: "drop-shadow(0 1px 0 #050608)",
                                                        display: "inline-block",
                                                        fontSize: "1rem",
                                                        fontWeight: 900,
                                                        lineHeight: 1,
                                                        transform: "scaleX(1.08)",
                                                    }
                                                    : {
                                                        color: visual.color,
                                                        textShadow: "-0.5px 0 #050608, 0.5px 0 #050608, 0 1px #050608",
                                                        display: "inline-block",
                                                        fontSize: "1rem",
                                                        fontWeight: 900,
                                                        lineHeight: 1,
                                                        transform: "scaleX(1.08)",
                                                    }}
                                            >
                                                {rank}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <p className="text-xs font-medium text-[#bfc7d5]">Enhancement</p>
                                <span className="text-xs tabular-nums text-[#7f8b9e]">+10 max</span>
                            </div>

                            <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] overflow-hidden rounded-lg border border-[#344050] bg-[#0d131d]">
                                <button
                                    type="button"
                                    onClick={() => updateEnhancement(build.enhancement - 1)}
                                    disabled={build.enhancement <= 0}
                                    aria-label="Decrease enhancement"
                                    className="border-r border-[#344050] py-2 text-base text-[#8e99ad] transition hover:bg-[#141c28] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    −
                                </button>

                                <div className={`grid place-items-center bg-[#0f1620] text-sm font-black tabular-nums [text-shadow:0_1px_0_#050608] ${build.enhancement === 0 ? "text-[#e3e8f1]" : "text-[#4d96ff]"}`}>
                                    +{build.enhancement}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => updateEnhancement(build.enhancement + 1)}
                                    disabled={build.enhancement >= 10}
                                    aria-label="Increase enhancement"
                                    className="border-l border-[#344050] py-2 text-base text-[#8e99ad] transition hover:bg-[#141c28] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {monster?.isEvolved && (
                            <EvolutionMultiplierEditor
                                key={monster.id}
                                value={build.evolutionPercent}
                                onChange={(value) =>
                                    update("evolutionPercent", value)
                                }
                            />
                        )}
                    </div>

                    <div className="mt-3 rounded-lg border border-[#344050] bg-[#0f1620]">
                        <div className="flex items-center pr-3 transition hover:bg-[#181d27]">
                            <button
                                type="button"
                                onClick={() => setGeneticPotentialOpen((open) => !open)}
                                aria-expanded={geneticPotentialOpen}
                                aria-controls="genetic-potential-controls"
                                className="flex min-w-0 flex-1 items-center gap-2 p-3 pr-2 text-left"
                            >
                                <img
                                    src={assetPath("/icons/genetic-potential.png")}
                                    alt="Genetic Potential"
                                    className="size-7 shrink-0 object-contain"
                                />
                                <p className="text-sm font-semibold text-[#e3e8f1]">
                                    Genetic Potential
                                </p>
                                <span
                                    aria-hidden="true"
                                    className={`ml-auto text-xs text-[#7f8b9e] transition-transform ${geneticPotentialOpen ? "rotate-180" : ""}`}
                                >
                                    ▼
                                </span>
                            </button>
                            <HelpTooltip
                                title="Genetic Potential"
                                text="Adds separate percentage bonuses to Attack and Health. Drag or click either bar; each segment is 6%, up to 60%."
                                align="right"
                            />
                        </div>

                        {geneticPotentialOpen && (
                            <div id="genetic-potential-controls" className="border-t border-[#344050] p-3">
                                <div className="space-y-3">
                                    <GeneticPotentialSlider
                                        label="Attack"
                                        icon="/icons/breed-attack.png"
                                        value={build.damageGeneticPotential}
                                        color="#e743df"
                                        onChange={(value) => update("damageGeneticPotential", value)}
                                    />
                                    <GeneticPotentialSlider
                                        label="Health"
                                        icon="/icons/breed-health.png"
                                        value={build.healthGeneticPotential}
                                        color="#ff4f78"
                                        onChange={(value) => update("healthGeneticPotential", value)}
                                    />
                                </div>

                                {(build.damageGeneticPotential === 0 || build.healthGeneticPotential === 0) && (
                                    <p className="mt-3 rounded-md border border-[#f4bd6a]/35 bg-[#342612]/45 px-2.5 py-2 text-[10px] leading-4 text-[#f4bd6a]">
                                        <strong>⚠️ 0% GP In-Game Bug:</strong> Monsters with 0% Genetic Potential
                                        currently receive a minimum of <strong>6% Attack and 6% Health in-game</strong>.
                                        The calculator does <strong>not</strong> account for this bug and will calculate
                                        the selected <strong>0% GP as a true 0%</strong>. As a result, calculated stats
                                        will <strong>not match your monster&#39;s in-game stats</strong> when using 0% GP.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                </CollapsibleSection>

                <CollapsibleSection
                    title={
                        <span className="flex items-center gap-2">
                            <span>Mutations</span>
                            <span
                                className="rounded-full border border-[#41506a] bg-[#141c28] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[#8e99ad]">
                                {build.mutations.length} / 4
                            </span>
                        </span>
                    }
                >
                    <p className="mb-2.5 text-[11px] text-[#7f8b9e]">
                        Click to cycle: <span className="text-[#bfc7d5]">Normal → X → Off</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        {mutations.map((mutation) => {
                            const isX = build.mutations.includes(mutation.xId);
                            const isSelected = isX || build.mutations.includes(mutation.id);
                            const label = isX ? `${mutation.label} X` : mutation.label;
                            const stateLabel = isX ? "X Mutation" : isSelected ? "Selected" : "Not selected";

                            return (
                                <div key={mutation.id} className="relative min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => cycleMutation(mutation)}
                                        aria-pressed={isSelected}
                                        aria-label={`${label}. Click to ${isX ? "remove" : isSelected ? `upgrade to ${mutation.label} X` : "select"}.`}
                                        style={isSelected
                                            ? {
                                                borderColor: mutation.accent,
                                                backgroundColor: `${mutation.accent}12`,
                                                boxShadow: `inset 0 0 0 1px ${mutation.accent}25${isX ? `, 0 0 12px ${mutation.accent}20` : ""}`,
                                            }
                                            : undefined}
                                        className="group/mutation flex min-h-[58px] w-full items-center gap-2 rounded-lg border border-[#344050] bg-[#141c28] p-2 pr-8 text-left transition hover:border-[#5c6a80] hover:bg-[#1b202b]"
                                    >
                                        <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-[#41506a] bg-[#0d131d]">
                                            <img
                                                src={assetPath(isX ? mutation.xIcon : mutation.icon)}
                                                alt=""
                                                className={`size-9 object-contain transition ${isSelected ? "opacity-100" : "opacity-65 group-hover/mutation:opacity-90"}`}
                                            />
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block truncate text-xs font-semibold text-[#e3e8f1]">
                                                {mutation.label}
                                            </span>
                                            <span
                                                className="mt-0.5 block truncate text-[10px] font-medium"
                                                style={{ color: isSelected ? mutation.accent : "#7f8b9e" }}
                                            >
                                                {stateLabel}
                                            </span>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMutationHelpId((current) =>
                                            current === mutation.id ? null : mutation.id,
                                        )}
                                        aria-label={`About ${mutation.label}`}
                                        aria-expanded={mutationHelpId === mutation.id}
                                        className={`absolute right-2 top-1/2 z-10 grid size-5 -translate-y-1/2 place-items-center rounded-full border bg-[#141c28] text-[11px] font-black outline-none transition ${mutationHelpId === mutation.id ? "border-[#7182ff] text-[#7182ff]" : "border-[#5c6a80] text-[#8e99ad] hover:border-[#7182ff] hover:text-[#7182ff]"}`}
                                    >
                                        ?
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {mutationHelp && (
                        <div
                            className="mt-2.5 rounded-lg border p-3"
                            style={{
                                borderColor: `${mutationHelp.accent}70`,
                                backgroundColor: `${mutationHelp.accent}0d`,
                            }}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <img src={assetPath(mutationHelp.icon)} alt="" className="size-6 object-contain"/>
                                    <strong className="text-xs text-[#e3e8f1]">{mutationHelp.label}</strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMutationHelpId(null)}
                                    aria-label="Close mutation information"
                                    className="text-base leading-none text-[#7f8b9e] hover:text-[#e3e8f1]"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="mt-2 grid gap-2 text-[10px] sm:grid-cols-2">
                                <div className="rounded-md border border-[#344050] bg-[#0f1620] p-2 text-[#8e99ad]">
                                    <span className="mb-1 block font-semibold text-[#e3e8f1]">Normal</span>
                                    {mutationHelp.effects.join(" · ")}
                                </div>
                                <div className="rounded-md border border-[#344050] bg-[#0f1620] p-2 text-[#8e99ad]">
                                    <span className="mb-1 block font-semibold" style={{ color: mutationHelp.accent }}>X Mutation</span>
                                    {mutationHelp.xEffects.join(" · ")}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-3 overflow-hidden rounded-lg border border-[#344050] bg-[#0f1620]">
                        <button
                            type="button"
                            onClick={() => setMutationEffectsOpen((current) => !current)}
                            aria-expanded={mutationEffectsOpen}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-[#141c28]"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">
                                    Active Effects
                                </span>
                                <span className="rounded-full bg-[#202632] px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-[#8e99ad]">
                                    {aggregatedMutationEffects.length}
                                </span>
                            </span>
                            <span className="text-xs text-[#7f8b9e]">{mutationEffectsOpen ? "▲" : "▼"}</span>
                        </button>

                        {mutationEffectsOpen && (
                            <div className="border-t border-[#252c38] p-2.5">
                                {aggregatedMutationEffects.length === 0 ? (
                                    <p className="text-xs text-[#7f8b9e]">No mutations selected.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {aggregatedMutationEffects.map((effect) => (
                                            <span
                                                key={effect.stat}
                                                className="rounded-md border border-[#344050] bg-[#141c28] px-2 py-1 text-[10px] font-medium text-[#bfc7d5]"
                                            >
                                                {effect.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title={
                        <span className="flex items-center gap-2">
                            <span>Trait</span>
                            <span onClick={(event) => event.stopPropagation()}>
                                <HelpTooltip
                                    title="Traits"
                                    text="Traits use their own multiplier and can add conditional or unique combat effects. Exclusive traits occur naturally on their listed monster and require breeding to transfer to another pet."
                                    align="left"
                                />
                            </span>
                            {build.traitId && (
                                <span className="rounded-full border border-[#7182ff]/35 bg-[#202846] px-2 py-0.5 text-[10px] font-semibold text-[#aeb8ff]">1 / 1</span>
                            )}
                        </span>
                    }
                >
                    <TraitSelect
                        value={build.traitId}
                        onChangeAction={(value) => update("traitId", value)}
                    />
                </CollapsibleSection>

                <CollapsibleSection
                    title={
                        <span className="flex items-center gap-2">
                            <span>Equipment</span>
                            <span onClick={(event) => event.stopPropagation()}>
                                <HelpTooltip
                                    title="Equipment & Attributes"
                                    text="Weapons increase Damage, while Armor increases Health. Attributes add effects to skills and combat outcomes rather than directly changing base stats."
                                    align="left"
                                />
                            </span>
                        </span>
                    }
                >
                    <div className="grid grid-cols-2 gap-2">
                        <EquipmentSelect
                            label="Weapon"
                            value={build.weaponId}
                            onChangeAction={(value) => {
                                update("weaponId", value);
                                update("weaponAttributeIds", []);
                            }}
                            items={WEAPONS}
                        />

                        <EquipmentSelect
                            label="Armor"
                            value={build.armorId}
                            onChangeAction={(value) => {
                                update("armorId", value);
                                update("armorAttributeIds", []);
                            }}
                            items={ARMORS}
                        />
                    </div>
                    <div
                        className="mt-3 grid items-start gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
                        {[{
                            equipment: selectedWeapon,
                            type: "weapon" as const,
                            key: "weaponAttributeIds" as const
                        }, {
                            equipment: selectedArmor,
                            type: "armor" as const,
                            key: "armorAttributeIds" as const
                        }].map(({equipment, type, key}) => {
                            const slots = getAttributeSlotCount(equipment?.rarity);
                            const fixedIds = getFixedAttributeIds(equipment?.id ?? null);
                            const selectedIds = build[key];
                            return (
                                <div key={type}
                                     className="self-start space-y-2 rounded-md border border-[#252c38] bg-[#0f1620] p-2">
                                    <p className="text-xs font-semibold text-[#e3e8f1]">{type === "weapon" ? "Weapon" : "Armor"} Attributes</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {fixedIds.map((id) => {
                                            const attribute = getAttribute(id);
                                            return attribute ? (
                                                <div key={id}
                                                     className="relative grid aspect-[2.85/1] min-h-[54px] w-full place-items-center overflow-hidden rounded-md border border-[#ff9f43]/50 bg-[#0d131d] p-0.5">
                                                    <img src={assetPath(`/attributes/${id}.png`)} alt={attribute.name}
                                                         className="block h-auto w-full"/>
                                                    <span
                                                        className="absolute right-1 top-1 rounded bg-[#2a1a0d]/90 px-1 py-0.5 text-[8px] font-semibold text-[#ffb866]">FIXED</span>
                                                </div>
                                            ) : null;
                                        })}
                                        {Array.from({length: slots}, (_, index) => (
                                            <AttributeSelect
                                                key={index}
                                                label={`Slot ${index + 1}`}
                                                options={getAttributesForGear(type)}
                                                value={selectedIds[index] ?? null}
                                                usedIds={selectedIds}
                                                onChangeAction={(value) => updateAttribute(key, index, value)}
                                            />
                                        ))}
                                    </div>
                                    {!equipment && <p className="text-[10px] text-[#7f8b9e]">Select gear first.</p>}
                                    {equipment && slots === 0 && fixedIds.length === 0 &&
                                        <p className="text-[10px] text-[#7f8b9e]">Attributes require Legendary gear or
                                            higher.</p>}
                                </div>
                            );
                        })}
                    </div>

                </CollapsibleSection>

                <CollapsibleSection
                    title={
                        <span className="flex items-center gap-2">
                            <span>Team Effects</span>
                            <span onClick={(event) => event.stopPropagation()}>
                                <HelpTooltip
                                    title="Team Effects"
                                    text="Add up to 2 monsters with transferable combat passives or team skill effects. Non-transferable progression and self-only passives are hidden."
                                    align="left"
                                />
                            </span>
                        </span>
                    }
                >
                    <div className="grid gap-2">
                        {([0, 1] as const).map((slot) => {
                            const otherSlot = slot === 0 ? 1 : 0;
                            const options = teammateOptions.filter(
                                (option) => option.id !== teammateIds[otherSlot],
                            );

                            return (
                                <TeamPassiveSelect
                                    key={slot}
                                    label={`Teammate ${slot + 1}`}
                                    options={options}
                                    value={teammateIds[slot]}
                                    onChange={(value) => updateTeammate(slot, value)}
                                />
                            );
                        })}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Combat Conditions">
                    <p className="mb-2.5 text-[11px] leading-4 text-[#7f8b9e]">
                        Select encounter, target, and active skill effects used by damage and resistance calculations.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {combatContexts.map((context) => (
                            <button
                                key={context.id}
                                type="button"
                                onClick={() => updateCombatContext(context.id)}
                                aria-pressed={build.combatContext === context.id}
                                className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                                    build.combatContext === context.id
                                        ? "border-[#7182ff] bg-[#202846] text-[#aeb8ff]"
                                        : "border-[#344050] bg-[#141c28] text-[#8e99ad] hover:border-[#5c6a80] hover:text-[#e3e8f1]"
                                }`}
                            >
                                {context.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => update("targetIsBoss", !build.targetIsBoss)}
                        aria-pressed={build.targetIsBoss}
                        className={`mt-3 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                            build.targetIsBoss
                                ? "border-[#7182ff]/55 bg-[#202846] text-[#aeb8ff]"
                                : "border-[#344050] bg-[#141c28] text-[#8e99ad] hover:border-[#5c6a80] hover:text-[#e3e8f1]"
                        }`}
                    >
                        <span>Target is Boss</span>
                        <span>{build.targetIsBoss ? "Active" : "Inactive"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => update("targetStatused", !build.targetStatused)}
                        aria-pressed={build.targetStatused}
                        className={`mt-3 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                            build.targetStatused
                                ? "border-[#ff7448]/55 bg-[#3a201b]/45 text-[#ff9a7f]"
                                : "border-[#344050] bg-[#141c28] text-[#8e99ad] hover:border-[#5c6a80] hover:text-[#e3e8f1]"
                        }`}
                    >
                        <span>Target is Burning or Poisoned</span>
                        <span>{build.targetStatused ? "Active" : "Inactive"}</span>
                    </button>
                    {rallyingWarCryDamageIncrease > 0 && (
                        <button
                            type="button"
                            onClick={() => update("rallyingWarCryActive", !build.rallyingWarCryActive)}
                            aria-pressed={build.rallyingWarCryActive}
                            className={`mt-3 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                                build.rallyingWarCryActive
                                    ? "border-[#f0a14a]/55 bg-[#3a2818]/45 text-[#f3b767]"
                                    : "border-[#344050] bg-[#141c28] text-[#8e99ad] hover:border-[#5c6a80] hover:text-[#e3e8f1]"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <img src={assetPath("/icons/damage-increase.png")} alt="" className="size-5 object-contain" />
                                Rallying War Cry (+{rallyingWarCryDamageIncrease}% Damage)
                            </span>
                            <span>{build.rallyingWarCryActive ? "Active" : "Inactive"}</span>
                        </button>
                    )}
                    {activeVulnerability > 0 && (
                        <button
                            type="button"
                            onClick={() => update("vulnerabilityActive", !build.vulnerabilityActive)}
                            aria-pressed={build.vulnerabilityActive}
                            className={`mt-3 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                                build.vulnerabilityActive
                                    ? "border-[#b26fff]/55 bg-[#2b2040]/45 text-[#c99aff]"
                                    : "border-[#344050] bg-[#141c28] text-[#8e99ad] hover:border-[#5c6a80] hover:text-[#e3e8f1]"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <img src={assetPath("/icons/vulnerability.png")} alt="" className="size-5 object-contain" />
                                Vulnerability (+{effectiveVulnerability}% Damage Taken)
                            </span>
                            <span>{build.vulnerabilityActive ? "Active" : "Inactive"}</span>
                        </button>
                    )}
                    {(hasHpConditionalAttribute || hasHpConditionalPassive) && (
                        <label className="mt-3 block">
                            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Current HP for conditional effects</span>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="100" value={build.currentHpPercent} onChange={(event) => update("currentHpPercent", Number(event.target.value))} className="min-w-0 flex-1 accent-[#7182ff]" />
                                <span className="w-12 text-right text-sm font-semibold text-[#e3e8f1]">{build.currentHpPercent}%</span>
                            </div>
                        </label>
                    )}
                </CollapsibleSection>

                <CollapsibleSection title="Experimental Mode" defaultOpen={false}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-md border border-[#344050] bg-[#0f1620] px-3 py-2.5">
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-[#bfc7d5]">
                                    Experimental Levels
                                </p>
                                <p className="mt-1 text-[10px] leading-4 text-[#7f8b9e]">
                                    Level {CURRENT_MAX_LEVEL} is currently the in-game maximum. Enable this to preview levels {CURRENT_MAX_LEVEL + 1}–{EXPERIMENTAL_MAX_LEVEL} for the next update.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    const next = !experimentalLevelMode;
                                    setExperimentalLevelMode(next);

                                    if (!next && build.level > CURRENT_MAX_LEVEL) {
                                        update("level", CURRENT_MAX_LEVEL);
                                    }
                                }}
                                disabled={build.combatContext === "dungeon"}
                                aria-pressed={experimentalLevelMode}
                                className={`shrink-0 rounded-md border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] transition ${
                                    experimentalLevelMode
                                        ? "border-[#7182ff]/50 bg-[#202846] text-[#aeb8ff]"
                                        : "border-[#344050] bg-[#141c28] text-[#8e99ad] hover:border-[#465166] hover:text-[#e3e8f1]"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                {experimentalLevelMode ? "On" : "Off"}
                            </button>
                        </div>
                    </div>
                </CollapsibleSection>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onOpenSaveBuildsAction}
                        className="rounded-md bg-[#7182ff] px-3 py-2 text-xs font-bold text-[#0b1510]"
                    >
                        Save Build
                    </button>

                    <button
                        type="button"
                        onClick={onOpenLoadBuildsAction}
                        className="rounded-md border border-[#344050] bg-[#141c28] px-3 py-2 text-xs font-semibold text-[#e3e8f1]"
                    >
                        Load Build
                    </button>

                    <button
                        type="button"
                        onClick={onShareBuildAction}
                        disabled={!monster}
                        title={monster ? "Copy a link that recreates this build." : "Select a monster before sharing a build."}
                        className="rounded-md border border-[#7182ff]/45 bg-[#202846] px-3 py-2 text-xs font-bold text-[#c7ceff] transition hover:border-[#7182ff]/70 hover:bg-[#263052] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Share Build
                    </button>

                    <button
                        type="button"
                        onClick={onResetAction}
                        className="rounded-md border border-[#344050] bg-[#141c28] px-3 py-2 text-xs font-semibold text-[#e3e8f1]"
                    >
                        Reset
                    </button>
                </div>

            </div>
        </Panel>
    );
}
