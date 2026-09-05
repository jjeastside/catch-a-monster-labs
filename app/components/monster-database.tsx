"use client";
import { PageHeading } from "./page-heading";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { EvolutionTree } from "./evolution-tree";

import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { getPassiveImagePath } from "../data/passives";
import {
    getPassiveConditionDescription,
    getPassiveDescription,
    getPassiveUiName,
} from "../lib/passive-display";
import { getSkill, getSkillDisplayName } from "../data/skills";
import { assetPath } from "../lib/asset-path";
import { getMonsterComparisonStats, type PassiveCompareMode } from "../lib/monster-comparison";
import {
    databaseSkillEffectDetails,
    databaseSkillEffectOptions,
    getDatabaseSkillDescription,
    getDatabaseSkillEffects,
    type DatabaseSkillEffect,
} from "../lib/skill-display";
import {
    EVOLUTION_STEP,
    MAX_EVOLUTION_PERCENT,
    MIN_EVOLUTION_PERCENT,
    clampEvolutionPercent,
    getEvolutionBarFill,
} from "../lib/calculations/evolution";
import type { Passive } from "../types/build";
import type { GeneratedMonster, Rarity } from "../types/monster";

const rarityClasses: Record<Rarity, string> = {
    Common: "border-[#586273]",
    Uncommon: "border-[#2f9d62]",
    Rare: "border-[#299ddd]",
    Epic: "border-[#bd45d8]",
    Legendary: "border-[#ff9f43]",
    Mythical: "border-[#8f7cff] shadow-[0_0_18px_rgba(113,130,255,0.16)]",
    Secret: "border-[#712c37]",
    Void: "border-[#28e9c5]",
};

const elements = ["All", "Common", "Water", "Fire", "Grass", "Ice", "Ground"] as const;
const rarities = ["All", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythical", "Secret", "Void"] as const;
type SortKey = "index" | "dps" | "damage" | "health";
type ObtainabilityFilter = "all" | "obtainable" | "unobtainable";
type PassiveFilter = "all" | "none" | Passive;
type SourceFilter = "All" | string;
type LocationFilter = "All" | string;
type SkillEffectFilter = "all" | DatabaseSkillEffect;
type EvolutionFilter = "all" | "can-evolve" | "evolved" | "no-evolution";


function compactNumber(value: number): string {
    return new Intl.NumberFormat("en-US", {
        notation: value >= 100_000 ? "compact" : "standard",
        maximumFractionDigits: value >= 100_000 ? 2 : 1,
    }).format(value);
}

function isObtainable(monster: GeneratedMonster): boolean {
    return monster.sources.some((source) => source.status === "Current");
}

function sourceLabel(monster: GeneratedMonster): string {
    const currentSource = monster.sources.find((source) => source.status === "Current");
    const source = currentSource ?? monster.sources[0];

    if (!source) return "Unknown source";
    if (source.location) return source.location;
    return source.name;
}

function sourceDescription(monster: GeneratedMonster): string {
    if (monster.sources.length === 0) return "No source data yet.";

    return monster.sources
        .map((source) => {
            const where = source.location ? ` · ${source.location}` : "";
            const condition = source.condition ? ` · ${source.condition}` : "";
            return `${source.name}${where}${condition} (${source.status})`;
        })
        .join("\n");
}

function monsterHash(monster: GeneratedMonster): string {
    return monster.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}


function getDatabaseSkillIconPath(skillId: string): string {
    const iconAliases: Record<string, string> = {
        "soul-reap-chain-vulnerability": "soul-reap-chain",
        "ghost-impact-vulnerability": "ghost-impact",
        "soul-reap-chain-scareharvest": "soul-reap-chain-poison",
    };

    return `/skill-icons/${iconAliases[skillId] ?? skillId}.png`;
}


function getMonsterPassiveIds(monster: GeneratedMonster): Passive[] {
    return (monster.passives ?? []).map((passive) => passive.id);
}

function getEvolutionChildren(monsterId: string): GeneratedMonster[] {
    return GENERATED_MONSTERS
        .filter((monster) => monster.evolutionSource === monsterId)
        .sort((a, b) => a.indexPosition - b.indexPosition);
}

function getEvolutionRoot(monster: GeneratedMonster): GeneratedMonster {
    let current = monster;
    const visited = new Set<string>();

    while (current.evolutionSource && !visited.has(current.id)) {
        visited.add(current.id);
        const parent = GENERATED_MONSTERS.find((candidate) => candidate.id === current.evolutionSource);
        if (!parent) break;
        current = parent;
    }

    return current;
}

type EvolutionFamilyMember = {
    monster: GeneratedMonster;
    depth: number;
};

function getEvolutionFamily(monster: GeneratedMonster): EvolutionFamilyMember[] {
    const root = getEvolutionRoot(monster);
    const family: EvolutionFamilyMember[] = [];
    const queue: EvolutionFamilyMember[] = [{ monster: root, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current.monster.id)) continue;

        visited.add(current.monster.id);
        family.push(current);

        for (const child of getEvolutionChildren(current.monster.id)) {
            queue.push({ monster: child, depth: current.depth + 1 });
        }
    }

    return family;
}

function matchesEvolutionFilter(monster: GeneratedMonster, filter: EvolutionFilter): boolean {
    switch (filter) {
        case "can-evolve":
            return monster.hasEvolution || getEvolutionChildren(monster.id).length > 0;
        case "evolved":
            return Boolean(monster.isEvolved || monster.evolutionSource);
        case "no-evolution":
            return (
                !monster.hasEvolution &&
                !monster.isEvolved &&
                !monster.evolutionSource &&
                getEvolutionChildren(monster.id).length === 0
            );
        case "all":
        default:
            return true;
    }
}

