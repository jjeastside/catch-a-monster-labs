
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { getPassiveDisplayName, getPassiveImagePath } from "../data/passives";
import { getSkill, getSkillDisplayName } from "../data/skills";
import { assetPath } from "../lib/asset-path";
import { getMonsterComparisonStats, type PassiveCompareMode } from "../lib/monster-comparison";
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
type SkillEffect =
    | "burn"
    | "poison"
    | "healing"
    | "stun"
    | "vulnerability"
    | "knockback"
    | "damage-buff"
    | "damage-reduction"
    | "shield"
    | "taunt"
    | "stagger";
type SkillEffectFilter = "all" | SkillEffect;
type EvolutionFilter = "all" | "can-evolve" | "evolved" | "no-evolution";


const skillEffectLabels: Record<SkillEffect, string> = {
    burn: "Burn",
    poison: "Poison",
    healing: "Healing",
    stun: "Stun",
    vulnerability: "Vulnerability",
    knockback: "Knockback",
    "damage-buff": "Damage Buff",
    "damage-reduction": "Damage Reduction",
    shield: "Shield",
    taunt: "Taunt",
    stagger: "Stagger",
};

const skillEffectOptions = Object.entries(skillEffectLabels) as Array<[SkillEffect, string]>;


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

function getSkillEffects(notes?: string): SkillEffect[] {
    if (!notes) return [];

    const normalized = notes.toLowerCase();
    const effects: SkillEffect[] = [];

    if (/\bburn(?:ed|s|ing)?\b/.test(normalized)) effects.push("burn");
    if (/\bpoison\b/.test(normalized)) effects.push("poison");
    if (/\bheal(?:s|ed|ing)?\b/.test(normalized)) effects.push("healing");
    if (/\bstun\b/.test(normalized)) effects.push("stun");
    if (/\bvulnerab/.test(normalized)) effects.push("vulnerability");
    if (/\bknockback\b/.test(normalized)) effects.push("knockback");
    if (/\bdamage reduction\b/.test(normalized)) effects.push("damage-reduction");
    if (/\bshield\b/.test(normalized)) effects.push("shield");
    if (/\btaunt\b/.test(normalized)) effects.push("taunt");
    if (/\bstagger\b/.test(normalized)) effects.push("stagger");

    const allyEffects = normalized.split("ally effects:")[1] ?? "";
    if (
        /(?:\d+(?:\.\d+)?%\s+)?team damage\b/.test(allyEffects) ||
        /(?:\d+(?:\.\d+)?%\s+)?self damage\b/.test(allyEffects)
    ) {
        effects.push("damage-buff");
    }

    return [...new Set(effects)];
}

