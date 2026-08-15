"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { getAchievementsByCategory } from "../data/achievements";
import {
    ACCOUNT_MULTIPLIER_CATEGORIES,
    ACCOUNT_MULTIPLIER_DETAILS,
    getAccountBonuses,
    getCategoryProgress,
} from "../lib/calculations/account-multipliers";
import type { Achievement, AchievementCategory } from "../types/achievement";
import type { Build } from "../types/build";

type AccountMultipliersProps = {
    build: Build;
    onBuildChangeAction: Dispatch<SetStateAction<Build>>;
};

const categoryStyles: Record<AchievementCategory, string> = {
    "path-of-progress": "border-[#d99a2b] bg-[#3d2a12] text-[#ffd484]",
    "index-mania": "border-[#8056b8] bg-[#382254] text-[#d8b7ff]",
    "pet-quest": "border-[#5f9b50] bg-[#1e4523] text-[#a5ef8e]",
};

const achievementsByCategory = Object.fromEntries(
    ACCOUNT_MULTIPLIER_CATEGORIES.map((category) => [
        category,
        getAchievementsByCategory(category),
    ]),
) as Record<AchievementCategory, Achievement[]>;

function rewardText(healthPercent: number, damagePercent: number): string {
    const rewards = [];
    if (healthPercent > 0) rewards.push(`+${healthPercent}% HP`);
    if (damagePercent > 0) rewards.push(`+${damagePercent}% DMG`);
    return rewards.length ? rewards.join(" · ") : "No bonus yet";
}

function formatMultiplier(value: number): string {
    return `${Number(value.toFixed(4))}×`;
}

function achievementGoal(achievement: Achievement): string {
    if (achievement.goalAmount !== null) {
        return `${achievement.goalType}: ${achievement.goalAmount.toLocaleString()}`;
    }
    return achievement.island
        ? `${achievement.island} reward claimed`
        : achievement.goalType;
}

