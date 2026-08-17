"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
    EVOLUTION_STEP,
    MAX_EVOLUTION_PERCENT,
    MIN_EVOLUTION_PERCENT,
    clampEvolutionPercent,
    getEvolutionBarFill,
} from "../lib/calculations/evolution";
import type { Build, Mutation, Rank } from "../types/build";
import type { Monster } from "../types/monster";
import { ARMORS, WEAPONS, getEquipment } from "../data/equipments";
import { getAttribute, getAttributesForGear } from "../data/attributes";
import { getActiveAttributeIds, getAttributeSlotCount, getFixedAttributeIds } from "../lib/calculations/attributes";

import { CollapsibleSection } from "./collapsible-section";
import { EquipmentSelect } from "./equipment-select";
import { AttributeSelect } from "./attribute-select";
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
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
        {label}
      </span>

            <select
                value={value ?? ""}
                onChange={(event) =>
                    onChange(event.target.value || null)
                }
                className="w-full rounded-md border border-[#303848] bg-[#1a1f2a] px-3 py-2 text-sm text-[#d8dee9] outline-none focus:border-[#7585ff]"
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
                className="grid size-5 place-items-center rounded-full border border-[#4b566a] bg-[#1a1f2a] text-[11px] font-black text-[#99a2b3] outline-none transition hover:border-[#7585ff] hover:text-[#7585ff] focus:border-[#7585ff] focus:text-[#7585ff]"
            >
                ?
            </span>
            <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-[70] mb-2 w-64 max-w-[calc(100vw-2rem)] translate-y-1 rounded-lg border border-[#303848] bg-[#131720] p-3 text-left text-xs font-normal leading-5 text-[#b8c0ce] opacity-0 shadow-2xl transition group-hover/help:translate-y-0 group-hover/help:opacity-100 group-focus-within/help:translate-y-0 group-focus-within/help:opacity-100 ${align === "right" ? "right-0" : align === "left" ? "left-0" : "left-1/2 -translate-x-1/2"}`}
            >
                <strong className="block font-semibold text-[#e8ebf0]">{title}</strong>
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
                    <img src={icon} alt="" className="size-6 rounded object-contain"/>
                    <span className="text-xs font-black uppercase tracking-wide text-[#e8ebf0]">
                        {label}
                    </span>
                </div>
                <strong className="text-sm font-black tabular-nums" style={{ color }}>
                    {value === 0 ? "0%" : `+${value}%`}
                </strong>
            </div>

            <div className="relative h-4">
                <div className="pointer-events-none absolute inset-0 grid grid-cols-10 gap-0.5 overflow-hidden rounded border border-[#3a4354] bg-[#11151e] p-0.5">
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
                    className="absolute inset-0 h-4 w-full cursor-pointer appearance-none bg-transparent outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#131720] [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-0 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#131720] [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
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
                    <p className="text-sm font-semibold text-[#e8ebf0]">EM</p>
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
                        className={`w-full rounded-md border bg-[#1a1f2a] px-2.5 py-1.5 pr-6 text-right text-xs font-semibold tabular-nums text-[#d8dee9] outline-none ${
                            !isNumeric || isOutOfRange
                                ? "border-[#ff7657] focus:border-[#ff7657]"
                                : "border-[#303848] focus:border-[#7585ff]"
                        }`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-[#788295]">%</span>
                </label>
            </div>

            <div className="relative">
                {precisionRange && (
                    <div
                        className="fixed z-[80] max-w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-full rounded-lg border border-[#f1a45c]/70 bg-[#11151e]/95 px-3 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.48),0_0_18px_rgba(255,157,66,0.10)] backdrop-blur-sm"
                        style={{
                            left: dragState.current
                                ? dragState.current.overlayLeft
                                : 0,
                            top: dragState.current ? dragState.current.top - 12 : 0,
                            width: dragState.current
                                ? dragState.current.overlayWidth
                                : undefined,
                        }}
                    >
                        <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f3b170]">
                            Precision · 0.01%
                        </div>
                        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold tabular-nums text-[#99a2b3]">
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
                                dragState.current = null;
                                event.currentTarget.releasePointerCapture(event.pointerId);
                            }}
                            onPointerCancel={() => {
                                dragState.current = null;
                                setDragPreview(null);
                                setPrecisionRange(null);
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

type BuildEditorProps = {
    monster: Monster | null;
    build: Build;
    onBuildChangeAction: Dispatch<SetStateAction<Build>>;
    onResetAction: () => void;
    onSaveAction: () => boolean;
    onLoadAction: () => boolean;
};

export function BuildEditor({
                                monster,
                                build,
                                onBuildChangeAction,
                                onResetAction,
                                onSaveAction,
                                onLoadAction,
                            }: BuildEditorProps) {
    const [mutationHelpId, setMutationHelpId] = useState<string | null>(null);
    const [mutationEffectsOpen, setMutationEffectsOpen] = useState(false);
    const [buildStorageMessage, setBuildStorageMessage] = useState<string | null>(null);

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
    const hasHpConditionalAttribute = getActiveAttributeIds(build)
        .map(getAttribute)
        .some((attribute) => Boolean(attribute?.hpCondition));

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
        const level = Number(value);

        if (
            Number.isInteger(level) &&
            level >= 1 &&
            level <= 105
        ) {
            update("level", level);
        }
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
                    className="text-xs font-medium text-[#99a2b3]"
                >
                    Reset
                </button>
            }
        >
            <div className="flex flex-1 flex-col gap-2 overflow-auto p-3">
                {!monster && (
                    <div className="rounded-lg border border-dashed border-[#303848] bg-[#11151e]/45 p-4 text-center">
                        <p className="text-sm font-medium text-[#d8dee9]">
                            No monster selected
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#788295]">
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
                                    className="text-xs font-medium text-[#c5cbd5]"
                                >
                                    Level
                                </label>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="105"
                                        step="1"
                                        value={build.level}
                                        onChange={(event) => updateLevel(event.target.value)}
                                        aria-label="Monster level"
                                        className="w-[4.25rem] appearance-none rounded-md border border-[#303848] bg-[#131720] px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-[#e8ebf0] outline-none transition focus:border-[#4d96ff] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <span className="text-xs tabular-nums text-[#788295]">/ 105</span>
                                </div>
                            </div>

                            <input
                                id="build-level-slider"
                                type="range"
                                min="1"
                                max="105"
                                step="1"
                                value={build.level}
                                onChange={(event) => updateLevel(event.target.value)}
                                style={{
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((build.level - 1) / 104) * 100}%, #283140 ${((build.level - 1) / 104) * 100}%, #283140 100%)`,
                                }}
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(59,130,246,0.16)]"
                            />
                        </div>

                        <div>
                            <p className="mb-1.5 text-xs font-medium text-[#c5cbd5]">Rank</p>
                            <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-[#303848] bg-[#11151e]">
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
                                            className={`min-w-0 py-2 text-sm font-black tracking-wide transition hover:bg-[#1a1f2a] ${index > 0 ? "border-l border-[#303848]" : ""}`}
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
                                <p className="text-xs font-medium text-[#c5cbd5]">Enhancement</p>
                                <span className="text-xs tabular-nums text-[#788295]">+10 max</span>
                            </div>

                            <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] overflow-hidden rounded-lg border border-[#303848] bg-[#11151e]">
                                <button
                                    type="button"
                                    onClick={() => updateEnhancement(build.enhancement - 1)}
                                    disabled={build.enhancement <= 0}
                                    aria-label="Decrease enhancement"
                                    className="border-r border-[#303848] py-2 text-base text-[#99a2b3] transition hover:bg-[#1a1f2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    −
                                </button>

                                <div className={`grid place-items-center bg-[#131720] text-sm font-black tabular-nums [text-shadow:0_1px_0_#050608] ${build.enhancement === 0 ? "text-[#e8ebf0]" : "text-[#4d96ff]"}`}>
                                    +{build.enhancement}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => updateEnhancement(build.enhancement + 1)}
                                    disabled={build.enhancement >= 10}
                                    aria-label="Increase enhancement"
                                    className="border-l border-[#303848] py-2 text-base text-[#99a2b3] transition hover:bg-[#1a1f2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
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

                    <div className="mt-3 rounded-lg border border-[#303848] bg-[#131720] p-3">
                        <div className="mb-3 flex items-center gap-2">
                            <img
                                src="/icons/genetic-potential.png"
                                alt="Genetic Potential"
                                className="size-7 shrink-0 object-contain"
                            />
                            <p className="text-sm font-semibold text-[#e8ebf0]">
                                Genetic Potential
                            </p>
                            <HelpTooltip
                                title="Genetic Potential"
                                text="Adds separate percentage bonuses to Attack and Health. Drag or click either bar; each segment is 6%, up to 60%."
                            />
                        </div>

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
                                0% Genetic Potential is currently bugged in-game. The calculator will still use the selected 0% value.
                            </p>
                        )}
                    </div>

                </CollapsibleSection>

                <CollapsibleSection
                    title={
                        <span className="flex items-center gap-2">
                            <span>Mutations</span>
                            <span className="rounded-full border border-[#3a4354] bg-[#1a1f2a] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[#99a2b3]">
                                {build.mutations.length} / 4
                            </span>
                        </span>
                    }
                >
                    <p className="mb-2.5 text-[11px] text-[#788295]">
                        Click to cycle: <span className="text-[#b8c0ce]">Normal → X → Off</span>
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
                                        className="group/mutation flex min-h-[58px] w-full items-center gap-2 rounded-lg border border-[#303848] bg-[#1a1f2a] p-2 pr-8 text-left transition hover:border-[#4a5568] hover:bg-[#1b202b]"
                                    >
                                        <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-[#3a4354] bg-[#11151e]">
                                            <img
                                                src={isX ? mutation.xIcon : mutation.icon}
                                                alt=""
                                                className={`size-9 object-contain transition ${isSelected ? "opacity-100" : "opacity-65 group-hover/mutation:opacity-90"}`}
                                            />
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block truncate text-xs font-semibold text-[#e8ebf0]">
                                                {mutation.label}
                                            </span>
                                            <span
                                                className="mt-0.5 block truncate text-[10px] font-medium"
                                                style={{ color: isSelected ? mutation.accent : "#788295" }}
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
                                        className={`absolute right-2 top-1/2 z-10 grid size-5 -translate-y-1/2 place-items-center rounded-full border bg-[#1a1f2a] text-[11px] font-black outline-none transition ${mutationHelpId === mutation.id ? "border-[#7585ff] text-[#7585ff]" : "border-[#4b566a] text-[#99a2b3] hover:border-[#7585ff] hover:text-[#7585ff]"}`}
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
                                    <img src={mutationHelp.icon} alt="" className="size-6 object-contain"/>
                                    <strong className="text-xs text-[#e8ebf0]">{mutationHelp.label}</strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMutationHelpId(null)}
                                    aria-label="Close mutation information"
                                    className="text-base leading-none text-[#788295] hover:text-[#e8ebf0]"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="mt-2 grid gap-2 text-[10px] sm:grid-cols-2">
                                <div className="rounded-md border border-[#303848] bg-[#131720] p-2 text-[#99a2b3]">
                                    <span className="mb-1 block font-semibold text-[#d8dee9]">Normal</span>
                                    {mutationHelp.effects.join(" · ")}
                                </div>
                                <div className="rounded-md border border-[#303848] bg-[#131720] p-2 text-[#99a2b3]">
                                    <span className="mb-1 block font-semibold" style={{ color: mutationHelp.accent }}>X Mutation</span>
                                    {mutationHelp.xEffects.join(" · ")}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-3 overflow-hidden rounded-lg border border-[#303848] bg-[#131720]">
                        <button
                            type="button"
                            onClick={() => setMutationEffectsOpen((current) => !current)}
                            aria-expanded={mutationEffectsOpen}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-[#1a1f2a]"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                                    Active Effects
                                </span>
                                <span className="rounded-full bg-[#202632] px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-[#99a2b3]">
                                    {aggregatedMutationEffects.length}
                                </span>
                            </span>
                            <span className="text-xs text-[#788295]">{mutationEffectsOpen ? "▲" : "▼"}</span>
                        </button>

                        {mutationEffectsOpen && (
                            <div className="border-t border-[#252c38] p-2.5">
                                {aggregatedMutationEffects.length === 0 ? (
                                    <p className="text-xs text-[#788295]">No mutations selected.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {aggregatedMutationEffects.map((effect) => (
                                            <span
                                                key={effect.stat}
                                                className="rounded-md border border-[#303848] bg-[#1a1f2a] px-2 py-1 text-[10px] font-medium text-[#b8c0ce]"
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
                            onChange={(value) => {
                                update("weaponId", value);
                                update("weaponAttributeIds", []);
                            }}
                            items={WEAPONS}
                        />

                        <EquipmentSelect
                            label="Armor"
                            value={build.armorId}
                            onChange={(value) => {
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
                                     className="self-start space-y-2 rounded-md border border-[#252c38] bg-[#131720] p-2">
                                    <p className="text-xs font-semibold text-[#e8ebf0]">{type === "weapon" ? "Weapon" : "Armor"} Attributes</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {fixedIds.map((id) => {
                                            const attribute = getAttribute(id);
                                            return attribute ? (
                                                <div key={id}
                                                     className="relative grid aspect-[2.85/1] min-h-[54px] w-full place-items-center overflow-hidden rounded-md border border-[#ff9f43]/50 bg-[#11151e] p-0.5">
                                                    <img src={`/attributes/${id}.png`} alt={attribute.name}
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
                                                onChange={(value) => updateAttribute(key, index, value)}
                                            />
                                        ))}
                                    </div>
                                    {!equipment && <p className="text-[10px] text-[#788295]">Select gear first.</p>}
                                    {equipment && slots === 0 && fixedIds.length === 0 &&
                                        <p className="text-[10px] text-[#788295]">Attributes require Legendary gear or
                                            higher.</p>}
                                </div>
                            );
                        })}
                    </div>

                    {hasHpConditionalAttribute && (
                        <label className="mt-3 block">
                            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">Current HP for conditional attributes</span>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="100" value={build.currentHpPercent} onChange={(event) => update("currentHpPercent", Number(event.target.value))} className="min-w-0 flex-1 accent-[#7585ff]" />
                                <span className="w-12 text-right text-sm font-semibold text-[#d8dee9]">{build.currentHpPercent}%</span>
                            </div>
                        </label>
                    )}

                </CollapsibleSection>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => setBuildStorageMessage(onSaveAction() ? "Build saved locally." : "Unable to save build.")}
                        className="rounded-md bg-[#7585ff] px-3 py-2 text-xs font-bold text-[#0b1510]"
                    >
                        Save Build
                    </button>

                    <button
                        type="button"
                        onClick={() => setBuildStorageMessage(onLoadAction() ? "Saved build loaded." : "No saved build found.")}
                        className="rounded-md border border-[#303848] bg-[#1a1f2a] px-3 py-2 text-xs font-semibold text-[#d8dee9]"
                    >
                        Load Build
                    </button>

                    <button
                        type="button"
                        disabled
                        title="Build comparison is planned for a future update."
                        className="cursor-not-allowed rounded-md border border-[#303848] bg-[#1a1f2a] px-3 py-2 text-xs font-semibold text-[#788295] opacity-60"
                    >
                        Compare Builds
                    </button>

                    <button
                        type="button"
                        onClick={onResetAction}
                        className="rounded-md border border-[#303848] bg-[#1a1f2a] px-3 py-2 text-xs font-semibold text-[#d8dee9]"
                    >
                        Reset
                    </button>
                </div>

                {buildStorageMessage && (
                    <p className="text-center text-[10px] text-[#99a2b3]" role="status">
                        {buildStorageMessage}
                    </p>
                )}
            </div>
        </Panel>
    );
}