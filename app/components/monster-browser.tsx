"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PASSIVE_DEFINITIONS } from "../data/passives";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { getSkill, getSkillTotalMultiplier } from "../data/skills";
import { assetPath } from "../lib/asset-path";
import { EVOLUTION_STEP, MAX_EVOLUTION_PERCENT, MIN_EVOLUTION_PERCENT, clampEvolutionPercent, getEvolutionBarFill } from "../lib/calculations/evolution";
import { ISLANDS, type Monster } from "../types/monster";
import { Panel } from "./panel";

const elementColors: Record<string, string> = {
    Common: "#7f8b9e", Grass: "#79e3ae", Water: "#70b7ff",
    Fire: "#ff9d6c", Ice: "#9ee7ff", Ground: "#d6a66f",
};

const elementIconPaths: Record<Monster["element"], string> = {
    Common: "/element-icons/common.png",
    Grass: "/element-icons/grass.png",
    Water: "/element-icons/water.png",
    Fire: "/element-icons/fire.png",
    Ice: "/element-icons/ice.png",
    Ground: "/element-icons/ground.png",
};

const rarityPortraitClasses: Record<Monster["rarity"], string> = {
    Common: "border-[#707070] from-[#353535] to-[#171717]",
    Uncommon: "border-[#28a745] from-[#174d24] to-[#0c2512]",
    Rare: "border-[#299ddd] from-[#17486a] to-[#0b2131]",
    Epic: "border-[#bd45d8] from-[#5b1e64] to-[#27102d]",
    Legendary: "border-[#ff9f43] from-[#6a3a12] to-[#291608]",
    Mythical: "border-transparent bg-[linear-gradient(to_right,#ff3347,#ff8a1f,#ffe13b,#35e56f,#22bde8,#b43cff)] shadow-[0_0_12px_rgba(124,107,255,0.38)]",
    Secret: "border-[#ff7139] from-[#5d1714] to-[#21130b]",
    Void: "border-[#35e9d0] from-[#123c43] to-[#101d2b]",
};

type MonsterBrowserProps = {
    monsters: Monster[];
    selectedMonster: Monster | null;
    favoriteMonsterIds: string[];
    onSelectAction: (monster: Monster) => void;
    onToggleFavoriteAction: (monsterId: string) => void;
};

type EvolutionFilter = "all" | "can-evolve" | "evolved" | "standard";
type PassiveFilter = "all" | string;
type SortMode = "index" | "dps" | "damage" | "health";
type PassiveCompareMode = "none" | "always" | "conditional";
const selectClassName = "min-w-0 rounded-md border border-[#344050] bg-[#141c28] px-3 py-2 text-xs text-[#bfc7d5] outline-none focus:border-[#7182ff]";

const generatedMonsterById = new Map(
    GENERATED_MONSTERS.map((monster) => [monster.id, monster]),
);

function getBrowserComparisonValue(
    monster: Monster,
    sortMode: SortMode,
    evolutionPercent: number,
    passiveMode: PassiveCompareMode,
): number {
    const data = generatedMonsterById.get(monster.id);

    if (!data) return 0;
    if (sortMode === "index") return data.indexPosition;

    const evolutionMultiplier = monster.isEvolved ? evolutionPercent / 100 : 1;
    const baseDamage = data.baseDamageELevel1 * evolutionMultiplier;
    const health = data.baseHealthELevel1 * evolutionMultiplier;

    // Passive comparison modes:
    // - none: raw stats/skills only.
    // - always: only unconditional self passives.
    // - conditional: unconditional self passives plus Vital Surge, assuming its HP condition is active.
    // Context-specific passives (Boss/Spire/Rift/Dungeon) remain excluded.
    const includedPassiveEffects = passiveMode === "none"
        ? []
        : (monster.passives ?? [])
            .filter((passive) =>
                passive.condition == null ||
                (passiveMode === "conditional" && passive.id === "vitalSurge")
            )
            .flatMap((passive) => passive.effects);

    const passiveDamageBonus = includedPassiveEffects.reduce(
        (total, effect) =>
            effect.stat === "damage" && typeof effect.value === "number"
                ? total + effect.value
                : total,
        0,
    );
    const passiveCritChanceBonus = includedPassiveEffects.reduce(
        (total, effect) =>
            effect.stat === "critChance" && typeof effect.value === "number"
                ? total + effect.value
                : total,
        0,
    );
    const passiveCritDamageBonus = includedPassiveEffects.reduce(
        (total, effect) =>
            effect.stat === "critDamage" && typeof effect.value === "number"
                ? total + effect.value
                : total,
        0,
    );

    const damage = baseDamage * (1 + passiveDamageBonus / 100);

    if (sortMode === "damage") return damage;
    if (sortMode === "health") return health;

    const critChance = Math.max(0, data.baseCritChance + passiveCritChanceBonus) / 100;
    const critDamageMultiplier = 2 + passiveCritDamageBonus / 100;
    const expectedCritMultiplier = 1 + critChance * (critDamageMultiplier - 1);

    return monster.skillIds.reduce((total, skillId) => {
        const skill = getSkill(skillId);
        if (!skill || skill.cooldown === null || skill.cooldown <= 0 || skill.damageInstances.length === 0) {
            return total;
        }

        return total + (damage * getSkillTotalMultiplier(skill) * expectedCritMultiplier) / skill.cooldown;
    }, 0);
}


