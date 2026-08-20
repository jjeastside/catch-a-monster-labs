"use client";

import { useEffect } from "react";

import { getEquipment } from "../data/equipments";
import { getMonsterStatData } from "../data/monster-stats";
import { getTrait } from "../data/traits";
import { calculateStats } from "../lib/calculations/stats";
import { assetPath } from "../lib/asset-path";
import type { Build, Mutation } from "../types/build";
import type { Monster } from "../types/monster";

import { TraitIcon } from "./trait-icon";

export type SavedBuildSlot = {
    version: 1;
    savedAt: number;
    build: Build;
};

type SavedBuildsPanelProps = {
    mode: "save" | "load";
    currentBuild: Build;
    currentMonster: Monster | null;
    monsters: Monster[];
    slots: Array<SavedBuildSlot | null>;
    onCloseAction: () => void;
    onSaveSlotAction: (slotIndex: number) => boolean;
    onLoadSlotAction: (slotIndex: number) => boolean;
    onClearSlotAction: (slotIndex: number) => void;
};

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


const rankColors: Record<NonNullable<Build["rank"]>, string> = {
    E: "#a3a3aa",
    D: "#35d328",
    C: "#23bfd3",
    B: "#e45bd8",
    A: "#ffad0a",
    S: "#67e879",
    SS: "#ff5a62",
};

const rarityImageClasses: Record<Monster["rarity"], string> = {
    Common: "border-[#707070] bg-gradient-to-br from-[#353535] to-[#171717]",
    Uncommon: "border-[#28a745] bg-gradient-to-br from-[#174d24] to-[#0c2512]",
    Rare: "border-[#299ddd] bg-gradient-to-br from-[#17486a] to-[#0b2131]",
    Epic: "border-[#bd45d8] bg-gradient-to-br from-[#5b1e64] to-[#27102d]",
    Legendary: "border-transparent bg-[#f28a22]",
    Mythical: "border-transparent bg-[linear-gradient(to_right,#ff3347,#ff8a1f,#ffe13b,#35e56f,#22bde8,#b43cff)]",
    Secret: "border-transparent bg-[#ff2738]",
    Void: "border-transparent bg-[linear-gradient(135deg,#84ff00,#4cff8f,#00f2ff,#0096c7)]",
};

function getPortraitStyle(monster: Monster | null) {
    if (!monster) return undefined;

    if (monster.rarity === "Legendary") {
        return {
            background: "linear-gradient(to top, #c97813 0%, #a0520d 32%, #6b3009 53%, #351708 72%, #160c09 87%, #090808 100%)",
        };
    }

    if (monster.rarity === "Mythical") {
        return {
            background: "linear-gradient(to bottom, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.78) 30%, rgba(0,0,0,0.38) 62%, rgba(0,0,0,0.04) 100%), linear-gradient(to right, #e53b3b 0%, #f08324 18%, #f0d832 36%, #35c95c 55%, #249fd5 76%, #a43fc4 100%)",
        };
    }

    if (monster.rarity === "Secret") {
        return {
            background: "linear-gradient(to top, #d91f2c 0%, #bb1724 18%, #77101a 38%, #3a0911 60%, #18070b 79%, #080708 100%)",
        };
    }

    return undefined;
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

function formatSavedTime(savedAt: number): string {
    const elapsedMs = Date.now() - savedAt;
    if (elapsedMs < 60_000) return "Just now";

    const minutes = Math.floor(elapsedMs / 60_000);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    }).format(savedAt);
}

