import { useState } from "react";

import { getMonsterStatData } from "../data/monster-stats";
import {
    getSkill,
    getSkillTotalHits,
    getSkillTotalMultiplier,
} from "../data/skills";

import {
    calculateStats,
    type CalculatedStats,
} from "../lib/calculations/stats";


import type { Build } from "../types/build";
import type { Monster } from "../types/monster";

import { MonsterOverviewCard } from "./monster-overview-card";
import { Panel } from "./panel";

function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
    }).format(value);
}

type BuildStatProps = {
    icon: string;
    label: string;
    value: string;
    accentClassName: string;
};

function BuildStat({
                       icon,
                       label,
                       value,
                       accentClassName,
                   }: BuildStatProps) {
    return (
        <div className="rounded-lg border border-[#303848] bg-[#11141c] p-4">
            <div className="flex items-center gap-2">
                <span
                    aria-hidden="true"
                    className={`text-lg ${accentClassName}`}
                >
                    {icon}
                </span>

                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                    {label}
                </p>
            </div>

            <p className="mt-3 text-2xl font-semibold text-[#e8ebf0]">
                {value}
            </p>
        </div>
    );
}

type SkillDamagePanelProps = {
    skill: NonNullable<ReturnType<typeof getSkill>>;
    stats: CalculatedStats;
};