function monsterHasSkillEffect(monster: GeneratedMonster, effect: SkillEffect): boolean {
    return monster.skillIds.some((skillId) => {
        const skill = getSkill(skillId);
        return skill ? getSkillEffects(skill.notes).includes(effect) : false;
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
                     }: {
    monster: GeneratedMonster;
    selected: boolean;
    onSelect: () => void;
    evolutionPercent: number;
    passiveCompareMode: PassiveCompareMode;
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
                selected ? "ring-2 ring-[#7182ff] ring-offset-2 ring-offset-[#0d131d]" : ""
            }`}
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(113,130,255,0.14),transparent_58%)]">
                {monster.image ? (
                    <img
                        src={assetPath(monster.image)}
                        alt={monster.name}
                        className="h-full w-full object-contain p-3 transition duration-200 group-hover:scale-[1.035]"
                    />
                ) : null}
                <span className="absolute right-2 top-2 rounded-full border border-[#344050] bg-[#0d131d]/90 px-2 py-1 text-[10px] font-bold text-[#aeb9cb]">
                    #{monster.indexPosition}
                </span>
                {!isObtainable(monster) ? (
                    <span className="absolute left-2 top-2 rounded-full border border-[#7a4550] bg-[#2d1419]/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#ff8f9c]">
                        Unobtainable
                    </span>
                ) : null}
            </div>

            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[#f4f7fb]">{monster.name}</h3>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#9da9bb]">
                            {monster.rarity} · {monster.element}
                        </p>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="rounded-md border border-[#293443] bg-[#0e151f] px-2 py-1.5">
                        <span className="block text-[8px] font-bold uppercase tracking-[0.06em] text-[#6f7c90]">DMG</span>
                        <span className="mt-0.5 block truncate font-bold text-[#dbe2ee]">{compactNumber(comparisonStats.damage)}</span>
                    </div>
                    <div className="rounded-md border border-[#293443] bg-[#0e151f] px-2 py-1.5">
                        <span className="block text-[8px] font-bold uppercase tracking-[0.06em] text-[#6f7c90]">HP</span>
                        <span className="mt-0.5 block truncate font-bold text-[#dbe2ee]">{compactNumber(comparisonStats.health)}</span>
                    </div>
                    <div className="rounded-md border border-[#293443] bg-[#0e151f] px-2 py-1.5">
                        <span className="block text-[8px] font-bold uppercase tracking-[0.06em] text-[#7182ff]">DPS</span>
                        <span className="mt-0.5 block truncate font-bold text-[#dbe2ee]">{compactNumber(comparisonStats.dps)}</span>
                    </div>
                </div>

                <div className="mt-3 flex min-h-7 items-center gap-1.5">
                    {passive && passiveImage ? (
                        <img
                            src={assetPath(passiveImage)}
                            alt={getPassiveDisplayName(passive)}
                            title={getPassiveDisplayName(passive)}
                            className="size-7 rounded-md border border-[#344050] bg-[#0d131d] object-contain p-0.5"
                        />
                    ) : null}
                    {skills.map((skill, skillIndex) =>
                        skill ? (
                            <img
                                key={`${monster.id}-${skill.id}-${skillIndex}`}
                                src={assetPath(getDatabaseSkillIconPath(skill.id))}
                                alt={getSkillDisplayName(skill.name)}
                                title={getSkillDisplayName(skill.name)}
                                className="size-7 rounded-md border border-[#344050] bg-[#0d131d] object-cover"
                            />
                        ) : null,
                    )}
                </div>

                <p className="mt-3 truncate border-t border-[#293443] pt-2 text-[10px] font-medium text-[#7f8b9e]">
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
                     }: {
    monster: GeneratedMonster;
    evolutionPercent: number;
    passiveCompareMode: PassiveCompareMode;
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
                <div className="relative aspect-[16/9] overflow-hidden border-b border-[#344050] bg-[radial-gradient(circle_at_50%_45%,rgba(113,130,255,0.17),transparent_62%)]">
                    {monster.image ? (
                        <img src={assetPath(monster.image)} alt={monster.name} className="h-full w-full object-contain p-6" />
                    ) : null}
                </div>

                <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white">{monster.name}</h2>
                            <p className="mt-1 text-xs font-semibold text-[#9ba7b9]">
                                {monster.rarity} · {monster.element} · Index {monster.indexPosition}
                            </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                            isObtainable(monster)
                                ? "border-[#2f7656] bg-[#10251c] text-[#6bdca2]"
                                : "border-[#7a4550] bg-[#2d1419] text-[#ff8f9c]"
                        }`}>
                        {isObtainable(monster) ? "Obtainable" : "Unavailable"}
                    </span>
                    </div>

                    <section className="mt-5 border-t border-[#293443] pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">Reference Stats</h3>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                            {[
                                ["Damage", compactNumber(comparisonStats.damage)],
                                ["Health", compactNumber(comparisonStats.health)],
                                ["DPS", compactNumber(comparisonStats.dps)],
                                ["Index", monster.indexPosition],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-lg border border-[#293443] bg-[#0d141e] p-2.5">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#667489]">{label}</p>
                                    <p className="mt-1 text-sm font-black text-[#e8edf5]">{value}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-[10px] leading-4 text-[#657287]">
                            Comparison preset: Base E-rank / Level 1 · selected EM for evolved forms ·{" "}
                            {passiveCompareMode === "none"
                                ? "no passives"
                                : passiveCompareMode === "conditional"
                                    ? "always-active + conditional self passives"
                                    : "non-conditional self passives"}
                            {" "}· expected crit · no gear, traits, mutations, account bonuses, or combat-context bonuses.
                        </p>
                    </section>

                    <section className="mt-5 border-t border-[#293443] pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">Skills</h3>
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
                                                <p className="truncate text-xs font-bold text-[#edf1f7]">{getSkillDisplayName(skill.name)}</p>
                                                {skill.cooldown !== null ? (
                                                    <span className="text-[10px] font-semibold text-[#758399]">{skill.cooldown}s</span>
                                                ) : null}
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#7f8b9e]">
                                                {skill.notes || `${skill.element} skill`}
                                            </p>
                                            {getSkillEffects(skill.notes).length > 0 ? (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {getSkillEffects(skill.notes).map((effect) => (
                                                        <span
                                                            key={effect}
                                                            className="rounded border border-[#344050] bg-[#121b27] px-1.5 py-0.5 text-[9px] font-bold text-[#9eabbe]"
                                                        >
                                                        {skillEffectLabels[effect]}
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

                    <section className="mt-5 border-t border-[#293443] pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">Passive</h3>
                        {passive ? (
                            <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#293443] bg-[#0d141e] p-3">
                                {passiveImage ? (
                                    <img
                                        src={assetPath(passiveImage)}
                                        alt=""
                                        className="size-10 shrink-0 object-contain"
                                    />
                                ) : null}
                                <div>
                                    <p className="text-xs font-bold text-[#edf1f7]">{getPassiveDisplayName(passive)}</p>
                                    <p className="mt-1 text-[10px] leading-4 text-[#7f8b9e]">Detailed passive description can be added in Phase 4.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-xs text-[#6f7c90]">No passive.</p>
                        )}
                    </section>

                    <section className="mt-5 border-t border-[#293443] pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">Obtained From</h3>
                        <p className="mt-3 whitespace-pre-line rounded-lg border border-[#293443] bg-[#0d141e] p-3 text-[10px] leading-5 text-[#8996aa]">
                            {sourceDescription(monster)}
                        </p>
                    </section>

                    <section className="mt-5 border-t border-[#293443] pt-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">Evolution</h3>
                            {getEvolutionFamily(monster).length > 1 ? (
                                <span className="text-[9px] font-semibold text-[#667489]">
                                {getEvolutionFamily(monster).length} forms
                            </span>
                            ) : null}
                        </div>

                        {getEvolutionFamily(monster).length > 1 ? (
                            <div className="mt-3 overflow-x-auto rounded-lg border border-[#293443] bg-[#0d141e] p-3">
                                <div className="flex min-w-max items-center gap-2">
                                    {getEvolutionFamily(monster).map((member, index, family) => {
                                        const previousDepth = index > 0 ? family[index - 1].depth : 0;
                                        const showArrow = index > 0;
                                        const isSelected = member.monster.id === monster.id;

                                        return (
                                            <div key={member.monster.id} className="flex items-center gap-2">
                                                {showArrow ? (
                                                    <span
                                                        className="text-sm font-black text-[#59677c]"
                                                        title={member.depth > previousDepth ? "Evolves into" : "Evolution branch"}
                                                    >
                                                    →
                                                </span>
                                                ) : null}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const target = document.getElementById(`monster-${member.monster.id}`);
                                                        target?.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    }}
                                                    className={`w-24 rounded-lg border p-2 text-center transition ${
                                                        isSelected
                                                            ? "border-[#7182ff] bg-[#18213a] ring-1 ring-[#7182ff]/50"
                                                            : "border-[#344050] bg-[#111925] hover:border-[#7182ff]/60"
                                                    }`}
                                                >
                                                    <div className="mx-auto grid size-14 place-items-center overflow-hidden rounded-md bg-[#0b111a]">
                                                        {member.monster.image ? (
                                                            <img
                                                                src={assetPath(member.monster.image)}
                                                                alt={member.monster.name}
                                                                className="h-full w-full object-contain p-1"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-1.5 truncate text-[10px] font-bold text-[#dbe2ee]">
                                                        {member.monster.name}
                                                    </p>
                                                    <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#657287]">
                                                        {member.depth === 0 ? "Base" : `Stage ${member.depth}`}
                                                    </p>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-3 rounded-lg border border-dashed border-[#344050] bg-[#0d141e] p-4 text-center text-[10px] text-[#6f7c90]">
                                No known evolution family.
                            </div>
                        )}
                    </section>

                    <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        <Link
                            href={`/#${monsterHash(monster)}`}
                            className="rounded-lg bg-[#586af0] px-3 py-2.5 text-center text-xs font-black text-white transition hover:bg-[#7182ff]"
                        >
                            Open in Calculator
                        </Link>
                        <Link
                            href={`/monster-database/${monster.id}`}
                            className="rounded-lg border border-[#586af0]/70 bg-[#18213a] px-3 py-2.5 text-center text-xs font-black text-[#cbd1ff] transition hover:border-[#7182ff] hover:text-white"
                        >
                            View Profile
                        </Link>
                        <button
                            type="button"
                            onClick={() => void copyMonsterLink()}
                            className="rounded-lg border border-[#344050] bg-[#141d29] px-3 py-2.5 text-xs font-bold text-[#c4cedd] transition hover:border-[#7182ff]/70 hover:text-white"
                        >
                            Copy Link
                        </button>
                    </div>
                </div>
            </aside>
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
    const evolutionBarFill = getEvolutionBarFill(evolutionPercent);
    const [sortBy, setSortBy] = useState<SortKey>("index");
    const [selectedId, setSelectedId] = useState("");
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!selectedId) return;

        drawerRef.current?.scrollTo({ top: 0 });

        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setSelectedId("");
        };
        window.addEventListener("keydown", closeOnEscape);

        return () => {
            window.removeEventListener("keydown", closeOnEscape);
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;
        };
    }, [selectedId]);

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
            getPassiveDisplayName(a).localeCompare(getPassiveDisplayName(b)),
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

    return (
        <main className="min-h-screen bg-[#0d131d] text-white">
            <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 border-b border-[#293443] pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7182ff]">CAM Lab</p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#f5f7fb]">Monster Database</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9aae]">
                            Browse every monster, discover what it does, see where it comes from, and open it directly in the build calculator.
                        </p>
                    </div>
                    <div className="rounded-full border border-[#344050] bg-[#111925] px-3 py-1.5 text-xs font-bold text-[#aeb9cb]">
                        {filteredMonsters.length} / {GENERATED_MONSTERS.length} monsters
                    </div>
                </div>

                <section className="mt-5 rounded-xl border border-[#344050] bg-[#111925] p-3">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[minmax(260px,1.6fr)_repeat(9,minmax(118px,0.7fr))]">
                        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#69768a]">
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
                                    {getPassiveDisplayName(passive)}
                                </option>
                            ))}
                        </FilterSelect>

                        <FilterSelect
                            label="Skill Effect"
                            value={skillEffectFilter}
                            onChange={(value) => setSkillEffectFilter(value as SkillEffectFilter)}
                        >
                            <option value="all">All Effects</option>
                            {skillEffectOptions.map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
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

                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#69768a]">
                                            Evolution Multiplier
                                        </p>
                                        <p className="mt-0.5 text-[9px] text-[#59677c]">
                                            Applies only to evolved monsters when comparing {sortBy.toUpperCase()}.
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[9px] font-semibold text-[#718099]">
                                        {MIN_EVOLUTION_PERCENT}%–{MAX_EVOLUTION_PERCENT}%
                                    </span>
                                </div>

                                <div className="flex items-end gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="relative rounded-md border border-[#f4d4b3]/70 bg-[#343434] p-[2px] shadow-inner">
                                            <div className="relative h-7 overflow-hidden rounded-[4px] bg-[#3a3a3a]">
                                                <div
                                                    className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffd2a3] via-[#ffb160] to-[#ff8a24]"
                                                    style={{ width: `${evolutionBarFill}%` }}
                                                />
                                                <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-[9px] font-bold tabular-nums text-white [text-shadow:0_1px_0_#111,1px_0_0_#111,-1px_0_0_#111,0_-1px_0_#111]">
                                                    EM: {evolutionPercent.toFixed(2)}%
                                                </span>
                                                <input
                                                    type="range"
                                                    min={MIN_EVOLUTION_PERCENT}
                                                    max={MAX_EVOLUTION_PERCENT}
                                                    step={EVOLUTION_STEP}
                                                    value={evolutionPercent}
                                                    onChange={(event) =>
                                                        setEvolutionPercent(clampEvolutionPercent(Number(event.target.value)))
                                                    }
                                                    aria-label="Evolution Multiplier"
                                                    className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
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
                                                value={evolutionPercent}
                                                onChange={(event) =>
                                                    setEvolutionPercent(clampEvolutionPercent(Number(event.target.value)))
                                                }
                                                className="h-9 w-full rounded-md border border-[#344050] bg-[#0d141e] px-2 pr-6 text-right text-xs font-bold tabular-nums text-[#e7edf7] outline-none transition focus:border-[#f1a45c]"
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[9px] text-[#69768a]">%</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </section>

                <div className="mt-5">
                    <section>
                        {filteredMonsters.length ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                                {filteredMonsters.map((monster) => (
                                    <MonsterCard
                                        key={monster.id}
                                        monster={monster}
                                        selected={selectedMonster?.id === monster.id}
                                        onSelect={() => setSelectedId(monster.id)}
                                        evolutionPercent={evolutionPercent}
                                        passiveCompareMode={passiveCompareMode}
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

                </div>
            </div>

            {selectedMonster ? (
                <div className="fixed inset-0 z-[99]" role="presentation">
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
                        />
                    </div>
                </div>
            ) : null}
        </main>
    );
}