import { getMonsterStatData } from "../data/monster-stats";
import { getRankMultiplier } from "../lib/calculations/ranks";
import {
    calculateStats,
    type CalculatedStats,
} from "../lib/calculations/stats";

import type { Build } from "../types/build";
import type { Monster } from "../types/monster";

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
                Currently includes level and rank calculations.
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

                <div className="sm:col-span-2">
                    <p className="text-[#788295]">Current result</p>
                    <p className="text-[#d8dee9]">
                        Health {formatNumber(stats.health)}
                        {" · "}
                        Damage {formatNumber(stats.damage)}
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
        <section className="flex min-h-36 flex-col rounded-lg border border-dashed border-[#303848] bg-[#0d1017]/45 p-4">
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

type MonsterSummaryProps = {
    monster: Monster;
};

function MonsterSummary({ monster }: MonsterSummaryProps) {
    return (
        <div className="flex items-center gap-4 rounded-lg border border-[#303848] bg-[#171b25] p-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#202632]">
                {monster.image ? (
                    <img
                        src={monster.image}
                        alt={monster.name}
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <span className="text-sm font-black text-[#79e3ae]">
            {monster.name.slice(0, 2).toUpperCase()}
          </span>
                )}
            </div>

            <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-[#f2f4f8]">
                    {monster.name}
                </h3>

                <p className="mt-1 text-sm text-[#99a2b3]">
                    {monster.element} · {monster.island}
                </p>

                <p className="mt-1 text-xs text-[#788295]">
                    {monster.hasEvolution
                        ? "Evolution available"
                        : "No evolution available"}
                </p>
            </div>
        </div>
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
                Genetic Potential {build.geneticPotential}%
            </p>

            <p className="mt-1 text-xs text-[#99a2b3]">
                Evolution ×{build.evolutionMultiplier}
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
};

export function CalculatorResults({
                                      monster,
                                      build,
                                  }: CalculatorResultsProps) {
    const selectedSkill = monster?.skills.find(
        (skill) => skill.id === build.selectedSkillId,
    );

    const monsterStatData = monster
        ? getMonsterStatData(monster.id)
        : null;

    const stats =
        build.rank && monsterStatData
            ? calculateStats(
                monsterStatData,
                build.level,
                build.rank,
            )
            : null;

    const rankMultiplier = build.rank
        ? getRankMultiplier(build.rank)
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
                        <MonsterSummary monster={monster} />

                        <ActiveBuildSummary
                            build={build}
                            selectedSkillName={selectedSkill?.name}
                        />

                        <div className="grid gap-3 sm:grid-cols-3">
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
                                label="Skill Damage"
                                value="Not calculated yet"
                            />
                        </div>

                        <div className="rounded-lg border border-[#79e3ae]/30 bg-[#173126]/40 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#79e3ae]">
                                Total Multiplier
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-[#d8dee9]">
                                {rankMultiplier !== null
                                    ? `×${formatNumber(rankMultiplier)}`
                                    : "—"}
                            </p>

                            <p className="mt-1 text-xs text-[#99a2b3]">
                                Rank multiplier only
                            </p>
                        </div>

                        <FormulaBreakdown stats={stats} />

                        <GrowthGraphPlaceholder build={build} />
                    </div>
                )}
            </div>
        </Panel>
    );
}