"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { getPassiveDisplayName, getPassiveImagePath } from "../data/passives";
import { getSkill, getSkillDisplayName, getSkillTotalHits, getSkillTotalMultiplier } from "../data/skills";
import { assetPath } from "../lib/asset-path";
import {
    EVOLUTION_STEP,
    MAX_EVOLUTION_PERCENT,
    MIN_EVOLUTION_PERCENT,
    clampEvolutionPercent,
    getEvolutionBarFill,
} from "../lib/calculations/evolution";
import {
    getMonsterComparisonStats,
    type PassiveCompareMode,
} from "../lib/monster-comparison";
import type { GeneratedMonster } from "../types/monster";
import type { MonsterPassive, PassiveEffect } from "../types/build";

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

function compactNumber(value: number): string {
    return new Intl.NumberFormat("en-US", {
        notation: value >= 100_000 ? "compact" : "standard",
        maximumFractionDigits: value >= 100_000 ? 2 : 1,
    }).format(value);
}

function isObtainable(monster: GeneratedMonster): boolean {
    return monster.sources.some((source) => source.status === "Current");
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

type EvolutionFamilyMember = {
    monster: GeneratedMonster;
    depth: number;
};

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
        const parent = GENERATED_MONSTERS.find(
            (candidate) => candidate.id === current.evolutionSource,
        );

        if (!parent) break;
        current = parent;
    }

    return current;
}

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

function formatPassiveEffect(effect: PassiveEffect): string {
    if (typeof effect.value === "boolean") {
        const label = effect.stat
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (letter) => letter.toUpperCase());

        return effect.value ? label : `No ${label}`;
    }

    const labels: Partial<Record<PassiveEffect["stat"], string>> = {
        damage: "Damage",
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
        coinGain: "Coin Gain",
        xpGain: "XP Gain",
        rankLuck: "Rank Luck",
        healthRestore: "Health Restore",
        mutationRate: "Mutation Rate",
    };

    const label = labels[effect.stat] ?? effect.stat;
    const sign = effect.value > 0 && !label.startsWith("Incoming") ? "+" : "";

    return `${label} ${sign}${effect.value}%`;
}