function SkillDamagePanel({
                              skill,
                              stats,
                          }: SkillDamagePanelProps) {
    const totalHits = getSkillTotalHits(skill);
    const totalMultiplier =
        getSkillTotalMultiplier(skill);

    const isDamagingSkill =
        skill.damageInstances.length > 0;

    return (
        <section className="rounded-lg border border-[#303848] bg-[#171b25] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                        Skill Analysis
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-[#e8ebf0]">
                        {skill.name}
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#99a2b3]">
                    <span className="rounded border border-[#303848] px-2 py-0.5 text-xs text-[#99a2b3]">
                        {skill.cooldown !== null
                            ? `${skill.cooldown}s Cooldown`
                            : "Cooldown unknown"}
                    </span>

                    {isDamagingSkill && (
                        <>
                            <span className="rounded border border-[#303848] px-2 py-0.5 text-xs text-[#99a2b3]">
                                {totalHits}{" "}
                                {totalHits === 1 ? "Hit" : "Hits"}
                            </span>

                            <span className="rounded border border-[#303848] px-2 py-0.5 text-xs text-[#99a2b3]">
                                ×{formatNumber(totalMultiplier)} Total
                            </span>
                        </>
                    )}
                </div>
            </div>

            {!isDamagingSkill ? (
                <div className="mt-4 rounded-md border border-dashed border-[#303848] bg-[#0d1017]/45 p-3">
                    <p className="text-sm text-[#99a2b3]">
                        {skill.notes ?? "This skill does not deal damage."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-[#79e3ae]/30 bg-[#173126]/40 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#79e3ae]">
                                Normal Damage
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-[#d8dee9]">
                                {formatNumber(stats.skillDamage)}
                            </p>
                        </div>

                        <div className="rounded-lg border border-[#f4bd6a]/30 bg-[#342612]/40 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#f4bd6a]">
                                Critical Damage
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-[#d8dee9]">
                                {formatNumber(
                                    stats.skillDamage *
                                    stats.critMultiplier,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                            Damage Breakdown
                        </p>

                        <div className="mt-2 space-y-2">
                            {skill.damageInstances.map(
                                (instance, index) => {
                                    const damagePerHit =
                                        stats.damage *
                                        instance.multiplier;

                                    const criticalDamagePerHit =
                                        damagePerHit *
                                        stats.critMultiplier;

                                    const instanceTotalDamage =
                                        damagePerHit *
                                        instance.hits;

                                    return (
                                        <div
                                            key={`${instance.multiplier}-${instance.hits}-${index}`}
                                            className="grid gap-4 border-t border-[#303848] py-3 first:border-t-0 sm:grid-cols-[0.8fr_1fr_1fr]"
                                        >
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-[#788295]">
                                                    Instance {index + 1}
                                                </p>

                                                <p className="mt-1 font-medium text-[#d8dee9]">
                                                    {instance.hits}{" "}
                                                    {instance.hits === 1 ? "hit" : "hits"}
                                                    {" • "}
                                                    ×{formatNumber(instance.multiplier)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[11px] uppercase tracking-wide text-[#788295]">
                                                    Damage / Hit
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-[#d8dee9]">
                                                    {formatNumber(
                                                        damagePerHit,
                                                    )}
                                                </p>

                                                <p className="mt-1 text-xs text-[#99a2b3]">
                                                    Crit{" "}
                                                    {formatNumber(
                                                        criticalDamagePerHit,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[11px] uppercase tracking-wide text-[#788295]">
                                                    Total Damage
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-[#d8dee9]">
                                                    {formatNumber(
                                                        instanceTotalDamage,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

type AdvancedCalculationsProps = {
    stats: CalculatedStats | null;
    build: Build;
};

function AdvancedCalculations({
                                  stats,
                                  build,
                              }: AdvancedCalculationsProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <section className="overflow-hidden rounded-lg border border-[#303848] bg-[#171b25]">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#79e3ae]">
                        Advanced Calculations
                    </p>

                    <p className="mt-1 text-xs text-[#788295]">
                        Multipliers, formulas, and growth details
                    </p>
                </div>

                <span className="text-sm text-[#99a2b3]">
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>

            {isOpen && (
                <div className="space-y-3 border-t border-[#303848] p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-[#79e3ae]/30 bg-[#173126]/40 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#79e3ae]">
                                Health Multiplier
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-[#d8dee9]">
                                {stats
                                    ? `×${formatNumber(stats.healthTotalMultiplier)}`
                                    : "—"}
                            </p>

                            <p className="mt-1 text-xs text-[#99a2b3]">
                                Rank × enhancement × Health GP × evolution × mutation
                            </p>
                        </div>

                        <div className="rounded-lg border border-[#79e3ae]/30 bg-[#173126]/40 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#79e3ae]">
                                Damage Multiplier
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-[#d8dee9]">
                                {stats
                                    ? `×${formatNumber(stats.damageTotalMultiplier)}`
                                    : "—"}
                            </p>

                            <p className="mt-1 text-xs text-[#99a2b3]">
                                Rank × enhancement × Damage GP × evolution × mutation
                            </p>
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto rounded-lg">
                        <FormulaBreakdown stats={stats}/>
                    </div>

                    <GrowthGraphPlaceholder build={build}/>
                </div>
            )}
        </section>
    );
}

type FormulaBreakdownProps = {
    stats: CalculatedStats | null;
};

function FormulaBreakdown({ stats }: FormulaBreakdownProps) {
    if (!stats) {
        return (
            <section className="rounded-lg border border-dashed border-[#303848] bg-[#0d1017]/45 p-4">
                <h3 className="text-sm font-semibold text-[#e8ebf0]">
                    Formula Breakdown
                </h3>

                <p className="mt-2 text-sm text-[#788295]">
                    Stat data is not available for this monster yet.
                </p>
            </section>
        );
    }

    const growthLabel =
        stats.growthLabel === "multiplier"
            ? "Level growth multiplier"
            : "Level growth result";

    return (
        <section className="rounded-lg border border-dashed border-[#303848] bg-[#0d1017]/45 p-4">
            <h3 className="text-sm font-semibold text-[#e8ebf0]">
                Formula Breakdown
            </h3>

            <p className="mt-1 text-xs text-[#79e3ae]">
                Includes level, rank, enhancement, Genetic Potential, Evolution, and Mutation calculations.
            </p>

            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                    <p className="text-[#788295]">{growthLabel}</p>
                    <p className="text-[#d8dee9]">
                        {formatNumber(stats.growthValue)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">Rank multiplier</p>
                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.rankMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Enhancement multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.enhancementMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Health GP multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.healthGeneticMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Damage GP multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.damageGeneticMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Critical chance
                    </p>

                    <p className="text-[#d8dee9]">
                        {formatNumber(stats.critChance)}%
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Critical damage multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.critMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Evolution multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.evolutionMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Mutation health multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.mutationHealthMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Mutation damage multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.mutationDamageMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Health combined multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.healthTotalMultiplier)}
                    </p>
                </div>

                <div>
                    <p className="text-[#788295]">
                        Damage combined multiplier
                    </p>

                    <p className="text-[#d8dee9]">
                        ×{formatNumber(stats.damageTotalMultiplier)}
                    </p>
                </div>

                <div className="sm:col-span-2">
                    <p className="text-[#788295]">Current result</p>
                    <p className="text-[#d8dee9]">
                        Health {formatNumber(stats.health)}
                        {" · "}
                        Damage {formatNumber(stats.damage)}
                        {" · "}
                        Crit Damage {formatNumber(stats.criticalDamage)}
                    </p>
                </div>
            </div>
        </section>
    );
}

type GrowthGraphPlaceholderProps = {
    build: Build;
};

function GrowthGraphPlaceholder({
                                    build,
                                }: GrowthGraphPlaceholderProps) {
    return (
        <section
            className="flex min-h-48 flex-col rounded-lg border border-dashed border-[#303848] bg-[#0d1017]/45 p-4">
        <h3 className="text-sm font-semibold text-[#e8ebf0]">
                Growth Graph
            </h3>

            <div
                className="mt-3 flex flex-1 items-center justify-center rounded-md border border-[#272d3a] bg-[#11141c] px-4 text-center text-sm text-[#788295]"
                aria-label={`Growth chart placeholder for level ${build.level}`}
            >
                Chart placeholder for the current build.
            </div>
        </section>
    );
}

type BuildResultsPanelProps = {
    build: Build;
    stats: CalculatedStats | null;
    selectedSkillName?: string;
};

function BuildResultsPanel({
                               build,
                               stats,
                               selectedSkillName,
                           }: BuildResultsPanelProps) {
    const mutationText = build.mutations.length
        ? build.mutations.join(", ")
        : "No mutation";

    return (
        <section className="overflow-hidden rounded-lg border border-[#303848] bg-[#171b25]">
            <div className="border-b border-[#303848] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#79e3ae]">
                    Combat Stats
                </p>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#99a2b3]">
                    <span>
                        Level{" "}
                        <strong className="font-semibold text-[#d8dee9]">
                            {build.level}
                        </strong>
                    </span>

                    <span>
                        Rank{" "}
                        <strong className="font-semibold text-[#d8dee9]">
                            {build.rank ?? "—"}
                        </strong>
                    </span>

                    <span>
                        Enhancement{" "}
                        <strong className="font-semibold text-[#d8dee9]">
                            +{build.enhancement}
                        </strong>
                    </span>

                    <span>
                        Health GP{" "}
                        <strong className="font-semibold text-[#d8dee9]">
                            {build.healthGeneticPotential}%
                        </strong>
                    </span>

                    <span>
                        Damage GP{" "}
                        <strong className="font-semibold text-[#d8dee9]">
                            {build.damageGeneticPotential}%
                        </strong>
                    </span>
                </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                <BuildStat
                    icon="♥"
                    label="Health"
                    value={
                        stats
                            ? formatNumber(stats.health)
                            : "Data pending"
                    }
                    accentClassName="text-[#79e3ae]"
                />

                <BuildStat
                    icon="⚔"
                    label="Damage"
                    value={
                        stats
                            ? formatNumber(stats.damage)
                            : "Data pending"
                    }
                    accentClassName="text-[#6eb5ff]"
                />

                <BuildStat
                    icon="◎"
                    label="Crit Chance"
                    value={
                        stats
                            ? `${formatNumber(stats.critChance)}%`
                            : "Data pending"
                    }
                    accentClassName="text-[#c28cff]"
                />

                <BuildStat
                    icon="✦"
                    label="Crit Damage"
                    value={
                        stats
                            ? formatNumber(stats.criticalDamage)
                            : "Data pending"
                    }
                    accentClassName="text-[#f4bd6a]"
                />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#303848] bg-[#11141c] px-4 py-3 text-xs text-[#99a2b3]">
                <span>
                    Evolution{" "}
                    <strong className="font-medium text-[#d8dee9]">
                        ×{(build.evolutionPercent / 100).toFixed(4)}
                    </strong>
                </span>

                <span>
                    Mutation{" "}
                    <strong className="font-medium text-[#d8dee9]">
                        {mutationText}
                    </strong>
                </span>

                <span>
                    Skill{" "}
                    <strong className="font-medium text-[#d8dee9]">
                        {selectedSkillName ?? "No skill"}
                    </strong>
                </span>

                <span>
                    Paw{" "}
                    <strong className="font-medium text-[#d8dee9]">
                        {build.pawId ?? "None"}
                    </strong>
                </span>

                <span>
                    Ring{" "}
                    <strong className="font-medium text-[#d8dee9]">
                        {build.ringId ?? "None"}
                    </strong>
                </span>
            </div>
        </section>
    );
}

function EmptyCalculatorState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-[#303848] bg-[#171b25] text-2xl text-[#79e3ae]">
                ✦
            </div>

            <p className="text-base font-semibold text-[#e8ebf0]">
                Select a monster to start
            </p>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#99a2b3]">
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
    const selectedSkill = getSkill(build.selectedSkillId);

    const monsterStatData = monster
        ? getMonsterStatData(monster.id)
        : null;

    const stats =
        build.rank && monsterStatData
            ? calculateStats(monsterStatData, build)
            : null;

    return (
        <Panel
            eyebrow="Analysis"
            title="Calculator Results"
            action={
                monster ? (
                    <span className="text-xs font-medium text-[#79e3ae]">
            {monster.name}
          </span>
                ) : null
            }
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
                {!monster ? (
                    <EmptyCalculatorState/>
                ) : (
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-2 pb-5">
                        <MonsterOverviewCard
                            monster={monster}
                            rank={build.rank}
                            isFavorite={isFavorite}
                            onToggleFavorite={onToggleFavorite}
                        />
                        <BuildResultsPanel
                            build={build}
                            stats={stats}
                            selectedSkillName={selectedSkill?.name}
                        />
                        {stats && selectedSkill && (
                            <SkillDamagePanel
                                skill={selectedSkill}
                                stats={stats}
                            />
                        )}

                        <AdvancedCalculations
                            stats={stats}
                            build={build}
                        />
                    </div>
                )}
            </div>
        </Panel>
    );
}