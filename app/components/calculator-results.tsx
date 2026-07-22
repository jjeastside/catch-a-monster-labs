import { getMonsterStatData } from "../data/monster-stats";
import {getSkill} from "../data/skills";

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

type StatCardProps = {
    label: string;
    value: string;
};

function StatCard({ label, value }: StatCardProps) {
    return (
        <div className="rounded-lg border border-[#303848] bg-[#171b25] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                {label}
            </p>

            <p className="mt-3 text-xl font-semibold text-[#d8dee9]">
                {value}
            </p>
        </div>
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
            className="flex min-h-36 flex-col rounded-lg border border-dashed border-[#303848] bg-[#0d1017]/45 p-4">
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

type ActiveBuildSummaryProps = {
    build: Build;
    selectedSkillName?: string;
};

function ActiveBuildSummary({
                                build,
                                selectedSkillName,
                            }: ActiveBuildSummaryProps) {
    const mutationText = build.mutations.length
        ? build.mutations.join(", ")
        : "No mutations";

    return (
        <div className="rounded-lg border border-[#303848] bg-[#0d1017]/45 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                Active Build
            </p>

            <p className="mt-2 text-sm text-[#d8dee9]">
                Level {build.level}
                {" · "}
                Rank {build.rank ?? "—"}
                {" · "}
                +{build.enhancement}
                {" · "}
                Health GP {build.healthGeneticPotential}%
                {" · "}
                Damage GP {build.damageGeneticPotential}%
            </p>

            <p className="mt-1 text-xs text-[#99a2b3]">
                Evolution ×{(build.evolutionPercent / 100).toFixed(4)}
                {" · "}
                {mutationText}
                {" · "}
                {selectedSkillName ?? "No skill"}
                {" · "}
                {build.pawId ?? "No paw"}
                {" · "}
                {build.ringId ?? "No ring"}
            </p>
        </div>
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
            <div className="flex flex-1 flex-col p-5">
                {!monster ? (
                    <EmptyCalculatorState />
                ) : (
                    <div className="flex flex-1 flex-col gap-4 overflow-auto">
                        <MonsterOverviewCard
                            monster={monster}
                            rank={build.rank}
                            isFavorite={isFavorite}
                            onToggleFavorite={onToggleFavorite}
                        />

                        <ActiveBuildSummary
                            build={build}
                            selectedSkillName={selectedSkill?.name}
                        />

                        <div className="grid gap-3 sm:grid-cols-5">
                            <StatCard
                                label="Health"
                                value={
                                    stats
                                        ? formatNumber(stats.health)
                                        : "Data pending"
                                }
                            />

                            <StatCard
                                label="Damage"
                                value={
                                    stats
                                        ? formatNumber(stats.damage)
                                        : "Data pending"
                                }
                            />

                            <StatCard
                                label="Crit Chance"
                                value={
                                    stats
                                        ? `${formatNumber(stats.critChance)}%`
                                        : "Data pending"
                                }
                            />

                            <StatCard
                                label="Crit Damage"
                                value={
                                    stats
                                        ? formatNumber(stats.criticalDamage)
                                        : "Data pending"
                                }
                            />

                            <StatCard
                                label="Skill Damage"
                                value={
                                    stats && selectedSkill
                                        ? formatNumber(stats.skillDamage)
                                        : "Select a skill"
                                }
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-[#79e3ae]/30 bg-[#173126]/40 p-4">
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

                            <div className="rounded-lg border border-[#79e3ae]/30 bg-[#173126]/40 p-4">
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

                        <FormulaBreakdown stats={stats}/>

                        <GrowthGraphPlaceholder build={build}/>
                    </div>
                )}
            </div>
        </Panel>
    );
}