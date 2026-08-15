"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { getAchievementsByCategory } from "../data/achievements";
import {
    ADDITIONAL_ACCOUNT_MULTIPLIER_CATEGORIES,
    ACCOUNT_MULTIPLIER_CATEGORIES,
    ACCOUNT_MULTIPLIER_DETAILS,
    PRIMARY_ACCOUNT_MULTIPLIER_CATEGORIES,
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
    "path-of-progress": "border-[#20a84f] bg-[#0c411e] text-[#49ef72]",
    "index-mania": "border-[#b87512] bg-[#4a2a08] text-[#ffc447]",
    "pet-quest": "border-[#ae8610] bg-[#443304] text-[#ffe05b]",
    "rift-challenger": "border-[#42a8ca] bg-[#0c3d53] text-[#8be8ff]",
    "strive-for-perfection": "border-[#d6a61b] bg-[#4a3707] text-[#ffe05b]",
};

const achievementsByCategory = Object.fromEntries(
    ACCOUNT_MULTIPLIER_CATEGORIES.map((category) => [
        category,
        getAchievementsByCategory(category),
    ]),
) as Record<AchievementCategory, Achievement[]>;

function formatBonusPercent(percent: number): string {
    return `+${Number(percent.toFixed(2))}%`;
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
    const petAchievements = achievementsByCategory["pet-quest"];
    const petHealthAchievements = petAchievements.filter(({ rewardStat }) => rewardStat === "health");
    const petDamageAchievements = petAchievements.filter(({ rewardStat }) => rewardStat === "damage");
    const petHealthCompleted = petHealthAchievements.filter(({ id }) => selectedSet.has(id)).length;
    const petDamageCompleted = petDamageAchievements.filter(({ id }) => selectedSet.has(id)).length;

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

    const progressCards = [
        {
            key: "index",
            category: "index-mania" as const,
            title: "Index Mania",
            iconSrc: "/account-icons/index-mania.png",
            completed: indexProgress.completed,
            total: indexProgress.total,
            percent: indexProgress.damagePercent,
            stat: "Damage",
            statIconSrc: "/account-icons/damage.png",
            tone: "amber",
        },
        {
            key: "path",
            category: "path-of-progress" as const,
            title: "Path of Progress",
            iconSrc: "/account-icons/path-of-progress.png",
            completed: pathProgress.completed,
            total: pathProgress.total,
            percent: pathProgress.healthPercent,
            stat: "Health",
            statIconSrc: "/account-icons/health.png",
            tone: "green",
        },
        {
            key: "pet-damage",
            category: "pet-quest" as const,
            title: "Pet Quest",
            qualifier: "Damage",
            iconSrc: "/account-icons/damage-up.png",
            completed: petDamageCompleted,
            total: petDamageAchievements.length,
            percent: petQuestProgress.damagePercent,
            stat: "Damage",
            statIconSrc: "/account-icons/damage.png",
            tone: "gold",
        },
        {
            key: "pet-health",
            category: "pet-quest" as const,
            title: "Pet Quest",
            qualifier: "Health",
            iconSrc: "/account-icons/health-up.png",
            completed: petHealthCompleted,
            total: petHealthAchievements.length,
            percent: petQuestProgress.healthPercent,
            stat: "Health",
            statIconSrc: "/account-icons/health.png",
            tone: "gold",
        },
    ];

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

                    {PRIMARY_ACCOUNT_MULTIPLIER_CATEGORIES.map((category) => {
                        const details = ACCOUNT_MULTIPLIER_DETAILS[category];
                        const progress = progressByCategory[category];
                        const categoryIcon = category === "path-of-progress"
                            ? "/account-icons/path-of-progress.png"
                            : category === "index-mania"
                                ? "/account-icons/index-mania.png"
                                : "/account-icons/health-up.png";

                        return (
                            <button key={category} type="button" onClick={() => { setExpandedCategory(category); setIsOpen(true); }} className="group flex min-w-0 items-center gap-3 rounded-lg border border-[#303848] bg-gradient-to-r from-[#171b25] to-[#121620] px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-[#4c5a70] hover:bg-[#1a202c]">
                                <span className="relative grid size-12 shrink-0 place-items-center">
                                    <img src={categoryIcon} alt="" className={`${category === "pet-quest" ? "absolute left-0 top-0 size-9" : "max-h-12 max-w-12"} object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]`} />
                                    {category === "pet-quest" && <img src="/account-icons/damage-up.png" alt="" className="absolute bottom-0 right-0 size-8 object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span className="truncate text-xs font-bold text-[#e7ebf2]">{details.label}</span>
                                        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black tabular-nums ${categoryStyles[category]}`}>{progress.completed}/{progress.total}</span>
                                    </span>
                                    <span className={`mt-1 flex items-center gap-2 text-[10px] font-bold ${progress.completed ? "text-[#79e3ae]" : "text-[#788295]"}`}>
                                        {progress.healthPercent > 0 && <span className="flex items-center gap-1"><img src="/account-icons/health.png" alt="Health" className="size-5 object-contain" />+{progress.healthPercent}%</span>}
                                        {progress.damagePercent > 0 && <span className="flex items-center gap-1"><img src="/account-icons/damage.png" alt="Damage" className="size-5 object-contain" />+{progress.damagePercent}%</span>}
                                        {!progress.healthPercent && !progress.damagePercent && "No bonus yet"}
                                    </span>
                                </span>
                                <span className="text-[#657084] transition group-hover:translate-x-0.5 group-hover:text-[#9aabc3]">›</span>
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

                        <div className="space-y-4 p-4 sm:p-5">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {progressCards.map((card) => {
                                    const isGreen = card.tone === "green";
                                    const isGold = card.tone === "gold";
                                    const isExpanded = expandedCategory === card.category;
                                    const frame = isGreen ? "border-[#176b34] bg-[#071c10]" : isGold ? "border-[#66520d] bg-[#1d1704]" : "border-[#75410b] bg-[#241304]";
                                    const glow = isGreen ? "from-[#0b5525] via-[#073a1a]" : isGold ? "from-[#604606] via-[#3d2d04]" : "from-[#673505] via-[#402204]";
                                    const accent = isGreen ? "text-[#24eb57]" : isGold ? "text-[#ffd32e]" : "text-[#ffb21b]";
                                    const badge = isGreen ? "border-[#17b64c] bg-[#063718] text-[#39f46a]" : "border-[#c17d08] bg-[#3a2503] text-[#ffd146]";

                                    return (
                                        <button
                                            key={card.key}
                                            type="button"
                                            onClick={() => setExpandedCategory(isExpanded ? null : card.category)}
                                            aria-expanded={isExpanded}
                                            className={`group relative overflow-hidden rounded-2xl border-2 p-1 text-left shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 ${frame} ${isExpanded ? "ring-2 ring-[#79e3ae]/60" : ""}`}
                                        >
                                            <span className={`relative flex min-h-28 items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r ${glow} to-[#090c10] px-4 py-3`}>
                                                <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1.5px)", backgroundSize: "14px 14px" }} />
                                                <span className="relative grid size-16 shrink-0 place-items-center">
                                                    <img src={card.iconSrc} alt="" className="max-h-16 max-w-16 object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.65)]" />
                                                </span>
                                                <span className="relative min-w-0 flex-1">
                                                    <span className="flex flex-wrap items-baseline gap-x-1 text-white drop-shadow-[0_2px_1px_#000]">
                                                        <span className="text-lg font-black tracking-tight">{card.title}</span>
                                                        {card.qualifier && <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">({card.qualifier})</span>}
                                                    </span>
                                                    <span className={`mt-2 inline-flex rounded-lg border-2 px-2 py-0.5 text-base font-black tabular-nums shadow-inner ${badge}`}>
                                                        {card.completed}/{card.total}
                                                    </span>
                                                </span>
                                                <span className="relative shrink-0 text-right">
                                                    <span className={`block text-2xl font-black tabular-nums drop-shadow-[0_2px_1px_#000] ${accent}`}>+{card.percent}%</span>
                                                    <span className="mt-1 block text-sm font-black text-white drop-shadow-[0_2px_1px_#000]">{card.stat}</span>
                                                    <img src={card.statIconSrc} alt="" className="ml-auto mt-1 size-7 object-contain" />
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <section className="rounded-xl border border-[#303848] bg-[#0d1118] p-3">
                                <div className="mb-3 px-1">
                                    <div>
                                        <h3 className="text-sm font-black text-white">Additional Bonuses</h3>
                                        <p className="mt-0.5 text-[10px] text-[#788295]">Rare account rewards with specialized effects.</p>
                                    </div>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {ADDITIONAL_ACCOUNT_MULTIPLIER_CATEGORIES.map((category) => {
                                        const achievement = achievementsByCategory[category][0];
                                        if (!achievement) return null;

                                        const isSelected = selectedSet.has(achievement.id);
                                        const isRift = category === "rift-challenger";
                                        const details = ACCOUNT_MULTIPLIER_DETAILS[category];
                                        const achievementIcon = isRift
                                            ? "/account-icons/rift-challenger.png"
                                            : "/account-icons/strive-for-perfection.png";
                                        const rewardIcon = isRift
                                            ? "/account-icons/rift-damage.png"
                                            : "/account-icons/crit-chance-up.png";

                                        return (
                                            <button
                                                key={category}
                                                type="button"
                                                role="checkbox"
                                                aria-checked={isSelected}
                                                onClick={() => toggleAchievement(achievement)}
                                                className={`group flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition ${isSelected ? "border-[#79e3ae] bg-[#123421]" : "border-[#303848] bg-[#151923] hover:border-[#4a5568] hover:bg-[#1a202b]"}`}
                                            >
                                                <img src={achievementIcon} alt="" className="size-12 shrink-0 object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-xs font-black text-white">{details.label}</span>
                                                    <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-[#aab3c2]">
                                                        <img src={rewardIcon} alt="" className="size-6 object-contain" />
                                                        {details.shortReward}
                                                    </span>
                                                </span>
                                                <span className={`grid size-7 shrink-0 place-items-center rounded-md border-2 text-sm font-black ${isSelected ? "border-[#3ee378] bg-[#26c965] text-[#07130b]" : "border-[#4a5568] bg-[#0d1118] text-transparent"}`}>✓</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {expandedCategory && (() => {
                                const category = expandedCategory;
                                const details = ACCOUNT_MULTIPLIER_DETAILS[category];
                                const categoryAchievements = achievementsByCategory[category];
                                const progress = progressByCategory[category];

                                return (
                                    <section className="overflow-hidden rounded-xl border border-[#3a4353] bg-[#121722] shadow-xl">
                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#303848] bg-[#171d28] p-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-black text-white">{details.label} Achievements</h3>
                                                    <span className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${categoryStyles[category]}`}>
                                                        <img src={category === "path-of-progress" ? "/account-icons/health.png" : category === "index-mania" ? "/account-icons/damage.png" : "/account-icons/health-up.png"} alt="" className="size-4 object-contain" />
                                                        {details.shortReward}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-[#8f9aae]">{details.description}</p>
                                            </div>
                                            <label className="flex items-center gap-2 rounded-lg border border-[#4a5568] bg-[#090c12] px-3 py-2">
                                                <span className="text-[9px] font-bold uppercase tracking-wide text-[#788295]">Completed</span>
                                                <input type="number" min={0} max={categoryAchievements.length} value={progress.completed} onChange={(event) => setCategoryCount(category, Number(event.target.value))} className="w-12 bg-transparent text-right text-sm font-black text-white outline-none" aria-label={`${details.label} completed`} />
                                                <span className="text-sm font-black text-[#788295]">/{categoryAchievements.length}</span>
                                            </label>
                                            <button type="button" onClick={() => setExpandedCategory(null)} className="text-xs font-bold text-[#79e3ae] hover:text-white">Hide ↑</button>
                                        </div>
                                        <div className={category === "index-mania" ? "max-h-80 overflow-y-auto" : ""}>
                                            {categoryAchievements.map((achievement) => {
                                                const isSelected = selectedSet.has(achievement.id);
                                                return (
                                                    <button key={achievement.id} type="button" role="checkbox" aria-checked={isSelected} onClick={() => toggleAchievement(achievement)} className={`flex w-full items-center gap-3 border-b border-[#272d3a] px-4 py-3 text-left transition last:border-b-0 ${isSelected ? "bg-[#123421]" : "hover:bg-[#1b202c]"}`}>
                                                        <span className={`grid size-7 shrink-0 place-items-center rounded-md border-2 text-sm font-black ${isSelected ? "border-[#3ee378] bg-[#26c965] text-[#07130b]" : "border-[#4a5568] bg-[#0d1118] text-transparent"}`}>✓</span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-bold text-[#eef1f6]">{achievement.name}</span>
                                                            <span className="mt-0.5 block text-xs text-[#788295]">{achievementGoal(achievement)}</span>
                                                        </span>
                                                        <span className={`flex shrink-0 items-center gap-1.5 text-xs font-black ${achievement.rewardStat === "health" ? "text-[#39ef64]" : "text-[#ff6388]"}`}>
                                                            <img src={achievement.rewardStat === "health" ? "/account-icons/health.png" : "/account-icons/damage.png"} alt="" className="size-5 object-contain" />
                                                            +{achievement.rewardPercent}%
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                );
                            })()}

                            <section className="overflow-hidden rounded-2xl border-2 border-[#5a4a45] bg-[#071015] p-1 shadow-[0_12px_35px_rgba(0,0,0,0.45)]">
                                <div className="rounded-xl bg-gradient-to-b from-[#0d2025] to-[#080d12] px-4 py-4 sm:px-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#42505b]" />
                                        <h3 className="text-xl font-black text-white drop-shadow-[0_2px_1px_#000]">Total Bonuses</h3>
                                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#42505b]" />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 sm:divide-x sm:divide-[#39434b]">
                                        <div className="text-center sm:pr-4">
                                            <p className="flex items-center justify-center gap-2 text-2xl font-black text-[#ff517e] drop-shadow-[0_0_10px_rgba(255,81,126,0.35)]"><img src="/account-icons/damage.png" alt="Damage" className="size-9 object-contain" />+{bonuses.damagePercent}%</p>
                                            <p className="text-sm font-black text-white">Damage</p>
                                            <p className="mt-3 rounded-lg border border-[#76243e] bg-[#250c15] px-2 py-1.5 text-[11px] font-bold text-[#ff7899]">{formatBonusPercent(indexProgress.damagePercent)} × {formatBonusPercent(petQuestProgress.damagePercent)} = {formatBonusPercent(bonuses.damagePercent)}</p>
                                        </div>
                                        <div className="border-t border-[#39434b] pt-4 text-center sm:border-t-0 sm:pl-4 sm:pt-0">
                                            <p className="flex items-center justify-center gap-2 text-2xl font-black text-[#39ef64] drop-shadow-[0_0_10px_rgba(57,239,100,0.35)]"><img src="/account-icons/health.png" alt="Health" className="size-9 object-contain" />+{bonuses.healthPercent}%</p>
                                            <p className="text-sm font-black text-white">Health</p>
                                            <p className="mt-3 rounded-lg border border-[#1f7438] bg-[#092314] px-2 py-1.5 text-[11px] font-bold text-[#62f383]">{formatBonusPercent(pathProgress.healthPercent)} × {formatBonusPercent(petQuestProgress.healthPercent)} = {formatBonusPercent(bonuses.healthPercent)}</p>
                                        </div>
                                    </div>
                                    {(bonuses.riftDamagePercent > 0 || bonuses.critChancePercent > 0) && (
                                        <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-[#303b43] pt-3">
                                            {bonuses.riftDamagePercent > 0 && (
                                                <span className="flex items-center gap-1.5 rounded-lg border border-[#247899] bg-[#092634] px-2.5 py-1.5 text-[11px] font-black text-[#83e5ff]">
                                                    <img src="/account-icons/rift-damage.png" alt="" className="size-6 object-contain" />
                                                    +{bonuses.riftDamagePercent}% Rift Damage
                                                </span>
                                            )}
                                            {bonuses.critChancePercent > 0 && (
                                                <span className="flex items-center gap-1.5 rounded-lg border border-[#a98212] bg-[#302505] px-2.5 py-1.5 text-[11px] font-black text-[#ffe05b]">
                                                    <img src="/account-icons/crit-chance-up.png" alt="" className="size-6 object-contain" />
                                                    +{bonuses.critChancePercent}% Crit Chance
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
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