export function AccountMultipliers({
                                       build,
                                       onBuildChangeAction,
                                   }: AccountMultipliersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<AchievementCategory | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const selectedIds = build.accountMultipliers.completedAchievementIds;
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const bonuses = useMemo(
        () => getAccountBonuses(build.accountMultipliers),
        [build.accountMultipliers],
    );
    const progressByCategory = useMemo(
        () => Object.fromEntries(
            ACCOUNT_MULTIPLIER_CATEGORIES.map((category) => [
                category,
                getCategoryProgress(build.accountMultipliers, category),
            ]),
        ) as Record<AchievementCategory, ReturnType<typeof getCategoryProgress>>,
        [build.accountMultipliers],
    );
    const pathProgress = progressByCategory["path-of-progress"];
    const indexProgress = progressByCategory["index-mania"];
    const petQuestProgress = progressByCategory["pet-quest"];

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen]);

    const updateSelectedIds = (nextIds: string[]) => {
        onBuildChangeAction((current) => ({
            ...current,
            accountMultipliers: {
                completedAchievementIds: [...new Set(nextIds)],
            },
        }));
    };

    const setCategoryCount = (category: AchievementCategory, rawCount: number) => {
        const categoryAchievements = achievementsByCategory[category];
        const count = Math.max(0, Math.min(categoryAchievements.length, Math.trunc(rawCount || 0)));
        const categoryIds = new Set(categoryAchievements.map(({ id }) => id));
        const otherIds = selectedIds.filter((id) => !categoryIds.has(id));
        updateSelectedIds([
            ...otherIds,
            ...categoryAchievements.slice(0, count).map(({ id }) => id),
        ]);
    };

    const toggleAchievement = (achievement: Achievement) => {
        const categoryAchievements = achievementsByCategory[achievement.category];

        if (achievement.category === "pet-quest") {
            const clickedIndex = categoryAchievements.findIndex(({ id }) => id === achievement.id);
            const categoryIds = new Set(categoryAchievements.map(({ id }) => id));
            const otherIds = selectedIds.filter((id) => !categoryIds.has(id));
            const nextCount = selectedSet.has(achievement.id) ? clickedIndex : clickedIndex + 1;
            updateSelectedIds([
                ...otherIds,
                ...categoryAchievements.slice(0, nextCount).map(({ id }) => id),
            ]);
            return;
        }

        updateSelectedIds(
            selectedSet.has(achievement.id)
                ? selectedIds.filter((id) => id !== achievement.id)
                : [...selectedIds, achievement.id],
        );
    };

    const reset = () => updateSelectedIds([]);

    return (
        <>
            <section className="rounded-lg border border-[#272d3a] bg-[#11141c] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <div className="grid gap-3 lg:grid-cols-[minmax(230px,0.9fr)_repeat(3,minmax(190px,1fr))] lg:items-stretch">
                    <div className="flex items-center justify-between gap-3 lg:pr-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-sm font-semibold text-[#e8ebf0]">Account Multipliers</h2>
                                <span className="rounded border border-[#303848] bg-[#171b25] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#788295]">Account-wide</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#788295]">Saved when you switch monsters or reset a build.</p>
                        </div>
                        <button type="button" onClick={() => { setExpandedCategory(null); setIsOpen(true); }} className="shrink-0 rounded-md border border-[#303848] bg-[#171b25] px-2.5 py-1.5 text-[10px] font-semibold text-[#99a2b3] transition hover:border-[#79e3ae] hover:text-[#79e3ae]">
                            Manage
                        </button>
                    </div>

                    {ACCOUNT_MULTIPLIER_CATEGORIES.map((category) => {
                        const details = ACCOUNT_MULTIPLIER_DETAILS[category];
                        const progress = progressByCategory[category];

                        return (
                            <button key={category} type="button" onClick={() => { setExpandedCategory(category); setIsOpen(true); }} className="flex min-w-0 items-center gap-3 rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-left transition hover:border-[#4a5568]">
                                <span className={`grid size-8 shrink-0 place-items-center rounded border text-xs font-black shadow-md ${categoryStyles[category]}`}>
                                    {progress.completed}/{progress.total}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-medium text-[#d8dee9]">{details.label}</span>
                                    <span className={`mt-0.5 block truncate text-[10px] ${progress.completed ? "text-[#79e3ae]" : "text-[#788295]"}`}>
                                        {rewardText(progress.healthPercent, progress.damagePercent)}
                                    </span>
                                </span>
                                <span className="text-[#657084]">›</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {isOpen && (
                <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setIsOpen(false);
                }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="account-multipliers-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#303848] bg-[#11141c] shadow-2xl">
                        <header className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#272d3a] bg-[#11141c] px-5 py-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#79e3ae]">Account Progress</p>
                                <h2 id="account-multipliers-title" className="mt-1 text-lg font-semibold text-[#f2f4f8]">Account Multipliers</h2>
                                <p className="mt-1 text-xs text-[#99a2b3]">Enter a completed total or check achievements individually.</p>
                            </div>
                            <button ref={closeButtonRef} type="button" onClick={() => setIsOpen(false)} aria-label="Close account multipliers" className="grid size-9 shrink-0 place-items-center rounded-md border border-[#303848] bg-[#171b25] text-lg text-[#99a2b3] hover:border-[#79e3ae] hover:text-[#79e3ae]">×</button>
                        </header>

                        <div className="space-y-5 p-5">
                            {ACCOUNT_MULTIPLIER_CATEGORIES.map((category) => {
                                const details = ACCOUNT_MULTIPLIER_DETAILS[category];
                                const categoryAchievements = achievementsByCategory[category];
                                const progress = progressByCategory[category];
                                const isExpanded = expandedCategory === category;

                                return (
                                    <section key={category} className="overflow-hidden rounded-xl border border-[#303848] bg-[#151923]">
                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#303848] p-4">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                                                aria-expanded={isExpanded}
                                                className="min-w-0 flex-1 text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-[#e8ebf0]">{details.label}</h3>
                                                    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${categoryStyles[category]}`}>{details.shortReward}</span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-[#788295]">{details.description}</p>
                                                <span className="mt-2 inline-block text-[10px] font-semibold text-[#79e3ae]">
                                                    {isExpanded ? "Hide achievements ↑" : "Show achievements ↓"}
                                                </span>
                                            </button>

                                            <label className="flex items-center gap-2 rounded-lg border border-[#3a4353] bg-[#0e1118] px-3 py-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-[#788295]">Completed</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={categoryAchievements.length}
                                                    value={progress.completed}
                                                    onChange={(event) => setCategoryCount(category, Number(event.target.value))}
                                                    className="w-12 bg-transparent text-right text-sm font-bold text-[#f2f4f8] outline-none"
                                                    aria-label={`${details.label} completed`}
                                                />
                                                <span className="text-sm font-bold text-[#788295]">/{categoryAchievements.length}</span>
                                            </label>
                                        </div>

                                        {isExpanded && <div className={category === "index-mania" ? "max-h-80 overflow-y-auto" : ""}>
                                            {categoryAchievements.map((achievement) => {
                                                const isSelected = selectedSet.has(achievement.id);
                                                return (
                                                    <button key={achievement.id} type="button" role="checkbox" aria-checked={isSelected} onClick={() => toggleAchievement(achievement)} className={`flex w-full items-center gap-3 border-b border-[#272d3a] px-4 py-3 text-left transition last:border-b-0 ${isSelected ? "bg-[#173126]/55" : "hover:bg-[#1b202c]"}`}>
                                                        <span className={`grid size-6 shrink-0 place-items-center rounded border text-xs font-black ${isSelected ? "border-[#79e3ae] bg-[#79e3ae] text-[#0b1510]" : "border-[#4a5568] text-transparent"}`}>✓</span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-semibold text-[#e8ebf0]">{achievement.name}</span>
                                                            <span className="mt-0.5 block text-xs text-[#788295]">{achievementGoal(achievement)}</span>
                                                        </span>
                                                        <span className={`shrink-0 text-xs font-bold ${achievement.rewardStat === "health" ? "text-[#7dd3fc]" : "text-[#f9a8d4]"}`}>
                                                            +{achievement.rewardPercent}% {achievement.rewardStat === "health" ? "HP" : "DMG"}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>}
                                    </section>
                                );
                            })}

                            <div className="grid gap-3 rounded-lg border border-[#2c6048] bg-[#173126]/45 p-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-[#9ab2a5]">Total Health Bonus</p>
                                    <p className="mt-1 text-2xl font-bold text-[#7dd3fc]">+{bonuses.healthPercent}%</p>
                                    <p className="mt-2 text-[11px] text-[#99a2b3]">
                                        Path {formatMultiplier(1 + pathProgress.healthPercent / 100)}
                                        <span className="px-1.5 text-[#657084]">×</span>
                                        Pet Quest {formatMultiplier(1 + petQuestProgress.healthPercent / 100)}
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-[#7dd3fc]">
                                        = {formatMultiplier(bonuses.healthMultiplier)} Health
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#9ab2a5]">Total Damage Bonus</p>
                                    <p className="mt-1 text-2xl font-bold text-[#f9a8d4]">+{bonuses.damagePercent}%</p>
                                    <p className="mt-2 text-[11px] text-[#99a2b3]">
                                        Index {formatMultiplier(1 + indexProgress.damagePercent / 100)}
                                        <span className="px-1.5 text-[#657084]">×</span>
                                        Pet Quest {formatMultiplier(1 + petQuestProgress.damagePercent / 100)}
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-[#f9a8d4]">
                                        = {formatMultiplier(bonuses.damageMultiplier)} Damage
                                    </p>
                                </div>
                            </div>
                        </div>

                        <footer className="sticky bottom-0 z-20 flex justify-between gap-3 border-t border-[#272d3a] bg-[#11141c] px-5 py-4">
                            <button type="button" onClick={reset} disabled={selectedIds.length === 0} className="rounded-md px-3 py-2 text-xs font-semibold text-[#99a2b3] hover:text-[#e8ebf0] disabled:cursor-not-allowed disabled:opacity-40">Reset All</button>
                            <button type="button" onClick={() => setIsOpen(false)} className="rounded-md bg-[#79e3ae] px-5 py-2 text-sm font-bold text-[#0b1510] hover:bg-[#8ce9ba]">Done</button>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
}