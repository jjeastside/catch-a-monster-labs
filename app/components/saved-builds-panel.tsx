"use client";

import { useEffect, useMemo, useState } from "react";

import { getEquipment } from "../data/equipments";
import { getMonsterStatData } from "../data/monster-stats";
import { mergeUniquePassives } from "../data/passives";
import { getTrait } from "../data/traits";
import { calculateStats } from "../lib/calculations/stats";
import { assetPath } from "../lib/asset-path";
import type { Build, Mutation } from "../types/build";
import type { Monster } from "../types/monster";

import { TraitIcon } from "./trait-icon";

export type SavedBuildSlot = {
    version: 2;
    savedAt: number;
    name: string;
    favorite: boolean;
    build: Build;
};

type SavedBuildsPanelProps = {
    mode: "save" | "load";
    currentBuild: Build;
    currentMonster: Monster | null;
    monsters: Monster[];
    slots: Array<SavedBuildSlot | null>;
    onCloseAction: () => void;
    onSaveSlotAction: (slotIndex: number, name?: string) => boolean;
    onLoadSlotAction: (slotIndex: number) => boolean;
    onClearSlotAction: (slotIndex: number) => void;
    onRenameSlotAction: (slotIndex: number, name: string) => boolean;
    onToggleFavoriteAction: (slotIndex: number) => boolean;
    onCompareBuildsAction: (slotIndices: number[]) => boolean;
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
                           monsterById,
                       }: {
    build: Build;
    monster: Monster | null;
    compact?: boolean;
    monsterById: ReadonlyMap<string, Monster>;
}) {
    const weapon = getEquipment(build.weaponId);
    const armor = getEquipment(build.armorId);
    const trait = getTrait(build.traitId);
    const statData = monster ? getMonsterStatData(monster.id) : null;
    const teammateMonsters = (build.teammateMonsterIds ?? [null, null])
        .map((id) => id ? monsterById.get(id) ?? null : null)
        .filter((candidate): candidate is Monster => candidate !== null);
    const effectivePassives = mergeUniquePassives(
        monster?.passives,
        ...teammateMonsters.map((teammate) => teammate.passives),
    );
    const stats = statData && build.rank
        ? calculateStats(statData, build, effectivePassives)
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
                    {build.targetIsBoss && (
                        <span className="rounded border border-[#7182ff]/35 bg-[#202846] px-1.5 py-0.5 text-[9px] font-semibold normal-case text-[#aeb8ff]">
                            Boss Target
                        </span>
                    )}
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
                                     onRenameSlotAction,
                                     onToggleFavoriteAction,
                                     onCompareBuildsAction,
                                 }: SavedBuildsPanelProps) {
    const [search, setSearch] = useState("");
    const [selectedCompare, setSelectedCompare] = useState<number[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [nameDraft, setNameDraft] = useState("");
    const [saveName, setSaveName] = useState(currentMonster ? `${currentMonster.name} Build` : "New Build");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortMode, setSortMode] = useState<"recent" | "name" | "monster">("recent");

    const monsterById = useMemo(
        () => new Map(monsters.map((monster) => [monster.id, monster] as const)),
        [monsters],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCloseAction();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onCloseAction]);

    const usedCount = slots.filter(Boolean).length;
    const firstEmptySlotIndex = slots.findIndex((slot) => slot === null);
    const hasEmptySlot = firstEmptySlotIndex !== -1;

    const indexedSlots = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return slots
            .map((slot, index) => ({ slot, index }))
            // Empty slots are represented by one clear "Save New Build" action instead
            // of rendering up to 20 large blank cards.
            .filter(({ slot }) => Boolean(slot))
            .filter(({ slot }) => {
                if (!slot) return false;
                if (favoritesOnly && !slot.favorite) return false;
                if (!normalizedSearch) return true;

                const monster = slot.build.monsterId ? monsterById.get(slot.build.monsterId) : null;
                return [slot.name, monster?.name, slot.build.rank, `+${slot.build.enhancement}`]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch);
            })
            .sort((a, b) => {
                if (!a.slot || !b.slot) return 0;
                if (Boolean(a.slot.favorite) !== Boolean(b.slot.favorite)) return a.slot.favorite ? -1 : 1;

                if (sortMode === "name") return a.slot.name.localeCompare(b.slot.name);
                if (sortMode === "monster") {
                    const aMonster = a.slot.build.monsterId ? monsterById.get(a.slot.build.monsterId)?.name ?? "" : "";
                    const bMonster = b.slot.build.monsterId ? monsterById.get(b.slot.build.monsterId)?.name ?? "" : "";
                    return aMonster.localeCompare(bMonster) || a.slot.name.localeCompare(b.slot.name);
                }

                return b.slot.savedAt - a.slot.savedAt;
            });
    }, [favoritesOnly, monsterById, search, slots, sortMode]);

    const toggleCompare = (index: number) => {
        setSelectedCompare((current) => {
            if (current.includes(index)) return current.filter((value) => value !== index);
            if (current.length >= 4) return current;
            return [...current, index];
        });
    };

    const saveInto = (index: number, fallbackName?: string) => {
        const name = (saveName.trim() || fallbackName || `${currentMonster?.name ?? "Monster"} Build`).slice(0, 40);
        if (onSaveSlotAction(index, name)) onCloseAction();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050912]/78 p-3 backdrop-blur-[3px] sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={mode === "save" ? "Save build" : "Load build"}
            onMouseDown={(event) => {
                if (event.currentTarget === event.target) onCloseAction();
            }}
        >
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#3b4759] bg-[#101721] shadow-[0_30px_90px_rgba(0,0,0,0.72)]">
                <div className="flex items-start justify-between gap-4 border-b border-[#344050] bg-[#101721]/97 px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">Build Library</p>
                            <span className="rounded-full border border-[#344050] bg-[#141c28] px-2 py-0.5 text-[9px] font-semibold text-[#8e99ad]">
                                {usedCount} / {slots.length} builds
                            </span>
                        </div>
                        <h2 className="mt-1 text-xl font-bold text-[#f6f8fc]">
                            {mode === "save" ? "Save current build" : "Saved builds"}
                        </h2>
                        <p className="mt-1 text-xs text-[#8993a5]">
                            {mode === "save"
                                ? "Save to the next open slot, or overwrite an existing setup below."
                                : "Search, favorite, load, rename, or send saved setups directly into Monster Compare."}
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

                <div className="border-b border-[#293647] bg-[#0d141e] px-4 py-3 sm:px-5">
                    <div className="flex flex-col gap-3">
                        {mode === "save" && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                <label className="min-w-0 flex-1">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Build name</span>
                                    <input
                                        value={saveName}
                                        maxLength={40}
                                        onChange={(event) => setSaveName(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" && hasEmptySlot) saveInto(firstEmptySlotIndex);
                                        }}
                                        className="w-full rounded-lg border border-[#344050] bg-[#111a26] px-3 py-2.5 text-sm font-semibold text-[#eef2fb] outline-none focus:border-[#7182ff]"
                                        placeholder="e.g. Boss Build"
                                    />
                                </label>
                                <button
                                    type="button"
                                    disabled={!hasEmptySlot}
                                    onClick={() => {
                                        if (hasEmptySlot) saveInto(firstEmptySlotIndex);
                                    }}
                                    className="rounded-lg bg-[#7182ff] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#8290ff] disabled:cursor-not-allowed disabled:bg-[#2c3442] disabled:text-[#707b8e] sm:min-w-[160px]"
                                >
                                    {hasEmptySlot ? "Save New Build" : "20 / 20 Full"}
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                            <label className="min-w-0 flex-1">
                                <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Search saved builds</span>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="w-full rounded-lg border border-[#344050] bg-[#111a26] px-3 py-2.5 text-sm text-[#eef2fb] outline-none placeholder:text-[#65738a] focus:border-[#7182ff]"
                                    placeholder="Monster, build name, rank..."
                                />
                            </label>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    aria-pressed={favoritesOnly}
                                    onClick={() => setFavoritesOnly((current) => !current)}
                                    className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition ${favoritesOnly ? "border-[#ffd85a]/65 bg-[#3b3218] text-[#ffe27e]" : "border-[#344050] bg-[#141c28] text-[#9aa6b8] hover:border-[#56657a] hover:text-white"}`}
                                >
                                    ★ Favorites
                                </button>
                                <label className="sr-only" htmlFor="saved-build-sort">Sort saved builds</label>
                                <select
                                    id="saved-build-sort"
                                    value={sortMode}
                                    onChange={(event) => setSortMode(event.target.value as "recent" | "name" | "monster")}
                                    className="rounded-lg border border-[#344050] bg-[#141c28] px-3 py-2.5 text-xs font-semibold text-[#c7d0df] outline-none focus:border-[#7182ff]"
                                >
                                    <option value="recent">Recently updated</option>
                                    <option value="name">Build name</option>
                                    <option value="monster">Monster</option>
                                </select>
                                {mode === "load" && (
                                    <button
                                        type="button"
                                        disabled={selectedCompare.length < 2}
                                        onClick={() => onCompareBuildsAction(selectedCompare)}
                                        className="rounded-lg border border-[#7182ff]/55 bg-[#202846] px-4 py-2.5 text-xs font-bold text-[#d5dbff] transition hover:border-[#8290ff] hover:bg-[#263052] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Compare Selected ({selectedCompare.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto p-4 sm:p-5">
                    {mode === "save" && currentMonster && (
                        <div className="mb-4 rounded-xl border border-[#7585ff]/30 bg-[#202846]/28 p-3">
                            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#aeb8ff]">Current build preview</p>
                            <BuildSnapshot build={currentBuild} monster={currentMonster} monsterById={monsterById} compact />
                        </div>
                    )}

                    {mode === "save" && usedCount > 0 && (
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">
                                Existing builds
                            </p>
                            <p className="text-[10px] text-[#69768a]">Choose one below to overwrite it.</p>
                        </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {indexedSlots.map(({ slot, index }) => {
                            const savedMonster = slot
                                ? monsterById.get(slot.build.monsterId) ?? null
                                : null;
                            const selected = selectedCompare.includes(index);

                            if (!slot) return null;

                            return (
                                <section
                                    key={index}
                                    className={`relative min-w-0 rounded-xl border p-3 transition ${selected ? "border-[#7182ff] bg-[#17213a] shadow-[0_0_0_1px_rgba(113,130,255,0.18)]" : "border-[#344050] bg-[#0f1620] hover:border-[#4d5c71]"}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                {editingIndex === index ? (
                                                    <input
                                                        value={nameDraft}
                                                        maxLength={40}
                                                        autoFocus
                                                        onChange={(event) => setNameDraft(event.target.value)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter" && onRenameSlotAction(index, nameDraft)) setEditingIndex(null);
                                                            if (event.key === "Escape") setEditingIndex(null);
                                                        }}
                                                        onBlur={() => {
                                                            if (nameDraft.trim()) onRenameSlotAction(index, nameDraft);
                                                            setEditingIndex(null);
                                                        }}
                                                        className="min-w-0 flex-1 rounded border border-[#7182ff] bg-[#111a26] px-2 py-1 text-sm font-bold text-white outline-none"
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        title="Rename build"
                                                        onClick={() => {
                                                            setEditingIndex(index);
                                                            setNameDraft(slot.name);
                                                        }}
                                                        className="min-w-0 truncate text-left text-sm font-bold text-[#f6f8fc] hover:text-[#aeb8ff]"
                                                    >
                                                        {slot.name}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleFavoriteAction(index)}
                                                    title={slot.favorite ? "Unfavorite build" : "Favorite build"}
                                                    className={`shrink-0 text-lg leading-none transition ${slot.favorite ? "text-[#ffd85a]" : "text-[#566276] hover:text-[#ffd85a]"}`}
                                                >
                                                    ★
                                                </button>
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2 text-[9px] text-[#69768a]">
                                                <span>Updated {formatSavedTime(slot.savedAt)}</span>
                                                <span>•</span>
                                                <span>Slot {index + 1}</span>
                                            </div>
                                        </div>
                                        {mode === "load" && (
                                            <button
                                                type="button"
                                                onClick={() => toggleCompare(index)}
                                                className={`rounded-full border px-2 py-1 text-[9px] font-bold transition ${selected ? "border-[#7182ff] bg-[#283462] text-white" : "border-[#344050] bg-[#141c28] text-[#8e99ad] hover:border-[#5a6980]"}`}
                                            >
                                                {selected ? "Selected" : "Compare"}
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-3">
                                        <BuildSnapshot build={slot.build} monster={savedMonster} monsterById={monsterById} compact />
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#293647] pt-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (mode === "save") saveInto(index, slot.name);
                                                else if (onLoadSlotAction(index)) onCloseAction();
                                            }}
                                            className="rounded-md bg-[#7182ff] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#8290ff]"
                                        >
                                            {mode === "save" ? "Overwrite Build" : "Load Build"}
                                        </button>
                                        {mode === "load" ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const another = indexedSlots.find(({ slot: other, index: otherIndex }) => other && otherIndex !== index)?.index;
                                                    if (typeof another === "number") onCompareBuildsAction([index, another]);
                                                }}
                                                className="rounded-md border border-[#4b5d78] bg-[#141c28] px-3 py-2 text-[10px] font-bold text-[#c7d0df] transition hover:border-[#7182ff] hover:text-white"
                                            >
                                                Compare Build
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingIndex(index);
                                                    setNameDraft(slot.name);
                                                }}
                                                className="rounded-md border border-[#4b5d78] bg-[#141c28] px-3 py-2 text-[10px] font-bold text-[#c7d0df] transition hover:border-[#7182ff] hover:text-white"
                                            >
                                                Rename
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onClearSlotAction(index)}
                                        className="mt-2 w-full rounded-md py-1.5 text-[9px] font-semibold text-[#69768a] transition hover:bg-[#151d29] hover:text-[#ff9a7f]"
                                    >
                                        Delete saved build
                                    </button>
                                </section>
                            );
                        })}
                    </div>

                    {indexedSlots.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#344050] bg-[#0d131d] px-6 py-12 text-center">
                            <p className="text-sm font-bold text-[#d6ddea]">
                                {usedCount === 0 ? "No saved builds yet." : "No saved builds match these filters."}
                            </p>
                            <p className="mt-1 text-xs text-[#69768a]">
                                {usedCount === 0
                                    ? mode === "save"
                                        ? "Name the current setup above and choose Save New Build."
                                        : "Save a build from the calculator and it will appear here."
                                    : "Try another search or turn off Favorites."}
                            </p>
                        </div>
                    )}

                    <p className="mt-4 text-center text-[10px] text-[#69768a]">
                        Builds are stored in this browser. Account multipliers remain global and are not overwritten when a build is loaded.
                    </p>
                </div>
            </div>
        </div>
    );
}