function monsterHasSkillEffect(monster: GeneratedMonster, effect: DatabaseSkillEffect): boolean {
    return monster.skillIds.some((skillId) => {
        const skill = getSkill(skillId);
        return getDatabaseSkillEffects(skill).includes(effect);
    });
}

function FilterSelect({
                          label,
                          value,
                          onChange,
                          children,
                      }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
}) {
    return (
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#69768a]">
            <span>{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 rounded-lg border border-[#344050] bg-[#101722] px-3 text-xs font-semibold normal-case tracking-normal text-[#dbe2ee] outline-none transition focus:border-[#7182ff]"
            >
                {children}
            </select>
        </label>
    );
}

function MonsterCard({
                         monster,
                         selected,
                         onSelect,
                         evolutionPercent,
                         passiveCompareMode,
                         sortBy,
                     }: {
    monster: GeneratedMonster;
    selected: boolean;
    onSelect: () => void;
    evolutionPercent: number;
    passiveCompareMode: PassiveCompareMode;
    sortBy: SortKey;
}) {
    const skills = monster.skillIds.map((id) => getSkill(id)).filter(Boolean).slice(0, 3);
    const passive = monster.passives?.[0] ?? null;
    const passiveImage = passive ? getPassiveImagePath(passive) : null;
    const comparisonStats = getMonsterComparisonStats(monster, evolutionPercent, passiveCompareMode);

    return (
        <button
            id={`monster-${monster.id}`}
            type="button"
            onClick={onSelect}
            className={`group min-w-0 overflow-hidden rounded-xl border bg-[#121a25] text-left transition hover:-translate-y-0.5 hover:border-[#7182ff]/70 hover:bg-[#151f2d] ${rarityClasses[monster.rarity]} ${
                selected ? "border-[#8d9aff] bg-[#172136] ring-2 ring-[#7182ff] ring-offset-2 ring-offset-[#0d131d] shadow-[0_0_28px_rgba(113,130,255,0.24)]" : ""
            }`}
        >
            <div className="relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(113,130,255,0.14),transparent_58%)] sm:aspect-[4/3]">
                {monster.image ? (
                    <img
                        src={assetPath(monster.image)}
                        alt={monster.name}
                        className="h-full w-full object-contain p-2 transition duration-200 group-hover:scale-[1.035] sm:p-3"
                    />
                ) : null}
                <span className={`absolute right-2 top-2 rounded-full border px-2 py-1 text-[10px] font-bold ${
                    sortBy === "index"
                        ? "border-[#7182ff] bg-[#202846]/95 text-[#c7ccff] shadow-[0_0_12px_rgba(113,130,255,0.25)]"
                        : "border-[#344050] bg-[#0d131d]/90 text-[#aeb9cb]"
                }`}>
                    #{monster.indexPosition}
                </span>
                {!isObtainable(monster) ? (
                    <span className="absolute left-2 top-2 rounded-full border border-[#7a4550] bg-[#2d1419]/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#ff8f9c]">
                        Unobtainable
                    </span>
                ) : null}
            </div>

            <div className="p-2.5 sm:p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-xs font-bold text-[#f4f7fb] sm:text-sm">{monster.name}</h3>
                        <p className="mt-0.5 truncate text-[9px] font-semibold text-[#9da9bb] sm:text-[11px]">
                            {monster.rarity} · {monster.element}
                        </p>
                    </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] sm:mt-3 sm:gap-1.5 sm:text-[10px]">
                    <div className={`min-w-0 rounded-md border px-1 py-1.5 sm:px-2 ${sortBy === "damage" ? "border-[#34d5ff]/70 bg-[#102631]" : "border-[#293443] bg-[#0e151f]"}`}>
                        <span className={`block text-[8px] font-bold uppercase tracking-[0.06em] ${sortBy === "damage" ? "text-[#57dcff]" : "text-[#6f7c90]"}`}>DMG</span>
                        <span className={`mt-0.5 block truncate font-bold ${sortBy === "damage" ? "text-[#b8f3ff]" : "text-[#dbe2ee]"}`}>{compactNumber(comparisonStats.damage)}</span>
                    </div>
                    <div className={`min-w-0 rounded-md border px-1 py-1.5 sm:px-2 ${sortBy === "health" ? "border-[#34d5ff]/70 bg-[#102631]" : "border-[#293443] bg-[#0e151f]"}`}>
                        <span className={`block text-[8px] font-bold uppercase tracking-[0.06em] ${sortBy === "health" ? "text-[#57dcff]" : "text-[#6f7c90]"}`}>HP</span>
                        <span className={`mt-0.5 block truncate font-bold ${sortBy === "health" ? "text-[#b8f3ff]" : "text-[#dbe2ee]"}`}>{compactNumber(comparisonStats.health)}</span>
                    </div>
                    <div className={`min-w-0 rounded-md border px-1 py-1.5 sm:px-2 ${sortBy === "dps" ? "border-[#34d5ff]/70 bg-[#102631]" : "border-[#293443] bg-[#0e151f]"}`}>
                        <span className={`block text-[8px] font-bold uppercase tracking-[0.06em] ${sortBy === "dps" ? "text-[#57dcff]" : "text-[#7182ff]"}`}>DPS</span>
                        <span className={`mt-0.5 block truncate font-bold ${sortBy === "dps" ? "text-[#b8f3ff]" : "text-[#dbe2ee]"}`}>{compactNumber(comparisonStats.dps)}</span>
                    </div>
                </div>

                <div className="mt-2 flex min-h-6 items-center gap-1 sm:mt-3 sm:min-h-7 sm:gap-1.5">
                    {passive && passiveImage ? (
                        <img
                            src={assetPath(passiveImage)}
                            alt={getPassiveUiName(passive)}
                            title={getPassiveUiName(passive)}
                            className="size-6 rounded-md border border-[#344050] bg-[#0d131d] object-contain p-0.5 sm:size-7"
                        />
                    ) : null}
                    {skills.map((skill, skillIndex) =>
                        skill ? (
                            <img
                                key={`${monster.id}-${skill.id}-${skillIndex}`}
                                src={assetPath(getDatabaseSkillIconPath(skill.id))}
                                alt={getSkillDisplayName(skill.name)}
                                title={getSkillDisplayName(skill.name)}
                                className="size-6 rounded-md border border-[#344050] bg-[#0d131d] object-cover sm:size-7"
                            />
                        ) : null,
                    )}
                </div>

                <p className="mt-3 hidden truncate border-t border-[#293443] pt-2 text-[10px] font-medium text-[#7f8b9e] sm:block">
                    {sourceLabel(monster)}
                </p>
            </div>
        </button>
    );
}

function DetailPanel({
                         monster,
                         evolutionPercent,
                         passiveCompareMode,
                         onMonsterSelect,
                         sortBy,
                         desktopInspector = false,
                     }: {
    monster: GeneratedMonster;
    evolutionPercent: number;
    passiveCompareMode: PassiveCompareMode;
    onMonsterSelect: (monsterId: string) => void;
    sortBy: SortKey;
    desktopInspector?: boolean;
}) {
    const skills = monster.skillIds.map((id) => getSkill(id)).filter(Boolean);
    const passive = monster.passives?.[0] ?? null;
    const passiveImage = passive ? getPassiveImagePath(passive) : null;
    const comparisonStats = getMonsterComparisonStats(monster, evolutionPercent, passiveCompareMode)

    async function copyMonsterLink() {
        const url = `${window.location.origin}${assetPath(`/monster-database/${monster.id}/`)}`;
        await navigator.clipboard.writeText(url);
    }

    return (
        <div className="min-w-0">
            <aside className="overflow-hidden rounded-2xl border border-[#344050] bg-[#111925]">
                <div className={desktopInspector ? "grid grid-cols-[160px_minmax(0,1fr)] border-b border-[#344050]" : ""}>
                    <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(113,130,255,0.17),transparent_62%)] ${desktopInspector ? "min-h-40 border-r border-[#344050]" : "aspect-[16/9] border-b border-[#344050]"}`}>
                        {monster.image ? (
                            <img src={assetPath(monster.image)} alt={monster.name} className={`h-full w-full object-contain ${desktopInspector ? "p-4" : "p-6"}`} />
                        ) : null}
                    </div>

                    <div className={desktopInspector ? "flex items-center p-4" : "p-5 pb-0"}>
                        <div className="flex w-full items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-2xl font-black tracking-tight text-white">{monster.name}</h2>
                                <p className="mt-1 text-sm font-semibold text-[#aab5c6]">
                                    {monster.rarity} · {monster.element} · Index {monster.indexPosition}
                                </p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                                isObtainable(monster)
                                    ? "border-[#2f7656] bg-[#10251c] text-[#6bdca2]"
                                    : "border-[#7a4550] bg-[#2d1419] text-[#ff8f9c]"
                            }`}>
                                {isObtainable(monster) ? "Obtainable" : "Unavailable"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={desktopInspector ? "p-4" : "px-5 pb-5"}>

                    <section className={`${desktopInspector ? "" : "mt-5"} border-t border-[#293443] pt-4`}>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#8290ff]">Reference Stats</h3>
                            <span className="group relative inline-flex">
                                <button type="button" aria-label="Explain reference stats" className="grid size-5 place-items-center rounded-full border border-[#4b5b70] bg-[#121b27] text-[10px] font-black text-[#aeb9ca] transition hover:border-[#7182ff] hover:text-white focus:border-[#7182ff] focus:text-white focus:outline-none">?</button>
                                <span role="tooltip" className="pointer-events-none absolute left-0 top-7 z-30 hidden w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-[#43516a] bg-[#080e16] p-3 text-left text-[11px] font-medium normal-case leading-5 tracking-normal text-[#c5cedb] shadow-[0_12px_32px_rgba(0,0,0,0.65)] group-hover:block group-focus-within:block">
                                    Comparison preset: Base E-rank / Level 1 · selected EM for evolved forms · {passiveCompareMode === "none" ? "no passives" : passiveCompareMode === "conditional" ? "always-active + conditional self passives" : "non-conditional self passives"} · expected crit · no gear, traits, mutations, account bonuses, or combat-context bonuses.
                                </span>
                            </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                            {[
                                ["Damage", compactNumber(comparisonStats.damage)],
                                ["Health", compactNumber(comparisonStats.health)],
                                ["DPS", compactNumber(comparisonStats.dps)],
                                ["Index", monster.indexPosition],
                            ].map(([label, value]) => {
                                const statKey = label.toString().toLowerCase() as SortKey;
                                const active = sortBy === statKey;

                                return (
                                <div key={label} className={`rounded-lg border p-2.5 ${active ? "border-[#34d5ff]/70 bg-[#102631] shadow-[0_0_18px_rgba(52,213,255,0.1)]" : "border-[#293443] bg-[#0d141e]"}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-[0.08em] ${active ? "text-[#57dcff]" : "text-[#7f8da2]"}`}>{label}</p>
                                    <p className={`mt-1 text-lg font-black ${active ? "text-[#b8f3ff]" : "text-[#f2f5fa]"}`}>{value}</p>
                                </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="mt-4 border-t border-[#293443] pt-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#8290ff]">Skills</h3>
                        <div className="mt-3 grid gap-2">
                            {skills.map((skill, skillIndex) =>
                                skill ? (
                                    <div
                                        key={`${monster.id}-${skill.id}-${skillIndex}`}
                                        className="flex gap-3 rounded-lg border border-[#293443] bg-[#0d141e] p-2.5"
                                    >
                                        <img
                                            src={assetPath(getDatabaseSkillIconPath(skill.id))}
                                            alt=""
                                            className="size-10 shrink-0 rounded-md border border-[#344050] object-cover"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-bold text-[#f4f6fa]">{getSkillDisplayName(skill.name)}</p>
                                                {skill.cooldown !== null ? (
                                                    <span className="text-xs font-semibold text-[#93a0b3]">{skill.cooldown}s</span>
                                                ) : null}
                                            </div>
                                            <p className="mt-1 text-xs leading-5 text-[#9ba7b9]">
                                                {getDatabaseSkillDescription(skill)}
                                            </p>
                                            {getDatabaseSkillEffects(skill).length > 0 ? (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {getDatabaseSkillEffects(skill).map((effect) => (
                                                        <span
                                                            key={effect}
                                                            title={databaseSkillEffectDetails[effect].label}
                                                            className="inline-flex items-center gap-1 rounded border border-[#344050] bg-[#121b27] px-1.5 py-0.5 text-[10px] font-bold text-[#aeb9ca]"
                                                        >
                                                            <img src={assetPath(databaseSkillEffectDetails[effect].icon)} alt="" className="size-4 object-contain" />
                                                            {databaseSkillEffectDetails[effect].label}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null,
                            )}
                        </div>
                    </section>

                    <section className="mt-4 border-t border-[#293443] pt-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#8290ff]">Passive</h3>
                        {passive ? (
                            <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#293443] bg-[#0d141e] p-3">
                                {passiveImage ? (
                                    <img
                                        src={assetPath(passiveImage)}
                                        alt=""
                                        className="size-10 shrink-0 object-contain"
                                    />
                                ) : null}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-bold text-[#f4f6fa]">{getPassiveUiName(passive)}</p>
                                        {getPassiveConditionDescription(passive) ? (
                                            <span className="rounded border border-[#8b6b38] bg-[#2b2112] px-1.5 py-0.5 text-[9px] font-bold text-[#e9b968]">
                                                {getPassiveConditionDescription(passive)}
                                            </span>
                                        ) : (
                                            <span className="rounded border border-[#315f4c] bg-[#10241c] px-1.5 py-0.5 text-[9px] font-bold text-[#69d99f]">
                                                Always active
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1.5 text-xs leading-5 text-[#aab5c6]">
                                        {getPassiveDescription(passive)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-xs text-[#6f7c90]">No passive.</p>
                        )}
                    </section>

                    <section className="mt-4 border-t border-[#293443] pt-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#8290ff]">Obtained From</h3>
                        <p className="mt-3 whitespace-pre-line rounded-lg border border-[#293443] bg-[#0d141e] p-3 text-xs leading-5 text-[#a1adbe]">
                            {sourceDescription(monster)}
                        </p>
                    </section>

                    <section className="mt-4 border-t border-[#293443] pt-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#8290ff]">Evolution</h3>
                            {getEvolutionFamily(monster).length > 1 ? (
                                <span className="text-xs font-semibold text-[#8592a6]">
                                    {getEvolutionFamily(monster).length} forms
                                </span>
                            ) : null}
                        </div>

                        {getEvolutionFamily(monster).length > 1 ? (
                            <div className="mt-3 rounded-lg border border-[#293443] bg-[#0d141e] p-3">
                                <EvolutionTree
                                    rootMonster={getEvolutionRoot(monster)}
                                    selectedMonsterId={monster.id}
                                    compact
                                    onMonsterSelect={onMonsterSelect}
                                />
                            </div>
                        ) : (
                            <div className="mt-3 rounded-lg border border-dashed border-[#344050] bg-[#0d141e] p-4 text-center text-xs text-[#8794a8]">
                                No known evolution family.
                            </div>
                        )}
                    </section>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        <Link
                            href={`/#${monsterHash(monster)}`}
                            className="rounded-lg bg-[#586af0] px-3 py-2.5 text-center text-sm font-black text-white transition hover:bg-[#7182ff]"
                        >
                            Open in Calculator
                        </Link>
                        <Link
                            href={`/monster-database/${monster.id}`}
                            className="rounded-lg border border-[#586af0]/70 bg-[#18213a] px-3 py-2.5 text-center text-sm font-black text-[#cbd1ff] transition hover:border-[#7182ff] hover:text-white"
                        >
                            View Profile
                        </Link>
                        <button
                            type="button"
                            onClick={() => void copyMonsterLink()}
                            className="rounded-lg border border-[#344050] bg-[#141d29] px-3 py-2.5 text-sm font-bold text-[#c4cedd] transition hover:border-[#7182ff]/70 hover:text-white"
                        >
                            Copy Link
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}

type DatabaseEvolutionMultiplierEditorProps = {
    value: number;
    onChange: (value: number) => void;
    sortBy: SortKey;
};

function DatabaseEvolutionMultiplierEditor({
    value,
    onChange,
    sortBy,
}: DatabaseEvolutionMultiplierEditorProps) {
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

    const displayedValue = dragPreview ?? value;
    const inputValue = inputDraft ?? displayedValue.toFixed(2);
    const parsedValue = Number(inputValue);
    const isNumeric = inputValue.trim() !== "" && Number.isFinite(parsedValue);
    const isOutOfRange = isNumeric && (
        parsedValue < MIN_EVOLUTION_PERCENT || parsedValue > MAX_EVOLUTION_PERCENT
    );
    const evolutionBarFill = getEvolutionBarFill(displayedValue);
    const precisionFill = precisionRange
        ? ((displayedValue - precisionRange.min) / (precisionRange.max - precisionRange.min)) * 100
        : 0;

    const commitInputValue = () => {
        onChange(isNumeric ? clampEvolutionPercent(parsedValue) : value);
        setInputDraft(null);
    };

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#69768a]">
                        Evolution Multiplier
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#59677c]">
                        Applies only to evolved monsters when comparing {sortBy.toUpperCase()}. Drag upward for 0.01% precision.
                    </p>
                </div>
                <span className="shrink-0 text-[9px] font-semibold text-[#718099]">
                    {MIN_EVOLUTION_PERCENT}%–{MAX_EVOLUTION_PERCENT}%
                </span>
            </div>

            <div className="flex items-end gap-2">
                <div className="relative min-w-0 flex-1">
                    {precisionRange && typeof document !== "undefined" && createPortal(
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

                    <div className="relative rounded-md border border-[#f4d4b3]/70 bg-[#343434] p-[2px] shadow-inner">
                        <div className="relative h-7 overflow-hidden rounded-[4px] bg-[#3a3a3a]">
                            <div
                                className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffd2a3] via-[#ffb160] to-[#ff8a24]"
                                style={{ width: `${evolutionBarFill}%` }}
                            />
                            <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-[9px] font-bold tabular-nums text-white [text-shadow:0_1px_0_#111,1px_0_0_#111,-1px_0_0_#111,0_-1px_0_#111]">
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
                                    onChange(clampEvolutionPercent(Number(event.target.value)));
                                    setInputDraft(null);
                                }}
                                aria-label="Database EM percentage"
                                aria-valuemin={MIN_EVOLUTION_PERCENT}
                                aria-valuemax={MAX_EVOLUTION_PERCENT}
                                aria-valuenow={displayedValue}
                                title="Drag upward while adjusting to open the precision slider."
                                className="absolute inset-0 z-20 h-full w-full cursor-ew-resize touch-none appearance-none bg-transparent opacity-0"
                            />
                        </div>
                    </div>
                </div>

                <label className="grid w-[104px] shrink-0 gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#69768a]">EM %</span>
                    <div className="relative">
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
                            aria-label="Exact database evolution multiplier percentage"
                            aria-invalid={!isNumeric || isOutOfRange}
                            className={`h-9 w-full rounded-md border bg-[#0d141e] px-2 pr-6 text-right text-xs font-bold tabular-nums text-[#e7edf7] outline-none transition ${
                                !isNumeric || isOutOfRange
                                    ? "border-[#ff7657] focus:border-[#ff7657]"
                                    : "border-[#344050] focus:border-[#f1a45c]"
                            }`}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[9px] text-[#69768a]">%</span>
                    </div>
                </label>
            </div>
        </div>
    );
}

export function MonsterDatabase() {
    const [search, setSearch] = useState("");
    const [rarity, setRarity] = useState<(typeof rarities)[number]>("All");
    const [element, setElement] = useState<(typeof elements)[number]>("All");
    const [sourceType, setSourceType] = useState<SourceFilter>("All");
    const [location, setLocation] = useState<LocationFilter>("All");
    const [obtainability, setObtainability] = useState<ObtainabilityFilter>("all");
    const [passiveFilter, setPassiveFilter] = useState<PassiveFilter>("all");
    const [skillEffectFilter, setSkillEffectFilter] = useState<SkillEffectFilter>("all");
    const [evolutionFilter, setEvolutionFilter] = useState<EvolutionFilter>("all");
    const [evolutionPercent, setEvolutionPercent] = useState(MIN_EVOLUTION_PERCENT);
    const [passiveCompareMode, setPassiveCompareMode] = useState<PassiveCompareMode>("always");
    const [sortBy, setSortBy] = useState<SortKey>("index");
    const [selectedId, setSelectedId] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const inspectorRef = useRef<HTMLDivElement>(null);
    const inspectorShellRef = useRef<HTMLElement>(null);
    const [inspectorMaxHeight, setInspectorMaxHeight] = useState<number | null>(null);

    useEffect(() => {
        if (!selectedId && !filtersOpen) return;

        if (selectedId) {
            drawerRef.current?.scrollTo({ top: 0 });
            inspectorRef.current?.scrollTo({ top: 0 });
        }

        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;
        const selectedIsModal = Boolean(selectedId) && !window.matchMedia("(min-width: 1280px)").matches;
        const shouldLockPage = filtersOpen || selectedIsModal;

        if (shouldLockPage) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            if (selectedId) setSelectedId("");
            else setFiltersOpen(false);
        };
        window.addEventListener("keydown", closeOnEscape);

        return () => {
            window.removeEventListener("keydown", closeOnEscape);
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;
        };
    }, [selectedId, filtersOpen]);

    useEffect(() => {
        if (!selectedId) return;

        let animationFrame = 0;
        const updateInspectorHeight = () => {
            const inspectorTop = inspectorShellRef.current?.getBoundingClientRect().top;
            if (inspectorTop === undefined) return;

            const visibleTop = Math.max(16, inspectorTop);
            setInspectorMaxHeight(Math.max(320, window.innerHeight - visibleTop - 16));
        };
        const scheduleUpdate = () => {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = window.requestAnimationFrame(updateInspectorHeight);
        };

        scheduleUpdate();
        window.addEventListener("resize", scheduleUpdate);
        window.addEventListener("scroll", scheduleUpdate, { passive: true });

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", scheduleUpdate);
            window.removeEventListener("scroll", scheduleUpdate);
        };
    }, [selectedId, sortBy]);

    const sourceTypes = useMemo(
        () =>
            Array.from(
                new Set(GENERATED_MONSTERS.flatMap((monster) => monster.sources.map((source) => source.type))),
            ).sort((a, b) => a.localeCompare(b)),
        [],
    );

    const locations = useMemo(() => {
        const islandLocations = new Set(
            GENERATED_MONSTERS.flatMap((monster) =>
                monster.sources
                    .filter((source) => source.type === "Island Spawn")
                    .map((source) => source.location)
                    .filter((value): value is string => Boolean(value)),
            ),
        );

        return [...islandLocations].sort((a, b) => a.localeCompare(b));
    }, []);

    const passiveOptions = useMemo(() => {
        const byId = new Map<Passive, NonNullable<GeneratedMonster["passives"]>[number]>();

        for (const monster of GENERATED_MONSTERS) {
            for (const passive of monster.passives ?? []) {
                if (!byId.has(passive.id)) {
                    byId.set(passive.id, passive);
                }
            }
        }

        return [...byId.values()].sort((a, b) =>
            getPassiveUiName(a).localeCompare(getPassiveUiName(b)),
        );
    }, []);

    const filteredMonsters = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return [...GENERATED_MONSTERS]
            .filter((monster) => {
                if (normalizedSearch && !monster.name.toLowerCase().includes(normalizedSearch)) return false;
                if (rarity !== "All" && monster.rarity !== rarity) return false;
                if (element !== "All" && monster.element !== element) return false;
                if (sourceType !== "All" && !monster.sources.some((source) => source.type === sourceType)) return false;
                if (location !== "All" && !monster.sources.some((source) => source.location === location)) return false;
                if (obtainability === "obtainable" && !isObtainable(monster)) return false;
                if (obtainability === "unobtainable" && isObtainable(monster)) return false;
                if (passiveFilter === "none" && getMonsterPassiveIds(monster).length > 0) return false;
                if (
                    passiveFilter !== "all" &&
                    passiveFilter !== "none" &&
                    !getMonsterPassiveIds(monster).includes(passiveFilter)
                ) {
                    return false;
                }
                if (skillEffectFilter !== "all" && !monsterHasSkillEffect(monster, skillEffectFilter)) return false;
                if (!matchesEvolutionFilter(monster, evolutionFilter)) return false;
                return true;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "dps":
                        return getMonsterComparisonStats(b, evolutionPercent, passiveCompareMode).dps - getMonsterComparisonStats(a, evolutionPercent, passiveCompareMode).dps;
                    case "damage":
                        return getMonsterComparisonStats(b, evolutionPercent, passiveCompareMode).damage - getMonsterComparisonStats(a, evolutionPercent, passiveCompareMode).damage;
                    case "health":
                        return getMonsterComparisonStats(b, evolutionPercent, passiveCompareMode).health - getMonsterComparisonStats(a, evolutionPercent, passiveCompareMode).health;
                    case "index":
                    default:
                        return a.indexPosition - b.indexPosition;
                }
            });
    }, [search, rarity, element, sourceType, location, obtainability, passiveFilter, skillEffectFilter, evolutionFilter, sortBy, evolutionPercent, passiveCompareMode]);

    const selectedMonster = selectedId
        ? GENERATED_MONSTERS.find((monster) => monster.id === selectedId) ?? null
        : null;
    const activeFilterCount = [
        search.trim() !== "",
        rarity !== "All",
        element !== "All",
        sourceType !== "All",
        location !== "All",
        obtainability !== "all",
        passiveFilter !== "all",
        skillEffectFilter !== "all",
        evolutionFilter !== "all",
        sortBy !== "index",
    ].filter(Boolean).length;

    return (
        <main className="min-h-screen bg-[#0d131d] text-white">
            <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 border-b border-[#293443] pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <PageHeading title="Monster Database" image="/icons/monster-database.png">Discover every monster and explore its <span className="text-[#69dfaa]">skills, stats, and locations.</span></PageHeading>
                    <div className="rounded-full border border-[#344050] bg-[#111925] px-3 py-1.5 text-xs font-bold text-[#aeb9cb]">
                        {filteredMonsters.length} / {GENERATED_MONSTERS.length} monsters
                    </div>
                </div>

                <div className="sticky top-0 z-30 -mx-4 mt-4 border-y border-[#293443] bg-[#0d131d]/95 px-4 py-3 backdrop-blur md:hidden">
                    <div className="flex gap-2">
                        <label className="relative min-w-0 flex-1">
                            <span className="sr-only">Search monsters</span>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search monsters..."
                                className="h-11 w-full rounded-lg border border-[#344050] bg-[#111925] px-3 text-sm text-white outline-none placeholder:text-[#566376] focus:border-[#7182ff]"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setFiltersOpen(true)}
                            className="relative flex h-11 shrink-0 items-center gap-2 rounded-lg border border-[#46546a] bg-[#151e2b] px-3 text-xs font-bold text-[#dbe2ee] transition active:scale-[0.98]"
                            aria-label={`Open filters${activeFilterCount ? `, ${activeFilterCount} active` : ""}`}
                        >
                            <span aria-hidden="true">☰</span>
                            Filters
                            {activeFilterCount ? (
                                <span className="grid size-5 place-items-center rounded-full bg-[#7182ff] text-[10px] text-white">
                                    {activeFilterCount}
                                </span>
                            ) : null}
                        </button>
                    </div>
                </div>

                {filtersOpen ? (
                    <button
                        type="button"
                        aria-label="Close filters"
                        onClick={() => setFiltersOpen(false)}
                        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] md:hidden"
                    />
                ) : null}

                <section className={`${filtersOpen ? "fixed" : "hidden"} bottom-0 right-0 top-0 z-50 w-[min(360px,calc(100vw-24px))] overflow-y-auto border-l border-[#344050] bg-[#111925] p-4 shadow-[-18px_0_50px_rgba(0,0,0,0.5)] md:static md:mt-5 md:block md:w-auto md:overflow-visible md:rounded-xl md:border md:p-3 md:shadow-none`}>
                    <div className="mb-4 flex items-center justify-between md:hidden">
                        <div>
                            <p className="text-base font-black text-white">Filters & Sorting</p>
                            <p className="mt-0.5 text-[10px] font-semibold text-[#7f8b9e]">{filteredMonsters.length} monsters shown</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFiltersOpen(false)}
                            aria-label="Close filters"
                            className="grid size-10 place-items-center rounded-full border border-[#46546a] bg-[#0d141e] text-2xl leading-none text-white"
                        >
                            ×
                        </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[minmax(260px,1.6fr)_repeat(9,minmax(118px,0.7fr))]">
                        <label className="hidden gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#69768a] md:grid">
                            <span>Search</span>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search monsters..."
                                className="h-10 rounded-lg border border-[#344050] bg-[#0d141e] px-3 text-sm normal-case tracking-normal text-white outline-none placeholder:text-[#566376] focus:border-[#7182ff]"
                            />
                        </label>

                        <FilterSelect label="Rarity" value={rarity} onChange={(value) => setRarity(value as typeof rarity)}>
                            {rarities.map((value) => <option key={value}>{value}</option>)}
                        </FilterSelect>

                        <FilterSelect label="Element" value={element} onChange={(value) => setElement(value as typeof element)}>
                            {elements.map((value) => <option key={value}>{value}</option>)}
                        </FilterSelect>

                        <FilterSelect label="Source Type" value={sourceType} onChange={setSourceType}>
                            <option value="All">All</option>
                            {sourceTypes.map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </FilterSelect>

                        <FilterSelect label="Island" value={location} onChange={setLocation}>
                            <option value="All">All</option>
                            {locations.map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </FilterSelect>

                        <FilterSelect label="Obtainability" value={obtainability} onChange={(value) => setObtainability(value as ObtainabilityFilter)}>
                            <option value="all">All</option>
                            <option value="obtainable">Obtainable</option>
                            <option value="unobtainable">Unobtainable</option>
                        </FilterSelect>

                        <FilterSelect label="Passive" value={passiveFilter} onChange={(value) => setPassiveFilter(value as PassiveFilter)}>
                            <option value="all">All Passives</option>
                            <option value="none">No Passive</option>
                            {passiveOptions.map((passive) => (
                                <option key={passive.id} value={passive.id}>
                                    {getPassiveUiName(passive)}
                                </option>
                            ))}
                        </FilterSelect>

                        <FilterSelect
                            label="Skill Effect"
                            value={skillEffectFilter}
                            onChange={(value) => setSkillEffectFilter(value as SkillEffectFilter)}
                        >
                            <option value="all">All Effects</option>
                            {databaseSkillEffectOptions.map(([value, details]) => (
                                <option key={value} value={value}>
                                    {details.label}
                                </option>
                            ))}
                        </FilterSelect>

                        <FilterSelect
                            label="Evolution"
                            value={evolutionFilter}
                            onChange={(value) => setEvolutionFilter(value as EvolutionFilter)}
                        >
                            <option value="all">All Monsters</option>
                            <option value="can-evolve">Can Evolve</option>
                            <option value="evolved">Evolved Forms</option>
                            <option value="no-evolution">No Evolution</option>
                        </FilterSelect>

                        <FilterSelect label="Sort" value={sortBy} onChange={(value) => setSortBy(value as SortKey)}>
                            <option value="index">Index</option>
                            <option value="dps">DPS</option>
                            <option value="damage">Base Damage</option>
                            <option value="health">Base Health</option>
                        </FilterSelect>
                    </div>

                    {sortBy !== "index" ? (
                        <div className="mt-3 grid gap-3 border-t border-[#293443] pt-3 xl:grid-cols-[minmax(260px,0.75fr)_minmax(360px,1.25fr)]">
                            <div>
                                <div className="mb-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#69768a]">
                                        Passive Comparison
                                    </p>
                                    <p className="mt-0.5 text-[9px] text-[#59677c]">
                                        Choose which self passives count toward {sortBy.toUpperCase()} ranking.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setPassiveCompareMode("none")}
                                        aria-pressed={passiveCompareMode === "none"}
                                        className={`h-9 rounded-md border px-2 text-[9px] font-bold uppercase tracking-[0.04em] transition ${
                                            passiveCompareMode === "none"
                                                ? "border-[#7182ff] bg-[#202846] text-[#c7ccff]"
                                                : "border-[#344050] bg-[#141c28] text-[#9aa5b8] hover:border-[#5c6a80] hover:text-white"
                                        }`}
                                        title="Ignore all monster passives"
                                    >
                                        No Passives
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPassiveCompareMode("always")}
                                        aria-pressed={passiveCompareMode === "always"}
                                        className={`h-9 rounded-md border px-2 text-[9px] font-bold uppercase tracking-[0.04em] transition ${
                                            passiveCompareMode === "always"
                                                ? "border-[#7182ff] bg-[#202846] text-[#c7ccff]"
                                                : "border-[#344050] bg-[#141c28] text-[#9aa5b8] hover:border-[#5c6a80] hover:text-white"
                                        }`}
                                        title="Include non-conditional / always-active self passives"
                                    >
                                        Non-Conditional
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPassiveCompareMode("conditional")}
                                        aria-pressed={passiveCompareMode === "conditional"}
                                        className={`h-9 rounded-md border px-2 text-[9px] font-bold uppercase tracking-[0.04em] transition ${
                                            passiveCompareMode === "conditional"
                                                ? "border-[#7182ff] bg-[#202846] text-[#c7ccff]"
                                                : "border-[#344050] bg-[#141c28] text-[#9aa5b8] hover:border-[#5c6a80] hover:text-white"
                                        }`}
                                        title="Include always-active self passives plus supported conditional self passives such as Vital Surge"
                                    >
                                        Conditional
                                    </button>
                                </div>

                                <p className="mt-1.5 text-[9px] leading-4 text-[#59677c]">
                                    Conditional currently adds supported self conditions such as Vital Surge. Boss, Rift, Spire, and Dungeon context passives remain excluded.
                                </p>
                            </div>

                            <DatabaseEvolutionMultiplierEditor
                                value={evolutionPercent}
                                onChange={setEvolutionPercent}
                                sortBy={sortBy}
                            />
                        </div>
                    ) : null}

                    <div className="sticky bottom-0 -mx-4 mt-5 flex gap-2 border-t border-[#293443] bg-[#111925] px-4 py-3 md:hidden">
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setRarity("All");
                                setElement("All");
                                setSourceType("All");
                                setLocation("All");
                                setObtainability("all");
                                setPassiveFilter("all");
                                setSkillEffectFilter("all");
                                setEvolutionFilter("all");
                                setSortBy("index");
                                setEvolutionPercent(MIN_EVOLUTION_PERCENT);
                                setPassiveCompareMode("always");
                            }}
                            className="h-11 flex-1 rounded-lg border border-[#46546a] bg-[#141c28] text-xs font-bold text-[#aeb9cb]"
                        >
                            Clear All
                        </button>
                        <button
                            type="button"
                            onClick={() => setFiltersOpen(false)}
                            className="h-11 flex-[1.35] rounded-lg bg-[#7182ff] text-xs font-black text-white shadow-[0_8px_24px_rgba(113,130,255,0.25)]"
                        >
                            Show {filteredMonsters.length} Monsters
                        </button>
                    </div>
                </section>

                <div className={`mt-5 ${selectedMonster ? "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(460px,500px)] xl:items-start xl:gap-5" : ""}`}>
                    <section className="min-w-0">
                        {filteredMonsters.length ? (
                            <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 ${selectedMonster ? "2xl:grid-cols-4" : "xl:grid-cols-4 2xl:grid-cols-5"}`}>
                                {filteredMonsters.map((monster) => (
                                    <MonsterCard
                                        key={monster.id}
                                        monster={monster}
                                        selected={selectedMonster?.id === monster.id}
                                        onSelect={() => {
                                            setFiltersOpen(false);
                                            setSelectedId(monster.id);
                                        }}
                                        evolutionPercent={evolutionPercent}
                                        passiveCompareMode={passiveCompareMode}
                                        sortBy={sortBy}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-[#344050] bg-[#111925] p-8 text-center">
                                <div>
                                    <p className="font-bold text-[#c8d1df]">No monsters match those filters.</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setRarity("All");
                                            setElement("All");
                                            setSourceType("All");
                                            setLocation("All");
                                            setObtainability("all");
                                            setPassiveFilter("all");
                                            setSkillEffectFilter("all");
                                            setEvolutionFilter("all");
                                            setEvolutionPercent(MIN_EVOLUTION_PERCENT);
                                        }}
                                        className="mt-3 text-xs font-bold text-[#7182ff] hover:text-[#9aa7ff]"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {selectedMonster ? (
                        <aside
                            ref={inspectorShellRef}
                            className="sticky top-4 hidden min-w-0 rounded-2xl shadow-[-14px_0_36px_rgba(0,0,0,0.3)] xl:block"
                        >
                            <div
                                ref={inspectorRef}
                                className="overflow-y-auto overscroll-contain rounded-2xl"
                                style={{ maxHeight: inspectorMaxHeight ? `${inspectorMaxHeight}px` : "calc(100vh - 2rem)" }}
                            >
                                <div className="pointer-events-none sticky top-3 z-20 flex h-0 justify-end pr-3">
                                    <button
                                        type="button"
                                        aria-label="Close monster inspector"
                                        onClick={() => setSelectedId("")}
                                        className="pointer-events-auto grid size-9 place-items-center rounded-full border border-[#59677a] bg-[#0b111a]/95 text-xl font-bold leading-none text-white shadow-lg transition hover:border-[#7182ff] hover:bg-[#182235] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7182ff]"
                                    >
                                        ×
                                    </button>
                                </div>
                                <DetailPanel
                                    key={selectedMonster.id}
                                    monster={selectedMonster}
                                    evolutionPercent={evolutionPercent}
                                    passiveCompareMode={passiveCompareMode}
                                    onMonsterSelect={setSelectedId}
                                    sortBy={sortBy}
                                    desktopInspector
                                />
                            </div>
                        </aside>
                    ) : null}
                </div>
            </div>

            {selectedMonster ? (
                <div className="fixed inset-0 z-[99] xl:hidden" role="presentation">
                    <button
                        type="button"
                        aria-label="Close monster details"
                        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px]"
                        onClick={() => setSelectedId("")}
                    />
                    <div
                        ref={drawerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${selectedMonster.name} details`}
                        className="fixed bottom-4 right-4 top-4 z-[100] w-[min(430px,calc(100vw-32px))] overflow-y-auto overscroll-contain rounded-2xl shadow-[-18px_0_50px_rgba(0,0,0,0.45)]"
                    >
                        <div className="pointer-events-none sticky top-3 z-20 flex h-0 justify-end pr-3">
                            <button
                                type="button"
                                aria-label="Close monster details"
                                onClick={() => setSelectedId("")}
                                className="pointer-events-auto grid size-10 place-items-center rounded-full border border-[#59677a] bg-[#0b111a]/95 text-2xl font-bold leading-none text-white shadow-lg transition hover:border-[#7182ff] hover:bg-[#182235] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7182ff]"
                            >
                                ×
                            </button>
                        </div>
                        <DetailPanel
                            key={selectedMonster.id}
                            monster={selectedMonster}
                            evolutionPercent={evolutionPercent}
                            passiveCompareMode={passiveCompareMode}
                            onMonsterSelect={setSelectedId}
                            sortBy={sortBy}
                        />
                    </div>
                </div>
            ) : null}
        </main>
    );
}