function InfoTooltip({ label, children }: { label: string; children: string }) {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const showTooltip = () => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const tooltipWidth = 256;
        const tooltipHeight = 120;
        const gap = 8;

        let left = rect.left + rect.width / 2 - tooltipWidth / 2;
        let top = rect.bottom + gap;

        if (left < 8) left = 8;
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
                className="grid size-5 shrink-0 place-items-center rounded-full border border-[#5c6a80] bg-[#141c28] text-[11px] font-black leading-none text-[#8e99ad] outline-none transition hover:border-[#7182ff] hover:text-[#7182ff] focus:border-[#7182ff] focus:text-[#7182ff]"
            >
                ?
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
                            width: 256,
                            zIndex: 9999,
                        }}
                        className="pointer-events-none rounded-lg border border-[#41506a] bg-[#0d131d] px-3 py-2 text-left text-xs font-normal normal-case leading-5 tracking-normal text-[#bfc7d5] shadow-2xl"
                    >
                        {children}
                    </div>,
                    document.body,
                )}
        </>
    );
}

function HoverInfo({ text, children }: { text: string; children: React.ReactNode }) {
    const anchorRef = useRef<HTMLSpanElement | null>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const showTooltip = () => {
        const anchor = anchorRef.current;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const tooltipWidth = 250;
        const tooltipHeight = 76;
        const gap = 8;

        let left = rect.left + rect.width / 2 - tooltipWidth / 2;
        let top = rect.bottom + gap;

        if (left < 8) left = 8;
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
        <span
            ref={anchorRef}
            className="inline-flex shrink-0"
            onMouseEnter={showTooltip}
            onMouseLeave={() => setOpen(false)}
            onFocusCapture={showTooltip}
            onBlurCapture={() => setOpen(false)}
        >
            {children}
            {open && typeof document !== "undefined" && createPortal(
                <div
                    role="tooltip"
                    style={{
                        position: "fixed",
                        top: position.top,
                        left: position.left,
                        width: 250,
                        zIndex: 9999,
                    }}
                    className="pointer-events-none rounded-lg border border-[#41506a] bg-[#0d131d] px-3 py-2 text-left text-[11px] font-normal leading-4 text-[#bfc7d5] shadow-2xl"
                >
                    {text}
                </div>,
                document.body,
            )}
        </span>
    );
}


type BrowserEvolutionMultiplierEditorProps = {
    value: number;
    onChange: (value: number) => void;
};