function PassiveCard({ passive }: { passive: MonsterPassive }) {
    const image = getPassiveImagePath(passive);

    return (
        <div className="rounded-xl border border-[#344050] bg-[#101722] p-4">
            <div className="flex items-center gap-3">
                {image ? (
                    <img
                        src={assetPath(image)}
                        alt=""
                        className="size-12 shrink-0 object-contain"
                    />
                ) : (
                    <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-[#344050] bg-[#0d141e] text-lg">
                        ◆
                    </div>
                )}

                <div className="min-w-0">
                    <h3 className="text-sm font-black text-[#edf1f7]">
                        {getPassiveDisplayName(passive)}
                    </h3>
                    {passive.condition != null ? (
                        <p className="mt-0.5 text-[10px] font-semibold text-[#f0b36d]">
                            Conditional: {String(passive.condition)}
                        </p>
                    ) : (
                        <p className="mt-0.5 text-[10px] font-semibold text-[#6bdca2]">
                            Always active
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {passive.effects.map((effect, index) => (
                    <span
                        key={`${passive.id}-${effect.stat}-${index}`}
                        className="rounded-md border border-[#344050] bg-[#0d141e] px-2 py-1 text-[10px] font-semibold text-[#aeb9cb]"
                    >
                        {formatPassiveEffect(effect)}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function MonsterProfile({ monsterId }: { monsterId: string }) {
    const monster = useMemo(
        () => GENERATED_MONSTERS.find((candidate) => candidate.id === monsterId),
        [monsterId],
    );

    const [evolutionPercent, setEvolutionPercent] = useState(MIN_EVOLUTION_PERCENT);
    const [passiveCompareMode, setPassiveCompareMode] =
        useState<PassiveCompareMode>("always");

    if (!monster) {
        return (
            <main className="min-h-[70vh] bg-[#0d131d] px-4 py-12 text-white">
                <div className="mx-auto max-w-3xl rounded-2xl border border-[#344050] bg-[#111925] p-8 text-center">
                    <h1 className="text-2xl font-black">Monster not found</h1>
                    <Link
                        href="/monster-database"
                        className="mt-5 inline-flex rounded-lg bg-[#586af0] px-4 py-2.5 text-xs font-black text-white"
                    >
                        Back to Monster Database
                    </Link>
                </div>
            </main>
        );
    }

    const comparisonStats = getMonsterComparisonStats(
        monster,
        evolutionPercent,
        passiveCompareMode,
    );
    const evolutionBarFill = getEvolutionBarFill(evolutionPercent);
    const evolutionFamily = getEvolutionFamily(monster);
    const skills = monster.skillIds.map((id) => getSkill(id)).filter(Boolean);

    async function copyProfileLink() {
        await navigator.clipboard.writeText(window.location.href);
    }

    return (
        <main className="min-h-screen bg-[#0d131d] text-white">
            <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/monster-database"
                        className="text-xs font-bold text-[#8e9bad] transition hover:text-white"
                    >
                        ← Monster Database
                    </Link>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => void copyProfileLink()}
                            className="rounded-lg border border-[#344050] bg-[#141d29] px-3 py-2 text-xs font-bold text-[#c4cedd] transition hover:border-[#7182ff]/70 hover:text-white"
                        >
                            Copy Profile Link
                        </button>
                        <Link
                            href={`/#${monsterHash(monster)}`}
                            className="rounded-lg bg-[#586af0] px-4 py-2 text-xs font-black text-white transition hover:bg-[#7182ff]"
                        >
                            Open in Calculator
                        </Link>
                    </div>
                </div>

                <section className="overflow-hidden rounded-2xl border border-[#344050] bg-[#111925]">
                    <div className="grid lg:grid-cols-[420px_minmax(0,1fr)]">
                        <div className="relative min-h-[340px] border-b border-[#344050] bg-[radial-gradient(circle_at_50%_40%,rgba(113,130,255,0.18),transparent_62%)] lg:border-b-0 lg:border-r">
                            {monster.image ? (
                                <img
                                    src={assetPath(monster.image)}
                                    alt={monster.name}
                                    className="absolute inset-0 h-full w-full object-contain p-8"
                                />
                            ) : null}
                        </div>

                        <div className="p-5 sm:p-7">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7182ff]">
                                        Monster Profile
                                    </p>
                                    <h1 className="mt-1 text-4xl font-black tracking-tight text-[#f5f7fb]">
                                        {monster.name}
                                    </h1>
                                    <p className="mt-2 text-sm font-semibold text-[#9ba7b9]">
                                        {monster.rarity} · {monster.element} · Index {monster.indexPosition}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                                        isObtainable(monster)
                                            ? "border-[#2f7656] bg-[#10251c] text-[#6bdca2]"
                                            : "border-[#7a4550] bg-[#2d1419] text-[#ff8f9c]"
                                    }`}
                                >
                                    {isObtainable(monster) ? "Obtainable" : "Unavailable"}
                                </span>
                            </div>

                            {monster.description ? (
                                <p className="mt-4 max-w-3xl text-sm leading-6 text-[#929fb2]">
                                    {monster.description}
                                </p>
                            ) : null}

                            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[
                                    ["Damage", compactNumber(comparisonStats.damage)],
                                    ["Health", compactNumber(comparisonStats.health)],
                                    ["DPS", compactNumber(comparisonStats.dps)],
                                    ["Crit", `${monster.baseCritChance}%`],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-xl border border-[#293443] bg-[#0d141e] p-3"
                                    >
                                        <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#667489]">
                                            {label}
                                        </p>
                                        <p className="mt-1 text-lg font-black text-[#edf1f7]">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 grid gap-4 border-t border-[#293443] pt-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(360px,1.2fr)]">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#69768a]">
                                        Passive Comparison
                                    </p>
                                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                                        {([
                                            ["none", "None"],
                                            ["always", "Non-Conditional"],
                                            ["conditional", "Conditional"],
                                        ] as const).map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setPassiveCompareMode(value)}
                                                className={`min-h-9 rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.03em] transition ${
                                                    passiveCompareMode === value
                                                        ? "border-[#7182ff] bg-[#202846] text-[#c7ccff]"
                                                        : "border-[#344050] bg-[#141c28] text-[#9aa5b8] hover:border-[#5c6a80] hover:text-white"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {monster.isEvolved ? (
                                    <div>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#69768a]">
                                                Evolution Multiplier
                                            </p>
                                            <span className="text-[9px] font-semibold text-[#718099]">
                                                {evolutionPercent.toFixed(2)}%
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-end gap-2">
                                            <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-md border border-[#f4d4b3]/70 bg-[#343434]">
                                                <div
                                                    className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffd2a3] via-[#ffb160] to-[#ff8a24]"
                                                    style={{ width: `${evolutionBarFill}%` }}
                                                />
                                                <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-[9px] font-bold text-white [text-shadow:0_1px_0_#111,1px_0_0_#111,-1px_0_0_#111,0_-1px_0_#111]">
                                                    EM: {evolutionPercent.toFixed(2)}%
                                                </span>
                                                <input
                                                    type="range"
                                                    min={MIN_EVOLUTION_PERCENT}
                                                    max={MAX_EVOLUTION_PERCENT}
                                                    step={EVOLUTION_STEP}
                                                    value={evolutionPercent}
                                                    onChange={(event) =>
                                                        setEvolutionPercent(
                                                            clampEvolutionPercent(Number(event.target.value)),
                                                        )
                                                    }
                                                    className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
                                                    aria-label="Evolution Multiplier"
                                                />
                                            </div>

                                            <input
                                                type="number"
                                                min={MIN_EVOLUTION_PERCENT}
                                                max={MAX_EVOLUTION_PERCENT}
                                                step={EVOLUTION_STEP}
                                                value={evolutionPercent}
                                                onChange={(event) =>
                                                    setEvolutionPercent(
                                                        clampEvolutionPercent(Number(event.target.value)),
                                                    )
                                                }
                                                className="h-9 w-24 rounded-md border border-[#344050] bg-[#0d141e] px-2 text-right text-xs font-bold tabular-nums text-[#e7edf7] outline-none focus:border-[#f1a45c]"
                                                aria-label="Evolution Multiplier percent"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-end">
                                        <p className="text-[10px] leading-4 text-[#59677c]">
                                            EM does not apply to standard monsters.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
                    <div className="grid gap-5">
                        <section className="rounded-2xl border border-[#344050] bg-[#111925] p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">
                                        Abilities
                                    </p>
                                    <h2 className="mt-1 text-xl font-black">Skills</h2>
                                </div>
                                <span className="text-[10px] font-semibold text-[#667489]">
                                    {skills.length} skills
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                {skills.map((skill, skillIndex) =>
                                    skill ? (
                                        <article
                                            key={`${monster.id}-${skill.id}-${skillIndex}`}
                                            className="rounded-xl border border-[#293443] bg-[#0d141e] p-4"
                                        >
                                            <div className="flex gap-3">
                                                <img
                                                    src={assetPath(getDatabaseSkillIconPath(skill.id))}
                                                    alt=""
                                                    className="size-14 shrink-0 rounded-lg border border-[#344050] object-cover"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-sm font-black text-[#edf1f7]">
                                                            {getSkillDisplayName(skill.name)}
                                                        </h3>
                                                        <span className="rounded border border-[#344050] bg-[#121b27] px-1.5 py-0.5 text-[9px] font-bold text-[#9eabbe]">
                                                            {skill.element}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#758399]">
                                                        {skill.cooldown !== null ? (
                                                            <span>
                                                                Cooldown{" "}
                                                                <strong className="text-[#cbd4e1]">
                                                                    {skill.cooldown}s
                                                                </strong>
                                                            </span>
                                                        ) : null}
                                                        {skill.damageInstances.length > 0 ? (
                                                            <>
                                                                <span>
                                                                    Damage{" "}
                                                                    <strong className="text-[#cbd4e1]">
                                                                        {(getSkillTotalMultiplier(skill) * 100).toFixed(0)}%
                                                                    </strong>
                                                                </span>
                                                                <span>
                                                                    Hits{" "}
                                                                    <strong className="text-[#cbd4e1]">
                                                                        {getSkillTotalHits(skill)}
                                                                    </strong>
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="font-semibold text-[#6f7c90]">
                                                                Utility skill
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="mt-3 text-[11px] leading-5 text-[#8c99ac]">
                                                {skill.notes || "No additional skill notes."}
                                            </p>

                                            {getSkillEffects(skill.notes).length > 0 ? (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {getSkillEffects(skill.notes).map((effect) => (
                                                        <span
                                                            key={effect}
                                                            className="rounded-md border border-[#344050] bg-[#121b27] px-2 py-1 text-[9px] font-bold text-[#aeb9cb]"
                                                        >
                                                            {skillEffectLabels[effect]}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </article>
                                    ) : null,
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#344050] bg-[#111925] p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">
                                Evolution
                            </p>
                            <div className="mt-1 flex items-end justify-between gap-3">
                                <h2 className="text-xl font-black">Evolution Family</h2>
                                {evolutionFamily.length > 1 ? (
                                    <span className="text-[10px] font-semibold text-[#667489]">
                                        {evolutionFamily.length} forms
                                    </span>
                                ) : null}
                            </div>

                            {evolutionFamily.length > 1 ? (
                                <div className="mt-4 overflow-x-auto">
                                    <div className="flex min-w-max items-center gap-2">
                                        {evolutionFamily.map((member, index) => (
                                            <div
                                                key={member.monster.id}
                                                className="flex items-center gap-2"
                                            >
                                                {index > 0 ? (
                                                    <span className="text-lg font-black text-[#59677c]">→</span>
                                                ) : null}

                                                <Link
                                                    href={`/monster-database/${member.monster.id}`}
                                                    className={`w-28 rounded-xl border p-2.5 text-center transition ${
                                                        member.monster.id === monster.id
                                                            ? "border-[#7182ff] bg-[#18213a] ring-1 ring-[#7182ff]/40"
                                                            : "border-[#344050] bg-[#0d141e] hover:border-[#7182ff]/60"
                                                    }`}
                                                >
                                                    <div className="mx-auto grid size-16 place-items-center overflow-hidden rounded-lg bg-[#0b111a]">
                                                        {member.monster.image ? (
                                                            <img
                                                                src={assetPath(member.monster.image)}
                                                                alt={member.monster.name}
                                                                className="h-full w-full object-contain p-1"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-2 truncate text-[10px] font-black text-[#dbe2ee]">
                                                        {member.monster.name}
                                                    </p>
                                                    <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#657287]">
                                                        {member.depth === 0 ? "Base" : `Stage ${member.depth}`}
                                                    </p>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl border border-dashed border-[#344050] bg-[#0d141e] p-5 text-center text-xs text-[#6f7c90]">
                                    No known evolution family.
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="grid content-start gap-5">
                        <section className="rounded-2xl border border-[#344050] bg-[#111925] p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">
                                Passive
                            </p>
                            <h2 className="mt-1 text-xl font-black">Passive Effects</h2>

                            <div className="mt-4 grid gap-3">
                                {(monster.passives ?? []).length > 0 ? (
                                    (monster.passives ?? []).map((passive) => (
                                        <PassiveCard key={passive.id} passive={passive} />
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed border-[#344050] bg-[#0d141e] p-4 text-center text-xs text-[#6f7c90]">
                                        This monster has no passive.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#344050] bg-[#111925] p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">
                                Obtainment
                            </p>
                            <h2 className="mt-1 text-xl font-black">Sources</h2>

                            <div className="mt-4 grid gap-2">
                                {monster.sources.length > 0 ? (
                                    monster.sources.map((source, index) => (
                                        <div
                                            key={`${monster.id}-${source.type}-${source.name}-${index}`}
                                            className="rounded-xl border border-[#293443] bg-[#0d141e] p-3"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-black text-[#e4eaf3]">
                                                        {source.name}
                                                    </p>
                                                    <p className="mt-1 text-[10px] font-semibold text-[#7f8b9e]">
                                                        {source.type}
                                                        {source.location ? ` · ${source.location}` : ""}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] ${
                                                        source.status === "Current"
                                                            ? "border-[#2f7656] bg-[#10251c] text-[#6bdca2]"
                                                            : "border-[#63434a] bg-[#24171b] text-[#c7838e]"
                                                    }`}
                                                >
                                                    {source.status}
                                                </span>
                                            </div>

                                            {source.condition ? (
                                                <p className="mt-2 text-[10px] leading-4 text-[#9ba6b8]">
                                                    {source.condition}
                                                </p>
                                            ) : null}
                                            {source.notes ? (
                                                <p className="mt-2 text-[10px] leading-4 text-[#7d899b]">
                                                    {source.notes}
                                                </p>
                                            ) : null}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-[#6f7c90]">
                                        No obtainment data available.
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#344050] bg-[#111925] p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7182ff]">
                                Reference Preset
                            </p>
                            <p className="mt-3 text-[10px] leading-5 text-[#7f8b9e]">
                                E Rank · Level 1 · {monster.isEvolved ? `${evolutionPercent.toFixed(2)}% EM · ` : ""}
                                {passiveCompareMode === "none"
                                    ? "No passives"
                                    : passiveCompareMode === "conditional"
                                      ? "Conditional self passives"
                                      : "Non-conditional self passives"}
                                {" · "}Expected Crit · No gear · No traits · No mutations · No account bonuses.
                            </p>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}