function BuildSnapshot({
                           build,
                           monster,
                           compact = false,
                       }: {
    build: Build;
    monster: Monster | null;
    compact?: boolean;
}) {
    const weapon = getEquipment(build.weaponId);
    const armor = getEquipment(build.armorId);
    const trait = getTrait(build.traitId);
    const statData = monster ? getMonsterStatData(monster.id) : null;
    const stats = statData && build.rank
        ? calculateStats(statData, build, monster?.passives ?? [])
        : null;

    return (
        <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={`${compact ? "size-14" : "size-16"} grid shrink-0 place-items-center overflow-hidden rounded-lg border-2 p-[2px] shadow-[0_6px_14px_rgba(0,0,0,0.28)] ${
                        monster ? rarityImageClasses[monster.rarity] : "border-[#3b4759] bg-[#0d131d]"
                    }`}
                >
                    <div
                        className="grid h-full w-full place-items-center overflow-hidden rounded-[5px] bg-[#0c121b]/92"
                        style={getPortraitStyle(monster)}
                    >
                        {monster?.image ? (
                            <img
                                src={assetPath(monster.image)}
                                alt={monster.name}
                                className="h-full w-full object-contain p-0.5 drop-shadow-[0_4px_6px_rgba(0,0,0,0.38)]"
                            />
                        ) : (
                            <span className="text-lg font-black text-[#7182ff]">?</span>
                        )}
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-[#f6f8fc]">
                        {monster?.name ?? "Unknown Monster"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8e99ad]">
                        <span>Level <strong className="text-[#e3e8f1]">{build.level}</strong></span>
                        <span>Rank <strong style={build.rank ? { color: rankColors[build.rank] } : undefined}>{build.rank ?? "—"}</strong></span>
                        <span className="whitespace-nowrap">
                            Enhancement <strong className={build.enhancement === 0 ? "text-[#e3e8f1]" : "text-[#6ea3ff]"}>+{build.enhancement}</strong>
                        </span>
                        {monster?.isEvolved && (
                            <span>EM <strong className="text-[#e3e8f1]">{build.evolutionPercent.toFixed(2)}%</strong></span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-[#344050] py-2 text-[10px] text-[#8e99ad]">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <img src={assetPath("/icons/genetic-potential.png")} alt="" className="size-5 shrink-0 object-contain" />
                    <span>Genetic Potential</span>
                    <span className="flex items-center gap-0.5" title="Damage Genetic Potential">
                        <img src={assetPath("/icons/breed-attack.png")} alt="Damage" className="size-4 object-contain" />
                        <strong className="text-[#f0f3f8]">{build.damageGeneticPotential}%</strong>
                    </span>
                    <span className="flex items-center gap-0.5" title="Health Genetic Potential">
                        <img src={assetPath("/icons/breed-health.png")} alt="Health" className="size-4 object-contain" />
                        <strong className="text-[#f0f3f8]">{build.healthGeneticPotential}%</strong>
                    </span>
                </span>

                <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap" title={weapon?.name ?? "No weapon equipped"}>
                    <span>Weapon</span>
                    {weapon ? (
                        <>
                            <img src={assetPath(`/gear/${weapon.id}.png`)} alt="" className="size-5 rounded object-contain" />
                            <strong className="max-w-[9rem] truncate text-[#e3e8f1]">{weapon.name}</strong>
                        </>
                    ) : (
                        <strong className="text-[#e3e8f1]">None</strong>
                    )}
                </span>

                <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap" title={armor?.name ?? "No armor equipped"}>
                    <span>Armor</span>
                    {armor ? (
                        <>
                            <img src={assetPath(`/gear/${armor.id}.png`)} alt="" className="size-5 rounded object-contain" />
                            <strong className="max-w-[9rem] truncate text-[#e3e8f1]">{armor.name}</strong>
                        </>
                    ) : (
                        <strong className="text-[#e3e8f1]">None</strong>
                    )}
                </span>

                <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span>Trait</span>
                    {trait ? (
                        <>
                            <span className="inline-flex scale-75 origin-center"><TraitIcon trait={trait} size="combat" /></span>
                            <strong className="text-[#e3e8f1]">{trait.name}</strong>
                        </>
                    ) : (
                        <strong className="text-[#e3e8f1]">None</strong>
                    )}
                </span>

                {build.mutations.length > 0 && (
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span>Mutations</span>
                        {build.mutations.map((mutation) => {
                            const summary = mutationSummary[mutation];
                            return (
                                <img
                                    key={mutation}
                                    src={assetPath(summary.icon)}
                                    alt={summary.label}
                                    title={summary.label}
                                    className="size-5 rounded object-contain"
                                />
                            );
                        })}
                    </span>
                )}

                <span className="flex items-center gap-1.5 whitespace-nowrap capitalize">
                    <span>Combat</span>
                    <strong className="text-[#e3e8f1]">{build.combatContext}</strong>
                </span>
            </div>

            {stats && (
                <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"}`}>
                    <div className="rounded-lg border border-[#344050] bg-[linear-gradient(180deg,#101823_0%,#0b111a_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                        <div className="flex items-center gap-1.5 text-[#8e99ad]">
                            <img src={assetPath("/account-icons/damage.png")} alt="" className="size-4 object-contain" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Damage</span>
                        </div>
                        <p className="mt-1.5 text-lg font-bold text-[#f6f8fc]">{formatStatNumber(stats.damage)}</p>
                    </div>

                    <div className="rounded-lg border border-[#344050] bg-[linear-gradient(180deg,#101823_0%,#0b111a_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                        <div className="flex items-center gap-1.5 text-[#8e99ad]">
                            <img src={assetPath("/account-icons/health.png")} alt="" className="size-4 object-contain" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Health</span>
                        </div>
                        <p className="mt-1.5 text-lg font-bold text-[#f6f8fc]">{formatStatNumber(stats.health)}</p>
                    </div>

                    <div className="rounded-lg border border-[#344050] bg-[linear-gradient(180deg,#101823_0%,#0b111a_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                        <div className="flex items-center gap-1.5 text-[#8e99ad]">
                            <img src={assetPath("/account-icons/critical-chance.png")} alt="" className="size-4 object-contain" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Crit Chance</span>
                        </div>
                        <p className="mt-1.5 text-lg font-bold text-[#f6f8fc]">{stats.critChance}%</p>
                    </div>

                    <div className="rounded-lg border border-[#344050] bg-[linear-gradient(180deg,#101823_0%,#0b111a_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                        <div className="flex items-center gap-1.5 text-[#8e99ad]">
                            <img src={assetPath("/account-icons/critical-damage.png")} alt="" className="size-4 object-contain" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Crit Multiplier</span>
                        </div>
                        <p className="mt-1.5 text-lg font-bold text-[#f6f8fc]">{stats.critMultiplier}×</p>
                    </div>
                </div>
            )}



        </div>
    );
}

export function SavedBuildsPanel({
                                     mode,
                                     currentBuild,
                                     currentMonster,
                                     monsters,
                                     slots,
                                     onCloseAction,
                                     onSaveSlotAction,
                                     onLoadSlotAction,
                                     onClearSlotAction,
                                 }: SavedBuildsPanelProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCloseAction();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onCloseAction]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050912]/78 p-4 backdrop-blur-[3px]"
            role="dialog"
            aria-modal="true"
            aria-label={mode === "save" ? "Save build" : "Load build"}
            onMouseDown={(event) => {
                if (event.currentTarget === event.target) onCloseAction();
            }}
        >
            <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#3b4759] bg-[#101721] shadow-[0_30px_90px_rgba(0,0,0,0.72)]">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#344050] bg-[#101721]/95 px-5 py-4 backdrop-blur">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">
                            Saved Builds
                        </p>
                        <h2 className="mt-0.5 text-xl font-bold text-[#f6f8fc]">
                            {mode === "save" ? "Choose a slot to save" : "Choose a build to load"}
                        </h2>
                        <p className="mt-1 text-xs text-[#8993a5]">
                            {mode === "save"
                                ? "Review the exact combat stats of your current build, then choose a slot."
                                : "Review each saved build and its combat stats before loading it."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCloseAction}
                        aria-label="Close saved builds"
                        className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#344050] bg-[#141c28] text-lg text-[#8e99ad] transition hover:border-[#5c6a80] hover:text-white"
                    >
                        ×
                    </button>
                </div>

                <div className="p-5">
                    {mode === "save" && (
                        <div className="mb-5 rounded-xl border border-[#7585ff]/35 bg-[#202846]/45 p-4">
                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#aeb8ff]">
                                Current Build — This is what will be saved
                            </p>
                            <BuildSnapshot build={currentBuild} monster={currentMonster} compact />
                        </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-3">
                        {slots.map((slot, index) => {
                            const savedMonster = slot
                                ? monsters.find(({ id }) => id === slot.build.monsterId) ?? null
                                : null;

                            return (
                                <section
                                    key={index}
                                    className={`flex min-h-[420px] min-w-0 flex-col rounded-xl border p-4 ${slot ? "border-[#344050] bg-[#0f1620]" : "border-dashed border-[#41506a] bg-[#0d131d]/55"}`}
                                >
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">
                                            Slot {index + 1}
                                        </p>
                                        {slot && (
                                            <span className="text-[9px] text-[#69768a]">
                                                {formatSavedTime(slot.savedAt)}
                                            </span>
                                        )}
                                    </div>

                                    {slot ? (
                                        <>
                                            <BuildSnapshot build={slot.build} monster={savedMonster} />
                                            <div className="mt-auto pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const succeeded = mode === "save"
                                                            ? onSaveSlotAction(index)
                                                            : onLoadSlotAction(index);
                                                        if (succeeded) onCloseAction();
                                                    }}
                                                    className={`w-full rounded-md px-3 py-2.5 text-xs font-bold transition ${mode === "save" ? "bg-[#6f7cff] text-white hover:bg-[#7f8bff]" : "border border-[#6f7cff]/55 bg-[#202846] text-[#d0d5ff] hover:border-[#7f8bff]"}`}
                                                >
                                                    {mode === "save" ? "Overwrite Slot" : "Load Build"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onClearSlotAction(index)}
                                                    className="mt-2 w-full rounded-md px-3 py-1.5 text-[10px] font-semibold text-[#7f8b9e] transition hover:bg-[#141c28] hover:text-[#ff9a7f]"
                                                >
                                                    Clear Slot
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                                            <div className="grid size-12 place-items-center rounded-xl border border-dashed border-[#3b4759] bg-[#101721] text-xl text-[#596477]">
                                                +
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-[#bfc7d5]">Empty Slot</p>
                                            <p className="mt-1 max-w-[12rem] text-[10px] leading-4 text-[#69768a]">
                                                {mode === "save" ? "Save the current build here." : "No build has been saved here yet."}
                                            </p>
                                            {mode === "save" && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (onSaveSlotAction(index)) onCloseAction();
                                                    }}
                                                    className="mt-4 rounded-md bg-[#6f7cff] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#7f8bff]"
                                                >
                                                    Save Here
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>

                    <p className="mt-4 text-center text-[10px] text-[#69768a]">
                        Builds are saved to this browser. Account multipliers are not changed when loading a build.
                    </p>
                </div>
            </div>
        </div>
    );
}