function BrowserEvolutionMultiplierEditor({ value, onChange }: BrowserEvolutionMultiplierEditorProps) {
    const [inputDraft, setInputDraft] = useState<string | null>(null);
    const [dragPreview, setDragPreview] = useState<number | null>(null);
    const [precisionRange, setPrecisionRange] = useState<{ min: number; max: number } | null>(null);
    const [precisionOverlay, setPrecisionOverlay] = useState<{ left: number; top: number; width: number } | null>(null);
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

    const inputValue = inputDraft ?? (dragPreview ?? value).toFixed(2);
    const displayedValue = dragPreview ?? value;
    const parsedValue = Number(inputValue);
    const isNumeric = inputValue.trim() !== "" && Number.isFinite(parsedValue);
    const isOutOfRange = isNumeric && (parsedValue < MIN_EVOLUTION_PERCENT || parsedValue > MAX_EVOLUTION_PERCENT);

    const commitInputValue = () => {
        const normalizedValue = isNumeric ? clampEvolutionPercent(parsedValue) : value;
        onChange(normalizedValue);
        setInputDraft(null);
    };

    const evolutionBarFill = getEvolutionBarFill(displayedValue);
    const precisionFill = precisionRange
        ? ((displayedValue - precisionRange.min) / (precisionRange.max - precisionRange.min)) * 100
        : 0;

    return (
        <div className="mt-2 border-t border-[#273242] pt-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="inline-flex min-w-0 items-center gap-1.5 leading-none">
                    <span className="inline-flex h-5 items-center text-[10px] font-medium uppercase tracking-[0.08em] leading-none text-[#8e99ad]">EM</span>
                    <span className="relative -top-px inline-flex h-5 items-center">
                        <InfoTooltip label="About evolution multiplier">
                            Applied only to evolved forms when comparing DPS, Damage, and Health. Drag the bar normally for quick changes, or drag upward while adjusting to open the 0.01% precision slider. It does not affect Index sorting.
                        </InfoTooltip>
                    </span>
                </div>

                <label className="relative w-[4.75rem] shrink-0">
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
                        aria-label="Exact browser evolution multiplier percentage"
                        aria-invalid={!isNumeric || isOutOfRange}
                        className={`w-full appearance-none rounded-md border bg-[#141c28] px-1.5 py-1 pr-4 text-right text-[10px] font-semibold tabular-nums text-[#c7ccff] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                            !isNumeric || isOutOfRange
                                ? "border-[#ff7657] focus:border-[#ff7657]"
                                : "border-[#344050] focus:border-[#7182ff]"
                        }`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[8px] text-[#69768a]">%</span>
                </label>
            </div>

            <div className="relative">
                {precisionRange &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <div
                            className="fixed z-[9999] max-w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-full rounded-lg border border-[#f1a45c]/70 bg-[#0d131d]/95 px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.48),0_0_18px_rgba(255,157,66,0.10)] backdrop-blur-sm"
                            style={{
                                left: precisionOverlay?.left ?? 0,
                                top: precisionOverlay?.top ?? 0,
                                width: precisionOverlay?.width,
                            }}
                        >
                            <div className="mb-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-[#f3b170]">
                                Precision · 0.01%
                            </div>
                            <div className="mb-1.5 flex items-center justify-between gap-2 text-[9px] font-semibold tabular-nums text-[#8e99ad]">
                                <span>{precisionRange.min.toFixed(2)}%</span>
                                <strong className="rounded border border-[#f1a45c]/50 bg-[#342313] px-2 py-0.5 text-xs font-black text-white">
                                    {displayedValue.toFixed(2)}%
                                </strong>
                                <span>{precisionRange.max.toFixed(2)}%</span>
                            </div>
                            <div className="relative h-1.5 rounded-full bg-[#283140]">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-[#ff9d42]"
                                    style={{ width: `${precisionFill}%` }}
                                />
                                <span
                                    className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#ff9d42] shadow-[0_0_0_3px_rgba(255,157,66,0.16)]"
                                    style={{ left: `${precisionFill}%` }}
                                />
                            </div>
                        </div>,
                        document.body,
                    )}

                <div className="relative rounded-md border border-[#f4d4b3]/75 bg-[#343434] p-[2px] shadow-inner">
                    <div className="relative h-4 overflow-hidden rounded-[4px] bg-[#3a3a3a]">
                        <div
                            className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffd2a3] via-[#ffb160] to-[#ff8a24]"
                            style={{ width: `${evolutionBarFill}%` }}
                        />
                        <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-[7px] font-semibold tabular-nums text-white [text-shadow:0_1px_0_#111,1px_0_0_#111,-1px_0_0_#111,0_-1px_0_#111]">
                            EM: {displayedValue.toFixed(2)}%
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
                                if (!track) return;

                                const mainProgress = Math.min(
                                    1,
                                    Math.max(0, (event.clientX - (track.left + track.width / 2)) / (track.width / 2)),
                                );
                                const preview = clampEvolutionPercent(
                                    MIN_EVOLUTION_PERCENT + mainProgress * (MAX_EVOLUTION_PERCENT - MIN_EVOLUTION_PERCENT),
                                );
                                const overlayWidth = Math.min(
                                    Math.max(track.width + 96, track.width * 1.3),
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
                                if (!drag || drag.pointerId !== event.pointerId) return;

                                if (!drag.precisionRange && drag.startY - event.clientY >= 24) {
                                    const desiredWidth = Math.max(drag.width + 96, drag.width * 1.3);
                                    const availableHalfWidth = Math.max(
                                        0,
                                        Math.min(event.clientX - 8, window.innerWidth - event.clientX - 8),
                                    );
                                    drag.overlayLeft = event.clientX;
                                    drag.overlayWidth = Math.min(desiredWidth, availableHalfWidth * 2);
                                    drag.precisionRange = {
                                        min: Math.max(MIN_EVOLUTION_PERCENT, drag.preview - 1),
                                        max: Math.min(MAX_EVOLUTION_PERCENT, drag.preview + 1),
                                    };
                                    drag.precisionStartX = event.clientX;
                                    drag.precisionStartValue = drag.preview;
                                    setPrecisionRange(drag.precisionRange);
                                    setPrecisionOverlay({
                                        left: drag.overlayLeft,
                                        top: drag.top - 8,
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
                                    const precisionSpan = drag.precisionRange.max - drag.precisionRange.min;
                                    drag.preview = clampEvolutionPercent(
                                        Math.min(
                                            drag.precisionRange.max,
                                            Math.max(
                                                drag.precisionRange.min,
                                                drag.precisionStartValue +
                                                ((event.clientX - drag.precisionStartX) / drag.overlayWidth) * precisionSpan,
                                            ),
                                        ),
                                    );
                                } else {
                                    const progress = Math.min(
                                        1,
                                        Math.max(0, (event.clientX - (drag.left + drag.width / 2)) / (drag.width / 2)),
                                    );
                                    drag.preview = clampEvolutionPercent(
                                        MIN_EVOLUTION_PERCENT + progress * (MAX_EVOLUTION_PERCENT - MIN_EVOLUTION_PERCENT),
                                    );
                                }

                                setDragPreview(drag.preview);
                            }}
                            onPointerUp={(event) => {
                                const drag = dragState.current;
                                if (!drag || drag.pointerId !== event.pointerId) return;
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
                                if (dragState.current) return;
                                const nextValue = clampEvolutionPercent(
                                    Math.max(MIN_EVOLUTION_PERCENT, Number(event.target.value)),
                                );
                                onChange(nextValue);
                                setInputDraft(null);
                            }}
                            aria-label="Browser EM percentage"
                            aria-valuemin={MIN_EVOLUTION_PERCENT}
                            aria-valuemax={MAX_EVOLUTION_PERCENT}
                            aria-valuenow={displayedValue}
                            title="Drag upward while adjusting to open the precision slider."
                            className="absolute inset-0 z-20 h-full w-full cursor-ew-resize touch-none appearance-none bg-transparent opacity-0"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-1 flex justify-between text-[9px] tabular-nums text-[#69768a]">
                <span>{MIN_EVOLUTION_PERCENT.toFixed(0)}%</span>
                <span>{MAX_EVOLUTION_PERCENT.toFixed(0)}%</span>
            </div>
        </div>
    );
}

type MonsterOptionProps = {
    monster: Monster;
    selected: boolean;
    favorite: boolean;
    onSelect: () => void;
    onToggleFavorite: () => void;
    compact?: boolean;
};

function MonsterOption({ monster, selected, favorite, onSelect, onToggleFavorite, compact = false }: MonsterOptionProps) {
    const color = elementColors[monster.element] ?? "#7f8b9e";
    const elementIcon = elementIconPaths[monster.element];
    const portraitBackground = "bg-[#111722]/90";
    const portraitStyle = monster.rarity === "Legendary"
        ? {
            background: "linear-gradient(to top, #c97813 0%, #a0520d 32%, #6b3009 53%, #351708 72%, #160c09 87%, #090808 100%)",
        }
        : monster.rarity === "Mythical"
            ? {
                background: "linear-gradient(to bottom, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.78) 30%, rgba(0,0,0,0.38) 62%, rgba(0,0,0,0.04) 100%), linear-gradient(to right, #e53b3b 0%, #f08324 18%, #f0d832 36%, #35c95c 55%, #249fd5 76%, #a43fc4 100%)",
            }
            : monster.rarity === "Secret"
                ? {
                    background: "linear-gradient(to top, #d91f2c 0%, #bb1724 18%, #77101a 38%, #3a0911 60%, #18070b 79%, #080708 100%)",
                }
                : undefined;
    const portraitFrameStyle = monster.rarity === "Mythical"
        ? { border: "none", padding: "2px" }
        : monster.rarity === "Legendary"
            ? { border: "none", padding: "2px", background: "#f28a22" }
            : monster.rarity === "Secret"
                ? { border: "none", padding: "2px", background: "#ff2738" }
                : monster.rarity === "Void"
                    ? {
                        border: "none",
                        padding: "2px",
                        background: "linear-gradient(135deg, #84ff00 0%, #4cff8f 32%, #00f2ff 68%, #0096c7 100%)",
                    }
                    : undefined;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group flex w-full items-center rounded-xl border text-left transition ${compact ? "min-h-[58px] gap-2 px-2.5 py-1.5" : "min-h-[72px] gap-3 px-3 py-2"} ${selected ? "border-[#7182ff] bg-[#202846] shadow-[inset_3px_0_0_#7182ff]" : "border-[#344050] bg-[#141c28] hover:border-[#5c6a80] hover:bg-[#1b202b]"}`}
        >
            <span
                className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border bg-gradient-to-br p-[2px] ${compact ? "size-11" : "size-14"} ${rarityPortraitClasses[monster.rarity]}`}
                style={portraitFrameStyle}
            >
                <span
                    className={`grid h-full w-full place-items-center overflow-hidden rounded-[9px] ${portraitBackground}`}
                    style={portraitStyle}
                >
                    {monster.image ? (
                        <img
                            src={assetPath(monster.image)}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-contain p-0.5 transition-transform duration-200 group-hover:scale-110"
                        />
                    ) : (
                        <span className="text-xs font-black" style={{ color }}>
                            {monster.name.slice(0, 2).toUpperCase()}
                        </span>
                    )}
                </span>
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug text-[#e3e8f1]">
                    {monster.name}
                </span>
                <span className={`${compact ? "mt-0.5" : "mt-1"} flex min-w-0 items-center text-xs text-[#8e99ad]`}>
                    <span className="flex shrink-0 items-center gap-1 font-medium" style={{ color }}>
                        <img src={assetPath(elementIcon)} alt="" className="size-4 object-contain" />
                        {monster.element}
                    </span>
                </span>
            </span>

            <span
                role="button"
                tabIndex={0}
                aria-label={favorite ? `Remove ${monster.name} from favorites` : `Add ${monster.name} to favorites`}
                aria-pressed={favorite}
                onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite();
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggleFavorite();
                    }
                }}
                className={`grid shrink-0 place-items-center rounded-md text-xl transition hover:bg-[#202846] hover:text-[#aeb8ff] ${favorite ? "text-[#7182ff]" : "text-[#7f8b9e]"} ${compact ? "size-8" : "size-9"}`}
            >
                {favorite ? "★" : "☆"}
            </span>
        </button>
    );
}

export function MonsterBrowser({
                                   monsters,
                                   selectedMonster,
                                   favoriteMonsterIds,
                                   onSelectAction,
                                   onToggleFavoriteAction,
                               }: MonsterBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [islandFilter, setIslandFilter] = useState("all");
    const [rarityFilter, setRarityFilter] = useState("all");
    const [elementFilter, setElementFilter] = useState("all");
    const [evolutionFilter, setEvolutionFilter] = useState<EvolutionFilter>("all");
    const [passiveFilter, setPassiveFilter] = useState<PassiveFilter>("all");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
    const [browseFilterOpen, setBrowseFilterOpen] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>("index");
    const [sortDescending, setSortDescending] = useState(false);
    const [browserEvolutionPercent, setBrowserEvolutionPercent] = useState(100);
    const [passiveCompareMode, setPassiveCompareMode] = useState<PassiveCompareMode>("always");
    const [showAllMonsters, setShowAllMonsters] = useState(false);
    const [visibleMonsterCount, setVisibleMonsterCount] = useState(60);

    const filterOptions = useMemo(() => ({
        islands: ISLANDS.filter((island) =>
            monsters.some((monster) => monster.sources.some((source) => source.location === island)),
        ),
        sources: [...new Set(monsters.flatMap((monster) =>
            monster.sources.map((source) => source.type),
        ))].filter((source) => source !== "Evolution").sort(),
        rarities: [...new Set(monsters.map((monster) => monster.rarity))].sort(),
        elements: [...new Set(monsters.map((monster) => monster.element))].sort(),
        passives: [...new Set(monsters.flatMap((monster) =>
            (monster.passives ?? []).map((passive) => PASSIVE_DEFINITIONS[passive.id].name),
        ))].sort(),
    }), [monsters]);

    const filteredMonsters = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const matchingMonsters = monsters.filter((monster) => {
            const searchableValues = [
                monster.name, monster.id, monster.element, monster.rarity,
                ...monster.sources.flatMap((source) => [
                    source.type, source.name, source.location ?? "",
                ]),
                ...(monster.passives ?? []).map((passive) => PASSIVE_DEFINITIONS[passive.id].name),
            ];
            const matchesSearch = !query || searchableValues.some((value) =>
                value.toLowerCase().includes(query),
            );
            const matchesSource = sourceFilter === "all" ||
                monster.sources.some((source) => source.type === sourceFilter);
            const matchesIsland = islandFilter === "all" ||
                monster.sources.some((source) => source.location === islandFilter);
            const matchesRarity = rarityFilter === "all" || monster.rarity === rarityFilter;
            const matchesElement = elementFilter === "all" || monster.element === elementFilter;
            const matchesEvolution = evolutionFilter === "all" ||
                (evolutionFilter === "can-evolve" && monster.hasEvolution) ||
                (evolutionFilter === "evolved" && monster.isEvolved === true) ||
                (evolutionFilter === "standard" && !monster.hasEvolution && monster.isEvolved !== true);
            const passiveNames = (monster.passives ?? []).map((passive) =>
                PASSIVE_DEFINITIONS[passive.id].name,
            );
            const matchesPassive = passiveFilter === "all" ||
                passiveNames.includes(passiveFilter);
            const matchesFavorite = !favoritesOnly || favoriteMonsterIds.includes(monster.id);

            return matchesSearch && matchesSource && matchesIsland && matchesRarity &&
                matchesElement && matchesEvolution && matchesPassive && matchesFavorite;
        });

        return matchingMonsters.sort((a, b) => {
            const aValue = getBrowserComparisonValue(a, sortMode, browserEvolutionPercent, passiveCompareMode);
            const bValue = getBrowserComparisonValue(b, sortMode, browserEvolutionPercent, passiveCompareMode);
            const direction = sortDescending ? -1 : 1;

            if (aValue === bValue) {
                return a.name.localeCompare(b.name);
            }

            return (aValue - bValue) * direction;
        });
    }, [monsters, searchQuery, sourceFilter, islandFilter, rarityFilter, elementFilter, evolutionFilter, passiveFilter, favoritesOnly, favoriteMonsterIds, sortMode, sortDescending, browserEvolutionPercent, passiveCompareMode]);

    const activeFilterCount = [sourceFilter, islandFilter, rarityFilter, elementFilter, evolutionFilter, passiveFilter]
        .filter((value) => value !== "all").length + (favoritesOnly ? 1 : 0);

    const clearFilters = () => {
        setSourceFilter("all");
        setIslandFilter("all");
        setRarityFilter("all");
        setElementFilter("all");
        setEvolutionFilter("all");
        setPassiveFilter("all");
        setFavoritesOnly(false);
    };

    return (
        <>
            <Panel
                eyebrow="Select"
                title="Monster Browser"
                action={<span className="rounded-full bg-[#202632] px-2.5 py-1 text-xs text-[#8e99ad]">
        {selectedMonster ? "1 selected" : "0 selected"}
      </span>}
            >
                <div className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-4 overflow-x-hidden p-4 sm:p-5">
                    <div className="flex items-stretch gap-2">
                        <label className="relative min-w-0 flex-1">
                            <span className="sr-only">Search monsters</span>
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8b9e]">⌕</span>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search monsters"
                                className="h-full w-full rounded-lg border border-[#344050] bg-[#0d131d] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#69768a] focus:border-[#7182ff]"
                            />
                        </label>

                        <HoverInfo text="Stats Filter — Sort monsters by Index, DPS, Damage, or Health. Choose whether comparisons use no passives, always-active self passives, or conditional self passives (currently Vital Surge). The EM bar adjusts evolved-monster comparisons.">
                            <button
                                type="button"
                                aria-label="Open monster stat filters: Index, DPS, Damage, Health, and Evolution Multiplier"
                                aria-expanded={advancedFilterOpen}
                                onClick={() => setAdvancedFilterOpen((open) => !open)}
                                className={`grid w-11 shrink-0 place-items-center rounded-lg border transition ${advancedFilterOpen ? "border-[#7182ff] bg-[#202846] text-[#aeb8ff]" : "border-[#344050] bg-[#0d131d] text-[#8e99ad] hover:border-[#5c6a80] hover:text-white"}`}
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 6h16" />
                                    <path d="M7 12h10" />
                                    <path d="M10 18h4" />
                                </svg>
                            </button>
                        </HoverInfo>

                        <HoverInfo text="Browse Filters — Narrow the monster list by island, source, rarity, element, evolution status, or passive. You can also show only monsters you have starred as Favorites.">
                            <button
                                type="button"
                                aria-label="Open browse filters for island, source, rarity, element, evolution, passive, and favorites"
                                aria-expanded={browseFilterOpen}
                                onClick={() => setBrowseFilterOpen((open) => !open)}
                                className={`relative grid w-11 shrink-0 place-items-center rounded-lg border transition ${browseFilterOpen || activeFilterCount > 0 ? "border-[#7182ff] bg-[#202846] text-[#aeb8ff]" : "border-[#344050] bg-[#0d131d] text-[#8e99ad] hover:border-[#5c6a80] hover:text-white"}`}
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 5h16l-6.5 7.2V18l-3 1.5v-7.3L4 5Z" />
                                </svg>
                                {activeFilterCount > 0 && (
                                    <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border border-[#0d131d] bg-[#7182ff] text-[8px] font-black text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </HoverInfo>
                    </div>

                    {advancedFilterOpen && (
                        <div className="rounded-xl border border-[#344050] bg-[#0d131d] p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#69768a]">Sort by</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <div className="grid flex-1 grid-cols-4 gap-1">
                                    {([
                                        ["index", "Index", "/icons/index.png"],
                                        ["dps", "Dps", "/icons/dps.png"],
                                        ["damage", "Dmg", "/account-icons/damage.png"],
                                        ["health", "Hp", "/account-icons/health.png"],
                                    ] as const).map(([value, label, icon]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-label={`Sort by ${label}`}
                                            title={`Sort by ${label}`}
                                            onClick={() => {
                                                setSortMode(value);
                                                setSortDescending(value !== "index");
                                            }}
                                            className={`flex h-8 min-w-0 items-center justify-center gap-1 rounded-md border px-1.5 transition ${sortMode === value ? "border-[#7182ff] bg-[#202846] text-[#c7ccff] shadow-[inset_0_0_0_1px_rgba(113,130,255,0.10)]" : "border-[#344050] bg-[#141c28] text-[#9aa5b8] hover:border-[#5c6a80] hover:bg-[#181f2b] hover:text-[#e3e8f1]"}`}
                                        >
                                            <img
                                                src={assetPath(icon)}
                                                alt=""
                                                aria-hidden="true"
                                                className="size-4 shrink-0 object-contain"
                                            />
                                            <span className="truncate text-[9px] font-bold uppercase leading-none tracking-[0.04em]">
                                                {label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    aria-label={sortDescending ? "Sort highest to lowest" : "Sort lowest to highest"}
                                    onClick={() => setSortDescending((current) => !current)}
                                    className="grid size-8 shrink-0 place-items-center rounded-md border border-[#344050] bg-[#141c28] text-sm font-medium leading-none text-[#bfc7d5] transition hover:border-[#5c6a80] hover:bg-[#181f2b] hover:text-white"
                                    title={sortDescending ? "Highest to lowest" : "Lowest to highest"}
                                >
                                    {sortDescending ? "↓" : "↑"}
                                </button>
                            </div>

                            {sortMode === "index" ? (
                                <div className="mt-2 border-t border-[#273242] pt-2">
                                    <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#69768a]">
                                        <img src={assetPath("/icons/index.png")} alt="" aria-hidden="true" className="size-3.5 shrink-0 object-contain opacity-70" />
                                        <span>Index uses database order only — EM and passives do not apply.</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-2 border-t border-[#273242] pt-2">
                                        <div className="mb-1.5 inline-flex h-5 items-center gap-1.5 leading-none">
                                            <span className="inline-flex h-5 items-center text-[9px] font-bold uppercase leading-none tracking-[0.08em] text-[#7f8b9e]">Passives</span>
                                            <span className="relative -top-px inline-flex h-5 items-center">
                                                <InfoTooltip label="About passive comparison">
                                                    None compares raw stats and skills. Always adds unconditional self passives such as Hard Carapace and crit passives. Conditional also treats Vital Surge as active. Boss, Spire, Rift, and Dungeon-specific passives stay excluded.
                                                </InfoTooltip>
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setPassiveCompareMode("none")}
                                                aria-pressed={passiveCompareMode === "none"}
                                                title="No passives"
                                                className={`flex h-7 min-w-0 items-center justify-center gap-1 rounded-md border px-1 text-[9px] font-bold transition ${passiveCompareMode === "none" ? "border-[#7182ff] bg-[#202846] text-[#c7ccff] shadow-[inset_0_0_0_1px_rgba(113,130,255,0.12)]" : "border-[#344050] bg-[#141c28] text-[#9aa5b8] hover:border-[#5c6a80] hover:text-[#e3e8f1]"}`}
                                            >
                                                <svg aria-hidden="true" viewBox="0 0 20 20" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7">
                                                    <circle cx="10" cy="10" r="6.5" />
                                                    <path d="M5.4 5.4l9.2 9.2" />
                                                </svg>
                                                <span className="truncate text-[9px] font-bold uppercase leading-none tracking-[0.04em]">None</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPassiveCompareMode("always")}
                                                aria-pressed={passiveCompareMode === "always"}
                                                title="Always-active self passives"
                                                className={`flex h-7 min-w-0 items-center justify-center gap-1 rounded-md border px-1 text-[9px] font-bold transition ${passiveCompareMode === "always" ? "border-[#7182ff] bg-[#202846] text-[#c7ccff] shadow-[inset_0_0_0_1px_rgba(113,130,255,0.12)]" : "border-[#344050] bg-[#141c28] text-[#9aa5b8] hover:border-[#5c6a80] hover:text-[#e3e8f1]"}`}
                                            >
                                                <img src={assetPath("/passive-images/hard-carapace.png")} alt="" aria-hidden="true" className="size-4 shrink-0 object-contain" />
                                                <span className="truncate text-[9px] font-bold uppercase leading-none tracking-[0.04em]">Always</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPassiveCompareMode("conditional")}
                                                aria-pressed={passiveCompareMode === "conditional"}
                                                title="Conditional self passive: Vital Surge active"
                                                className={`flex h-7 min-w-0 items-center justify-center gap-1 rounded-md border px-1 text-[9px] font-bold transition ${passiveCompareMode === "conditional" ? "border-[#7182ff] bg-[#202846] text-[#c7ccff] shadow-[inset_0_0_0_1px_rgba(113,130,255,0.12)]" : "border-[#344050] bg-[#141c28] text-[#9aa5b8] hover:border-[#5c6a80] hover:text-[#e3e8f1]"}`}
                                            >
                                                <img src={assetPath("/passive-images/vital-surge.png")} alt="" aria-hidden="true" className="size-3.5 shrink-0 object-contain" />
                                                <span className="truncate text-[9px] font-bold uppercase leading-none tracking-[0.04em]">Conditional</span>
                                            </button>
                                        </div>
                                    </div>

                                    <BrowserEvolutionMultiplierEditor
                                        value={browserEvolutionPercent}
                                        onChange={setBrowserEvolutionPercent}
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {browseFilterOpen && (
                        <div className="rounded-xl border border-[#344050] bg-[#0d131d] p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
                            <div className="grid w-full min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
                                <label className="sr-only" htmlFor="island-filter">Island</label>
                                <select id="island-filter" value={islandFilter} onChange={(event) => setIslandFilter(event.target.value)} className={selectClassName}>
                                    <option value="all">All Islands</option>
                                    {filterOptions.islands.map((island) => <option key={island} value={island}>{island}</option>)}
                                </select>

                                <label className="sr-only" htmlFor="source-filter">Source</label>
                                <select id="source-filter" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className={selectClassName}>
                                    <option value="all">All sources</option>
                                    {filterOptions.sources.map((source) => <option key={source} value={source}>{source}</option>)}
                                </select>

                                <label className="sr-only" htmlFor="rarity-filter">Rarity</label>
                                <select id="rarity-filter" value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)} className={selectClassName}>
                                    <option value="all">All rarities</option>
                                    {filterOptions.rarities.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
                                </select>

                                <label className="sr-only" htmlFor="element-filter">Element</label>
                                <select id="element-filter" value={elementFilter} onChange={(event) => setElementFilter(event.target.value)} className={selectClassName}>
                                    <option value="all">All elements</option>
                                    {filterOptions.elements.map((element) => <option key={element} value={element}>{element}</option>)}
                                </select>

                                <label className="sr-only" htmlFor="evolution-filter">Evolution</label>
                                <select id="evolution-filter" value={evolutionFilter} onChange={(event) => setEvolutionFilter(event.target.value as EvolutionFilter)} className={selectClassName}>
                                    <option value="all">All Evolution Types</option>
                                    <option value="can-evolve">Can evolve</option>
                                    <option value="evolved">Evolved forms</option>
                                    <option value="standard">No evolution</option>
                                </select>

                                <label className="sr-only" htmlFor="passive-filter">Passive</label>
                                <select id="passive-filter" value={passiveFilter} onChange={(event) => setPassiveFilter(event.target.value)} className={selectClassName}>
                                    <option value="all">All Passive Types</option>
                                    {filterOptions.passives.map((passive) => <option key={passive} value={passive}>{passive}</option>)}
                                </select>
                            </div>

                            <div className="mt-2 flex items-center gap-2 border-t border-[#273242] pt-2">
                                <button
                                    type="button"
                                    aria-pressed={favoritesOnly}
                                    onClick={() => setFavoritesOnly((current) => !current)}
                                    className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition ${favoritesOnly ? "border-[#7182ff] bg-[#202846] text-[#aeb8ff]" : "border-[#344050] bg-[#141c28] text-[#8e99ad] hover:border-[#5c6a80] hover:text-[#e3e8f1]"}`}
                                >
                                    <span aria-hidden="true">★</span>
                                    <span>Favorites</span>
                                    <span className="font-normal">({favoriteMonsterIds.length})</span>
                                </button>

                                {activeFilterCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="h-8 shrink-0 rounded-md border border-[#344050] bg-[#141c28] px-2.5 text-[10px] font-semibold text-[#8e99ad] transition hover:border-[#5c6a80] hover:text-white"
                                        title="Clear browse filters"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-[#7f8b9e]">
                        <span>{filteredMonsters.length} of {monsters.length} monsters</span>
                        {activeFilterCount > 0 && (
                            <button type="button" onClick={clearFilters} className="text-[#7182ff] hover:text-[#a8b0ff]">
                                Clear {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
                            </button>
                        )}
                    </div>

                    <div className="flex h-[792px] min-h-64 max-h-[calc(100vh-22rem)] flex-none flex-col gap-2 overflow-y-scroll pr-1 lg:h-auto lg:min-h-0 lg:flex-1">
                        {filteredMonsters.map((monster) => (
                            <MonsterOption
                                key={monster.id}
                                monster={monster}
                                selected={selectedMonster?.id === monster.id}
                                favorite={favoriteMonsterIds.includes(monster.id)}
                                onSelect={() => onSelectAction(monster)}
                                onToggleFavorite={() => onToggleFavoriteAction(monster.id)}
                            />
                        ))}

                        {filteredMonsters.length === 0 && (
                            <p className="py-8 text-center text-sm text-[#7f8b9e]">No monsters match your search and filters.</p>
                        )}
                    </div>

                    {filteredMonsters.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setVisibleMonsterCount(60);
                                setShowAllMonsters(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#344050] bg-[#141c28] px-4 py-3 text-sm font-semibold text-[#e3e8f1] transition hover:border-[#5c6a80] hover:bg-[#1b202b]"
                        >
                        <span aria-hidden="true" className="grid grid-cols-2 gap-0.5">
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                        </span>
                            View All Monsters
                            <span className="text-xs font-normal text-[#7f8b9e]">({filteredMonsters.length})</span>
                        </button>
                    )}
                </div>
            </Panel>

            {showAllMonsters && (
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="all-monsters-title"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setShowAllMonsters(false);
                    }}
                >
                    <section className="flex h-[92vh] max-h-[58rem] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#344050] bg-[#0f1620] shadow-2xl">
                        <div className="border-b border-[#344050] p-3 sm:px-4 sm:py-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7182ff]">
                                        Monster Database
                                    </p>
                                    <h2 id="all-monsters-title" className="mt-0.5 text-lg font-bold text-[#f6f8fc]">
                                        Select a Monster
                                    </h2>
                                    <p className="mt-1 text-xs text-[#7f8b9e]">
                                        {filteredMonsters.length} matching monsters
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAllMonsters(false)}
                                    aria-label="Close all monsters"
                                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#344050] text-lg text-[#8e99ad] transition hover:bg-[#1b202b] hover:text-white"
                                >
                                    ×
                                </button>
                            </div>

                            <label className="relative mt-3 block">
                                <span className="sr-only">Search all monsters</span>
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8b9e]">⌕</span>
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                        setVisibleMonsterCount(60);
                                    }}
                                    placeholder="Search all monsters"
                                    autoFocus
                                    className="w-full rounded-lg border border-[#344050] bg-[#0d131d] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#69768a] focus:border-[#7182ff]"
                                />
                            </label>
                        </div>

                        <div
                            className="min-h-0 flex-1 overflow-y-scroll p-3 sm:p-4"
                            onScroll={(event) => {
                                const element = event.currentTarget;
                                if (element.scrollHeight - element.scrollTop - element.clientHeight < 320) {
                                    setVisibleMonsterCount((count) =>
                                        Math.min(count + 60, filteredMonsters.length),
                                    );
                                }
                            }}
                        >
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-2">
                                {filteredMonsters.slice(0, visibleMonsterCount).map((monster) => (
                                    <MonsterOption
                                        key={monster.id}
                                        monster={monster}
                                        compact
                                        selected={selectedMonster?.id === monster.id}
                                        favorite={favoriteMonsterIds.includes(monster.id)}
                                        onToggleFavorite={() => onToggleFavoriteAction(monster.id)}
                                        onSelect={() => {
                                            onSelectAction(monster);
                                            setShowAllMonsters(false);
                                        }}
                                    />
                                ))}
                            </div>

                            {visibleMonsterCount < filteredMonsters.length && (
                                <p className="py-4 text-center text-xs text-[#7f8b9e]">
                                    Keep scrolling to load more monsters
                                </p>
                            )}

                            {filteredMonsters.length === 0 && (
                                <p className="py-16 text-center text-sm text-[#7f8b9e]">
                                    No monsters match your search and filters.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}