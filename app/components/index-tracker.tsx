"use client";
import { PageHeading } from "./page-heading";

import { type ChangeEvent, type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { assetPath } from "../lib/asset-path";
import { ISLANDS, type Island } from "../types/monster";

const STORAGE_KEY = "cam-lab-index-tracker-v1";
const INITIAL_MONSTER_BATCH = 24;
const MONSTER_BATCH_SIZE = 24;
const RANKS = ["E", "D", "C", "B", "A", "S", "SS"] as const;
const RANK_POINTS: Record<Rank, number> = {
    E: 3,
    D: 4,
    C: 5,
    B: 6,
    A: 7,
    S: 9,
    SS: 12,
};
const BONUSES = [
    { id: "huge", label: "Huge", points: 3, icon: "/icons/Huge.png" },
    { id: "shiny", label: "Shiny", points: 2, icon: "/icons/Shiny.png" },
    { id: "bloodlit", label: "Bloodlit", points: 2, icon: "/icons/Bloodlit.png" },
    { id: "fairy", label: "Fairy", points: 2, icon: "/icons/Fairy.png" },
] as const;

type Rank = (typeof RANKS)[number];
type BonusId = (typeof BONUSES)[number]["id"];
type Gender = "male" | "female";
type MonsterProgress = {
    rank?: Rank;
    bonuses?: Partial<Record<BonusId, boolean>>;
    gender?: Gender;
};
type TrackerProgress = Record<string, MonsterProgress>;
type Filter = "all" | "incomplete" | "complete" | "missing-monster" | "missing-bonuses";
type SortOption = "index" | "missing-most" | "closest" | "score-high" | "mutation" | "name";
type ViewMode = "grid" | "list";
type BulkRankAction = "keep" | "clear" | Rank;
type BulkBonusAction = "keep" | "add" | "remove";
type BulkGenderAction = "keep" | "clear" | Gender;
type GenderFilter = "all" | Gender;
type RankFilter = "all" | "unranked" | Rank;
type LocationFilter = "all" | Island;

const GENDERS = {
    male: { label: "Male", icon: "/icons/male.png", tone: "border-[#19a9ff] bg-[#082b42] text-[#42c2ff]" },
    female: { label: "Female", icon: "/icons/female.png", tone: "border-[#ff5075] bg-[#40121f] text-[#ff7893]" },
} as const;

function scoreFor(progress?: MonsterProgress) {
    const rankPoints = progress?.rank ? RANK_POINTS[progress.rank] : 0;
    const bonusPoints = BONUSES.reduce(
        (total, bonus) => total + (progress?.bonuses?.[bonus.id] ? bonus.points : 0),
        0,
    );
    return rankPoints + bonusPoints;
}

// Plans contain targets; collected progress always wins when a target is reached.
function plannedProgress(current: MonsterProgress = {}, target: MonsterProgress = {}): MonsterProgress {
    const rank = target.rank && RANKS.indexOf(target.rank) > (current.rank ? RANKS.indexOf(current.rank) : -1)
        ? target.rank : current.rank;
    const bonuses = { ...current.bonuses };
    BONUSES.forEach(({ id }) => { if (target.bonuses?.[id]) bonuses[id] = true; });
    return { ...current, rank, bonuses, gender: target.gender ?? current.gender };
}

function sanitizePlans(value: unknown): TrackerProgress {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const result: TrackerProgress = {};
    for (const monster of GENERATED_MONSTERS) {
        const candidate = (value as Record<string, MonsterProgress>)[monster.id];
        if (!candidate || typeof candidate !== "object") continue;
        const rank = RANKS.includes(candidate.rank as Rank) ? candidate.rank : undefined;
        const bonuses = Object.fromEntries(BONUSES.filter(({ id }) => candidate.bonuses?.[id] === true).map(({ id }) => [id, true]));
        const gender = candidate.gender === "male" || candidate.gender === "female" ? candidate.gender : undefined;
        if (rank || gender || Object.keys(bonuses).length) result[monster.id] = { rank, bonuses, gender };
    }
    return result;
}

function rankTone(rank?: Rank) {
    if (rank === "SS") return "text-[#ff5757]";
    if (rank === "S") return "text-transparent";
    if (rank === "A") return "text-[#ffd84a]";
    if (rank === "B") return "text-[#d965ff]";
    if (rank === "C") return "text-[#55d7ff]";
    if (rank === "D") return "text-[#45ec72]";
    return "text-[#aeb8c8]";
}

function rankLabelStyle(rank?: Rank): CSSProperties {
    const heavierLabel: CSSProperties = {
        display: "inline-block",
        fontWeight: 950,
        letterSpacing: "-0.015em",
        transform: "scaleX(1.1)",
        WebkitTextStroke: "0.2px currentColor",
    };
    if (rank !== "S") return heavierLabel;
    return {
        ...heavierLabel,
        backgroundImage: "linear-gradient(100deg,#ff4545 4%,#ffd83d 25%,#43e86e 45%,#31cbea 65%,#8e62ff 82%,#ff58a8 100%)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        textShadow: "none",
        filter: "drop-shadow(0 1px 0 #050608)",
        transform: "scaleX(1.14)",
        WebkitTextStroke: "0",
    };
}

function compareMutationPriority(a?: MonsterProgress, b?: MonsterProgress) {
    for (const bonus of BONUSES) {
        const difference = Number(Boolean(b?.bonuses?.[bonus.id])) - Number(Boolean(a?.bonuses?.[bonus.id]));
        if (difference !== 0) return difference;
    }
    return 0;
}

function emptyBonuses(): Partial<Record<BonusId, boolean>> {
    return {};
}

function emptyBulkBonusActions(): Record<BonusId, BulkBonusAction> {
    return Object.fromEntries(BONUSES.map((bonus) => [bonus.id, "keep"])) as Record<BonusId, BulkBonusAction>;
}

export function IndexTracker() {
    const [progress, setProgress] = useState<TrackerProgress>({});
    const [plans, setPlans] = useState<TrackerProgress>({});
    const [planningMode, setPlanningMode] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [selectedId, setSelectedId] = useState(GENERATED_MONSTERS[0]?.id ?? "");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
    const [rankFilter, setRankFilter] = useState<RankFilter>("all");
    const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("index");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(() => new Set());
    const [bulkHiddenIds, setBulkHiddenIds] = useState<Set<string>>(() => new Set());
    const [showBulkHidden, setShowBulkHidden] = useState(false);
    const [hideBulkAfterApply, setHideBulkAfterApply] = useState(true);
    const [bulkRankAction, setBulkRankAction] = useState<BulkRankAction>("keep");
    const [bulkGenderAction, setBulkGenderAction] = useState<BulkGenderAction>("keep");
    const [bulkBonusActions, setBulkBonusActions] = useState<Record<BonusId, BulkBonusAction>>(emptyBulkBonusActions);
    const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
    const progressEditorRef = useRef<HTMLElement>(null);
    const [showClearConfirmation, setShowClearConfirmation] = useState(false);
    const [importMessage, setImportMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [renderedMonsterCount, setRenderedMonsterCount] = useState(INITIAL_MONSTER_BATCH);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as TrackerProgress;
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    setProgress(parsed);
                }
            }
        } catch {
            window.localStorage.removeItem(STORAGE_KEY);
        } finally {
            setHasLoaded(true);
        }
    }, []);

    useEffect(() => {
        try {
            setPlans(sanitizePlans(JSON.parse(window.localStorage.getItem(`${STORAGE_KEY}-plans`) ?? "{}")));
        } catch { /* A damaged plan must not affect collected progress. */ }
    }, []);

    useEffect(() => {
        if (hasLoaded) window.localStorage.setItem(`${STORAGE_KEY}-plans`, JSON.stringify(plans));
    }, [hasLoaded, plans]);

    useEffect(() => {
        if (hasLoaded) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        }
    }, [hasLoaded, progress]);

    useCompactEditor(mobileEditorOpen && !bulkMode, progressEditorRef, () => setMobileEditorOpen(false));

    const monsters = useMemo(
        () => GENERATED_MONSTERS
            .filter((monster) => monster.id !== "icearia")
            .sort((a, b) => a.indexPosition - b.indexPosition),
        [],
    );

    const totals = useMemo(() => {
        const score = monsters.reduce((sum, monster) => sum + scoreFor(progress[monster.id]), 0);
        const collected = monsters.filter((monster) => Boolean(progress[monster.id]?.rank)).length;
        const complete = monsters.filter((monster) => scoreFor(progress[monster.id]) === 21).length;
        const missingMonster = monsters.filter((monster) => !progress[monster.id]?.rank).length;
        const missingBonuses = monsters.filter((monster) =>
            BONUSES.some((bonus) => !progress[monster.id]?.bonuses?.[bonus.id]),
        ).length;
        return { score, collected, complete, missingMonster, missingBonuses };
    }, [monsters, progress]);

    const visibleMonsters = useMemo(() => {
        const query = search.trim().toLowerCase();
        const filtered = monsters.filter((monster) => {
            if (query && !monster.name.toLowerCase().includes(query)) return false;
            if (bulkMode && !showBulkHidden && bulkHiddenIds.has(monster.id)) return false;
            const monsterProgress = progress[monster.id];
            if (genderFilter !== "all" && monsterProgress?.gender !== genderFilter) return false;
            if (rankFilter === "unranked" && monsterProgress?.rank) return false;
            if (rankFilter !== "all" && rankFilter !== "unranked" && monsterProgress?.rank !== rankFilter) return false;
            if (locationFilter !== "all" && !monster.sources.some((source) => source.location === locationFilter)) return false;
            const score = scoreFor(monsterProgress);
            if (filter === "incomplete") return score < 21;
            if (filter === "complete") return score === 21;
            if (filter === "missing-monster") return !monsterProgress?.rank;
            if (filter === "missing-bonuses") {
                return BONUSES.some((bonus) => !monsterProgress?.bonuses?.[bonus.id]);
            }
            return true;
        });

        return filtered.sort((a, b) => {
            const aScore = scoreFor(progress[a.id]);
            const bScore = scoreFor(progress[b.id]);
            if (sortBy === "missing-most") return (21 - bScore) - (21 - aScore) || a.indexPosition - b.indexPosition;
            if (sortBy === "closest") return (21 - aScore) - (21 - bScore) || a.indexPosition - b.indexPosition;
            if (sortBy === "score-high") return bScore - aScore || a.indexPosition - b.indexPosition;
            if (sortBy === "mutation") {
                return compareMutationPriority(progress[a.id], progress[b.id])
                    || bScore - aScore
                    || a.indexPosition - b.indexPosition;
            }
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return a.indexPosition - b.indexPosition;
        });
    }, [bulkHiddenIds, bulkMode, filter, genderFilter, locationFilter, monsters, progress, rankFilter, search, showBulkHidden, sortBy]);

    const displayedMonsters = visibleMonsters.slice(0, renderedMonsterCount);
    const hasMoreMonsters = renderedMonsterCount < visibleMonsters.length;
    const bulkSelectableVisibleMonsters = visibleMonsters.filter((monster) => !bulkHiddenIds.has(monster.id));

    useEffect(() => {
        setRenderedMonsterCount(INITIAL_MONSTER_BATCH);
    }, [bulkMode, filter, genderFilter, locationFilter, rankFilter, search, showBulkHidden, sortBy, viewMode]);

    useEffect(() => {
        if (!hasMoreMonsters || !loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                setRenderedMonsterCount((current) => Math.min(current + MONSTER_BATCH_SIZE, visibleMonsters.length));
            },
            { rootMargin: "800px 0px" },
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMoreMonsters, visibleMonsters.length]);

    const selectedMonster = monsters.find((monster) => monster.id === selectedId) ?? monsters[0];
    const selectedProgress = selectedMonster ? progress[selectedMonster.id] : undefined;
    const selectedScore = scoreFor(selectedProgress);
    const selectedMissingBonuses = BONUSES.filter((bonus) => !selectedProgress?.bonuses?.[bonus.id]);
    const selectedMissingBonusPoints = selectedMissingBonuses.reduce((sum, bonus) => sum + bonus.points, 0);
    const selectedRankPoints = selectedProgress?.rank ? RANK_POINTS[selectedProgress.rank] : 0;
    const selectedRankPointsRemaining = RANK_POINTS.SS - selectedRankPoints;

    const updateSelected = (next: MonsterProgress) => {
        if (!selectedMonster) return;
        setProgress((current) => ({ ...current, [selectedMonster.id]: next }));
    };

    const setRank = (rank?: Rank) => {
        updateSelected({ ...selectedProgress, rank, bonuses: selectedProgress?.bonuses ?? emptyBonuses() });
    };

    const setGender = (gender?: Gender) => {
        updateSelected({ ...selectedProgress, gender });
    };

    const toggleBonus = (bonusId: BonusId) => {
        updateSelected({
            ...selectedProgress,
            rank: selectedProgress?.rank,
            bonuses: {
                ...selectedProgress?.bonuses,
                [bonusId]: !selectedProgress?.bonuses?.[bonusId],
            },
        });
    };

    const markAllBonuses = () => {
        updateSelected({
            ...selectedProgress,
            rank: "SS",
            bonuses: Object.fromEntries(BONUSES.map((bonus) => [bonus.id, true])) as Record<BonusId, boolean>,
        });
    };

    const resetSelected = () => {
        if (!selectedMonster) return;
        setProgress((current) => {
            const next = { ...current };
            delete next[selectedMonster.id];
            return next;
        });
    };

    const toggleBulkSelection = (monsterId: string) => {
        setBulkSelectedIds((current) => {
            const next = new Set(current);
            if (next.has(monsterId)) next.delete(monsterId);
            else next.add(monsterId);
            return next;
        });
    };

    const setBulkModeActive = (active: boolean) => {
        setBulkMode(active);
        setBulkSelectedIds(new Set());
        setBulkHiddenIds(new Set());
        setShowBulkHidden(false);
        setHideBulkAfterApply(true);
        setBulkRankAction("keep");
        setBulkGenderAction("keep");
        setBulkBonusActions(emptyBulkBonusActions());
        setMobileEditorOpen(false);
        setImportMessage(null);
    };

    const hideBulkMonster = (monsterId: string) => {
        setBulkHiddenIds((current) => {
            const next = new Set(current);
            next.add(monsterId);
            return next;
        });
        setBulkSelectedIds((current) => {
            const next = new Set(current);
            next.delete(monsterId);
            return next;
        });
    };

    const unhideBulkMonster = (monsterId: string) => {
        setBulkHiddenIds((current) => {
            const next = new Set(current);
            next.delete(monsterId);
            return next;
        });
    };

    const hideBulkSelected = () => {
        const selectedIds = Array.from(bulkSelectedIds);
        if (selectedIds.length === 0) return;
        setBulkHiddenIds((current) => new Set([...current, ...selectedIds]));
        setBulkSelectedIds(new Set());
        setImportMessage({ tone: "success", text: `Hidden ${selectedIds.length} monster${selectedIds.length === 1 ? "" : "s"} for this bulk-edit session.` });
    };

    const restoreBulkHidden = () => {
        setBulkHiddenIds(new Set());
        setShowBulkHidden(false);
        setImportMessage({ tone: "success", text: "All hidden monsters are visible again." });
    };

    const hasBulkChanges = bulkRankAction !== "keep" || bulkGenderAction !== "keep"
        || BONUSES.some((bonus) => bulkBonusActions[bonus.id] !== "keep");

    const applyBulkChanges = () => {
        const selectedIds = Array.from(bulkSelectedIds);
        if (selectedIds.length === 0 || !hasBulkChanges) return;

        setProgress((current) => {
            const next = { ...current };
            selectedIds.forEach((monsterId) => {
                const existing = current[monsterId] ?? {};
                const rank = bulkRankAction === "keep"
                    ? existing.rank
                    : bulkRankAction === "clear"
                        ? undefined
                        : bulkRankAction;
                const bonuses = { ...existing.bonuses };
                const gender = bulkGenderAction === "keep"
                    ? existing.gender
                    : bulkGenderAction === "clear"
                        ? undefined
                        : bulkGenderAction;

                BONUSES.forEach((bonus) => {
                    const action = bulkBonusActions[bonus.id];
                    if (action === "add") bonuses[bonus.id] = true;
                    if (action === "remove") delete bonuses[bonus.id];
                });

                if (!rank && !gender && Object.keys(bonuses).length === 0) delete next[monsterId];
                else next[monsterId] = { rank, bonuses, gender };
            });
            return next;
        });

        if (hideBulkAfterApply) {
            setBulkHiddenIds((current) => new Set([...current, ...selectedIds]));
        }
        setBulkSelectedIds(new Set());
        setBulkRankAction("keep");
        setBulkGenderAction("keep");
        setBulkBonusActions(emptyBulkBonusActions());
        setImportMessage({
            tone: "success",
            text: `Bulk changes applied to ${selectedIds.length} monster${selectedIds.length === 1 ? "" : "s"}${hideBulkAfterApply ? " and hidden from this session" : ""}.`,
        });
    };

    const clearAllProgress = () => {
        setProgress({});
        setMobileEditorOpen(false);
        setShowClearConfirmation(false);
        setImportMessage({ tone: "success", text: "All monster ranks and bonuses were cleared." });
    };

    const exportTracker = () => {
        const payload = {
            app: "Cam Lab Index Tracker",
            version: 3,
            exportedAt: new Date().toISOString(),
            progress,
            plans,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `cam-lab-index-tracker-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setImportMessage({ tone: "success", text: "Tracker backup exported." });
    };

    const importTracker = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const parsed = JSON.parse(await file.text()) as { version?: unknown; progress?: unknown; plans?: unknown };
            if ((parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3) || !parsed.progress || typeof parsed.progress !== "object" || Array.isArray(parsed.progress)) {
                throw new Error("Invalid tracker backup");
            }

            const monsterIds = new Set(monsters.map((monster) => monster.id));
            const imported: TrackerProgress = {};
            Object.entries(parsed.progress).forEach(([monsterId, value]) => {
                if (!monsterIds.has(monsterId) || !value || typeof value !== "object" || Array.isArray(value)) return;
                const candidate = value as { rank?: unknown; bonuses?: unknown; gender?: unknown };
                const rank = typeof candidate.rank === "string" && RANKS.includes(candidate.rank as Rank)
                    ? candidate.rank as Rank
                    : undefined;
                const bonuses: Partial<Record<BonusId, boolean>> = {};
                const gender = candidate.gender === "male" || candidate.gender === "female" ? candidate.gender : undefined;
                if (candidate.bonuses && typeof candidate.bonuses === "object" && !Array.isArray(candidate.bonuses)) {
                    BONUSES.forEach((bonus) => {
                        if ((candidate.bonuses as Record<string, unknown>)[bonus.id] === true) bonuses[bonus.id] = true;
                    });
                }
                if (rank || gender || Object.keys(bonuses).length > 0) imported[monsterId] = { rank, bonuses, gender };
            });

            setProgress(imported);
            if (parsed.version === 3) setPlans(sanitizePlans(parsed.plans));
            setImportMessage({ tone: "success", text: `Imported progress for ${Object.keys(imported).length} monsters.` });
        } catch {
            setImportMessage({ tone: "error", text: "That file is not a valid Cam Lab tracker backup." });
        } finally {
            event.target.value = "";
        }
    };

    const filters: Array<{ id: Filter; label: string; count: number }> = [
        { id: "all", label: "All", count: monsters.length },
        { id: "incomplete", label: "Incomplete", count: monsters.length - totals.complete },
        { id: "complete", label: "Complete", count: totals.complete },
        { id: "missing-monster", label: "Missing Monster", count: totals.missingMonster },
        { id: "missing-bonuses", label: "Missing Bonuses", count: totals.missingBonuses },
    ];

    return (
        <main className="mx-auto w-full max-w-[1800px] px-3 py-5 sm:px-5 lg:px-6">
            <section className="mb-5 grid gap-4 xl:grid-cols-[1fr_560px]">
                <div>
                    <PageHeading title="Index Tracker" image="/icons/index.png">Track every monster and maximize your <span className="text-[#ffd53d]">Index Score.</span></PageHeading>

                    <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                        <SummaryCard label="Current Score" labelTone="text-[#32b5ff]" value={totals.score.toLocaleString()} detail={<span className="inline-flex items-center gap-1">of <span title={`${(monsters.length * 21).toLocaleString()} total points`} className="grid size-4 place-items-center rounded-full border border-[#6e7c90] text-[10px] font-bold text-[#c7d0dd]">?</span> (Max Possible)</span>} tone="text-[#28b9ff]" />
                        <SummaryCard label="Monsters" labelTone="text-[#b6ed42]" value={`${totals.collected} / ${monsters.length}`} detail={`${Math.round((totals.collected / Math.max(monsters.length, 1)) * 100)}% Collected`} tone="text-[#43ed65]" progress={(totals.collected / Math.max(monsters.length, 1)) * 100} />
                        <SummaryCard label="Average Index" labelTone="text-[#cf62ff]" value={(totals.score / Math.max(monsters.length, 1)).toFixed(1)} detail="out of 21" tone="text-[#c95cff]" />
                        <SummaryCard label="Points Remaining" labelTone="text-[#ffd84a]" value={(monsters.length * 21 - totals.score).toLocaleString()} detail="available points" tone="text-[#ffae34]" />
                    </div>
                </div>

                <aside className="rounded-xl border border-[#21445a] bg-[#0a1a25] p-4 shadow-[inset_0_0_24px_rgba(26,153,255,0.06)]">
                    <h2 className="text-sm font-bold uppercase text-[#32aaff]">How Index Score Works</h2>
                    <p className="mt-2 text-sm text-[#dbe1ea]">Your highest rank gives base points:</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-base font-black">
                        {RANKS.slice().reverse().map((rank) => <span key={rank} className={rankTone(rank)} style={rankLabelStyle(rank)}>{rank}: <span className="text-white">{RANK_POINTS[rank]}</span></span>)}
                    </div>
                    <p className="mt-4 text-sm text-[#dbe1ea]">Mutations add extra points:</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {BONUSES.map((bonus) => (
                            <span key={bonus.id} className="flex items-center gap-2 text-sm text-white">
                                <img src={assetPath(bonus.icon)} alt="" className="size-7 object-contain" />
                                {bonus.label} <b className="text-[#ffd84a]">+{bonus.points}</b>
                            </span>
                        ))}
                    </div>
                </aside>
            </section>

            <div className="mb-4 flex gap-2" aria-label="Tracker mode">
                {([false, true] as const).map((planning) => <button key={String(planning)} type="button" aria-pressed={planningMode === planning} onClick={() => { setPlanningMode(planning); setBulkModeActive(false); }} className={`rounded-lg border px-4 py-2 text-sm font-bold ${planningMode === planning ? "border-[#2eacff] bg-[#123653] text-white" : "border-[#344050] bg-[#0b141e] text-[#aeb8c8]"}`}>{planning ? "Planning" : "Collected"}</button>)}
            </div>
            {planningMode ? <IndexPlanner monsters={monsters} progress={progress} plans={plans} setPlans={setPlans} onAchieved={(id) => {
                setProgress((current) => ({ ...current, [id]: plannedProgress(current[id], plans[id]) }));
                setPlans((current) => { const next = { ...current }; delete next[id]; return next; });
            }} /> : <>
            <TrackerToolbar search={search} setSearch={setSearch} genderFilter={genderFilter} setGenderFilter={setGenderFilter} rankFilter={rankFilter} setRankFilter={setRankFilter} locationFilter={locationFilter} setLocationFilter={setLocationFilter} filter={filter} setFilter={setFilter} statusOptions={filters} sortBy={sortBy} setSortBy={setSortBy} bulkMode={bulkMode} onToggleBulk={() => setBulkModeActive(!bulkMode)} viewMode={viewMode} setViewMode={setViewMode} />

            {bulkMode && (
                <section className="mb-4 rounded-xl border border-[#237bb0] bg-[#0a1925] p-4 shadow-[inset_0_0_24px_rgba(34,170,255,0.06)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#35b5ff]">Bulk Edit</p>
                            <h2 className="mt-1 text-lg font-black text-white">{bulkSelectedIds.size} monster{bulkSelectedIds.size === 1 ? "" : "s"} selected</h2>
                            <p className="mt-1 text-xs text-[#9eabbc]">Click monster cards to select them, then choose only the changes you want to apply.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setBulkSelectedIds(new Set(bulkSelectableVisibleMonsters.map((monster) => monster.id)))} disabled={bulkSelectableVisibleMonsters.length === 0} className="rounded-md border border-[#3d627d] bg-[#12283a] px-3 py-2 text-xs font-semibold text-white hover:border-[#35b5ff] disabled:cursor-not-allowed disabled:opacity-40">Select All Results ({bulkSelectableVisibleMonsters.length})</button>
                            <button type="button" onClick={hideBulkSelected} disabled={bulkSelectedIds.size === 0} className="rounded-md border border-[#725b3d] bg-[#2a2114] px-3 py-2 text-xs font-semibold text-[#ffd98a] hover:border-[#e9a93d] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Hide Selected</button>
                            {bulkHiddenIds.size > 0 && <button type="button" onClick={() => setShowBulkHidden((current) => !current)} className="rounded-md border border-[#4b5672] bg-[#191d2c] px-3 py-2 text-xs font-semibold text-[#cbd5ff] hover:border-[#7c8ee8] hover:text-white">{showBulkHidden ? "Hide Hidden" : `Show Hidden (${bulkHiddenIds.size})`}</button>}
                            {bulkHiddenIds.size > 0 && <button type="button" onClick={restoreBulkHidden} className="rounded-md border border-[#3f6452] bg-[#11271d] px-3 py-2 text-xs font-semibold text-[#9ee8bd] hover:border-[#55c985] hover:text-white">Restore Hidden</button>}
                            <button type="button" onClick={() => setBulkSelectedIds(new Set())} disabled={bulkSelectedIds.size === 0} className="rounded-md border border-[#485769] bg-[#18222e] px-3 py-2 text-xs font-semibold text-[#d0d8e3] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Clear Selection</button>
                        </div>
                    </div>

                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#304356] bg-[#0d1822] px-3 py-2 text-xs font-semibold text-[#d5dde8]">
                        <input type="checkbox" checked={hideBulkAfterApply} onChange={(event) => setHideBulkAfterApply(event.target.checked)} className="size-4 accent-[#168fff]" />
                        Hide updated monsters after Apply
                        <span className="font-normal text-[#7f8b9e]">(temporary)</span>
                    </label>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                        <label className="rounded-md border border-[#304356] bg-[#0d1822] px-3 py-2">
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-[#f5cc3f]">Highest Rank</span>
                            <select value={bulkRankAction} onChange={(event) => setBulkRankAction(event.target.value as BulkRankAction)} style={{ colorScheme: "dark" }} className="mt-1 w-full bg-transparent text-sm font-semibold text-white outline-none">
                                <option value="keep" className="bg-[#0d1822] text-white">Keep current</option>
                                {RANKS.map((rank) => <option key={rank} value={rank} className="bg-[#0d1822] text-white">Set to {rank}</option>)}
                                <option value="clear" className="bg-[#0d1822] text-white">Clear rank</option>
                            </select>
                        </label>
                        <label className="flex items-center gap-2 rounded-md border border-[#304356] bg-[#0d1822] px-3 py-2">
                            <span className="grid size-8 place-items-center rounded-full border border-[#7b4f75] bg-[#231726] text-lg font-black text-[#ff7ca0]">⚥</span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[10px] font-bold uppercase tracking-wide text-[#cbd4e0]">Gender</span>
                                <select value={bulkGenderAction} onChange={(event) => setBulkGenderAction(event.target.value as BulkGenderAction)} style={{ colorScheme: "dark" }} className="mt-1 w-full bg-transparent text-sm font-semibold text-white outline-none">
                                    <option value="keep" className="bg-[#0d1822] text-white">Keep</option>
                                    <option value="female" className="bg-[#0d1822] text-white">Set Female</option>
                                    <option value="male" className="bg-[#0d1822] text-white">Set Male</option>
                                    <option value="clear" className="bg-[#0d1822] text-white">Clear</option>
                                </select>
                            </span>
                        </label>
                        {BONUSES.map((bonus) => (
                            <label key={bonus.id} className="flex items-center gap-2 rounded-md border border-[#304356] bg-[#0d1822] px-3 py-2">
                                <img src={assetPath(bonus.icon)} alt="" className="size-8 object-contain" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-[#cbd4e0]">{bonus.label}</span>
                                    <select value={bulkBonusActions[bonus.id]} onChange={(event) => setBulkBonusActions((current) => ({ ...current, [bonus.id]: event.target.value as BulkBonusAction }))} style={{ colorScheme: "dark" }} className="mt-1 w-full bg-transparent text-sm font-semibold text-white outline-none">
                                        <option value="keep" className="bg-[#0d1822] text-white">Keep</option>
                                        <option value="add" className="bg-[#0d1822] text-white">Add</option>
                                        <option value="remove" className="bg-[#0d1822] text-white">Remove</option>
                                    </select>
                                </span>
                            </label>
                        ))}
                        <button type="button" onClick={applyBulkChanges} disabled={bulkSelectedIds.size === 0 || !hasBulkChanges} className="rounded-md border border-[#16a7ff] bg-gradient-to-r from-[#073c75] to-[#075fa6] px-4 py-3 text-sm font-bold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:border-[#405066] disabled:from-[#18222e] disabled:to-[#18222e] disabled:text-[#748094]">
                            Apply to {bulkSelectedIds.size || 0}
                        </button>
                    </div>
                    {importMessage && <p role="status" className={`mt-3 text-xs ${importMessage.tone === "success" ? "text-[#45ec72]" : "text-[#ff625a]"}`}>{importMessage.text}</p>}
                </section>
            )}

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <section>
                    {visibleMonsters.length > 0 ? (
                        <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
                            {displayedMonsters.map((monster) => {
                                const monsterProgress = progress[monster.id];
                                const score = scoreFor(monsterProgress);
                                const isHidden = bulkHiddenIds.has(monster.id);
                                const isComplete = score === 21;
                                const isSelected = bulkMode ? bulkSelectedIds.has(monster.id) : monster.id === selectedMonster?.id;
                                return (
                                    <div key={monster.id} className="cam-defer-card flex min-w-0 flex-col gap-1">
                                        <button type="button" disabled={bulkMode && isHidden} onClick={() => { if (bulkMode) toggleBulkSelection(monster.id); else { setSelectedId(monster.id); setMobileEditorOpen(true); } }} aria-pressed={isSelected} aria-label={bulkMode ? `${isSelected ? "Deselect" : "Select"} ${monster.name}` : `Edit ${monster.name}`} className={`group relative w-full flex-1 overflow-hidden rounded-lg border bg-gradient-to-b from-[#101b27] to-[#0b121a] p-3 text-left transition ${viewMode === "grid" ? "min-h-48" : "grid min-h-28 grid-cols-[90px_1fr] items-center gap-3"} ${isComplete ? "border-[#58f58b] shadow-[0_0_10px_rgba(62,238,119,0.48),0_0_28px_rgba(255,214,61,0.18),inset_0_0_22px_rgba(62,238,119,0.08)] hover:border-[#91ffb2] hover:shadow-[0_0_14px_rgba(62,238,119,0.6),0_0_34px_rgba(255,214,61,0.24),inset_0_0_24px_rgba(62,238,119,0.1)]" : isSelected ? "border-[#16a1ff] shadow-[0_0_14px_rgba(22,161,255,0.38)]" : "border-[#334153] hover:border-[#64809f]"} ${isHidden ? "opacity-40 grayscale" : ""}`}>
                                            {isComplete && !isHidden && (
                                                <>
                                                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_50%_42%,rgba(83,255,145,0.14),transparent_58%)]" />
                                                    <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#d9ff79] to-transparent opacity-90 shadow-[0_0_10px_rgba(217,255,121,0.9)]" />
                                                </>
                                            )}
                                            {bulkMode && <span aria-hidden="true" className={`absolute left-3 top-3 z-20 grid size-7 place-items-center rounded border text-sm font-black ${isSelected ? "border-[#2be577] bg-[#0c572b] text-white" : "border-[#738196] bg-[#091019] text-transparent"}`}>✓</span>}
                                            {bulkMode && isHidden && <span className="absolute left-12 top-3 z-20 rounded bg-[#1d2733] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c6cfdb]">Hidden</span>}
                                            <span className={`absolute ${bulkMode ? "left-12" : "left-3"} ${bulkMode && isHidden ? "top-10" : "top-2"} z-10 text-2xl font-black drop-shadow-[0_2px_2px_#000] ${rankTone(monsterProgress?.rank)}`} style={rankLabelStyle(monsterProgress?.rank)}>{monsterProgress?.rank ?? "—"}</span>
                                            {monsterProgress?.gender && (
                                                <img src={assetPath(GENDERS[monsterProgress.gender].icon)} alt={GENDERS[monsterProgress.gender].label} title={GENDERS[monsterProgress.gender].label} className="absolute right-11 top-2 z-10 size-8 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]" />
                                            )}
                                            <div className={`flex items-end justify-center ${viewMode === "grid" ? "h-32" : "h-24"}`}>
                                                {monster.image ? <img src={assetPath(monster.image)} alt="" loading="lazy" decoding="async" fetchPriority="low" className={`${viewMode === "grid" ? "max-h-32" : "max-h-24"} ${score === 0 ? "grayscale opacity-55" : ""} ${isComplete ? "drop-shadow-[0_0_10px_rgba(77,255,139,0.42)]" : "drop-shadow-[0_8px_8px_rgba(0,0,0,0.55)]"} w-full object-contain transition-all group-hover:scale-105`} /> : null}
                                            </div>
                                            <div className="mt-1 flex items-end justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-white">{monster.name}</p>
                                                    <p className={`mt-1 font-black ${isComplete ? "text-[#5cff8d] drop-shadow-[0_0_6px_rgba(92,255,141,0.45)]" : "text-[#ffb138]"}`}>{score} <span className={`font-normal ${isComplete ? "text-[#c6ffd7]" : "text-[#8e99ad]"}`}>/ 21</span></p>
                                                </div>
                                                <div className={`absolute right-2 top-2 z-10 flex gap-1 ${viewMode === "grid" ? "flex-col" : "flex-row"}`}>
                                                    {BONUSES.map((bonus) => {
                                                        const isActive = Boolean(monsterProgress?.bonuses?.[bonus.id]);
                                                        return (
                                                            <span key={bonus.id} title={`${bonus.label}${isActive ? " completed" : " missing"}`} className={`grid size-7 place-items-center rounded border bg-[#080d13] p-0.5 ${isActive ? "border-[#35ef76] shadow-[0_0_6px_rgba(53,239,118,0.38)]" : "border-[#566273] opacity-40 grayscale"}`}>
                                                                <img src={assetPath(bonus.icon)} alt={bonus.label} className="size-full object-contain" />
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            {score < 21 && viewMode === "grid" && <span className="absolute bottom-3 right-11 text-[10px] text-[#ff625a]">{21 - score} missing</span>}
                                            <img src={assetPath(`/element-icons/${monster.element.toLowerCase()}.png`)} alt={monster.element} title={monster.element} className="absolute bottom-2 right-2 size-7 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.75)]" />
                                        </button>
                                        {bulkMode && (
                                            <button type="button" onClick={() => { if (isHidden) unhideBulkMonster(monster.id); else hideBulkMonster(monster.id); }} className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition ${isHidden ? "border-[#3f6452] bg-[#11271d] text-[#9ee8bd] hover:border-[#55c985] hover:text-white" : "border-[#4b5564] bg-[#141c26] text-[#9faaba] hover:border-[#d0933c] hover:text-[#ffd98a]"}`}>
                                                {isHidden ? "↩ Unhide" : "Hide"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-[#344050] px-6 py-16 text-center text-sm text-[#8e99ad]">No monsters match this search and filter.</div>
                    )}
                    {hasMoreMonsters && (
                        <div ref={loadMoreRef} className="flex min-h-24 items-center justify-center py-5" aria-hidden="true">
                            <div className="flex items-center gap-2 rounded-full border border-[#304356] bg-[#0d1822] px-3 py-2 text-[11px] font-semibold text-[#8391a6]">
                                <span className="size-3 animate-spin rounded-full border-2 border-[#41536b] border-t-[#2eacff]" />
                                Loading more monsters…
                            </div>
                        </div>
                    )}
                </section>

                {!bulkMode && selectedMonster && mobileEditorOpen && <button type="button" aria-label="Close monster progress" onClick={() => setMobileEditorOpen(false)} className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm xl:hidden" />}

                {!bulkMode && selectedMonster && (
                    <aside ref={progressEditorRef} tabIndex={-1} role="dialog" aria-label={`${selectedMonster.name} index progress`} className={`${mobileEditorOpen ? "fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-[480px] max-h-[85dvh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain" : "hidden"} rounded-xl border border-[#344050] bg-[#0b141e] p-4 shadow-2xl xl:sticky xl:inset-auto xl:top-4 xl:z-auto xl:block xl:w-auto xl:max-w-none xl:translate-x-0 xl:translate-y-0 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto`}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[#2eacff]">Monster Progress</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`text-2xl font-black ${rankTone(selectedProgress?.rank)}`} style={rankLabelStyle(selectedProgress?.rank)}>{selectedProgress?.rank ?? "—"}</span>
                                    <h2 className="text-2xl font-black text-white">{selectedMonster.name}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-2xl font-black text-[#ffb138]">{selectedScore} <span className="text-base text-[#9aa5b6]">/ 21</span></p>
                                    {selectedScore < 21 && <p className="mt-0.5 text-xs text-[#ff625a]">{21 - selectedScore} missing</p>}
                                </div>
                                <button type="button" onClick={() => setMobileEditorOpen(false)} aria-label="Close monster progress" className="grid size-9 place-items-center rounded-md border border-[#405066] bg-[#17222e] text-xl text-[#aeb8c8] hover:text-white xl:hidden">×</button>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-[100px_1fr] gap-4 border-b border-[#2a3543] pb-4">
                            <div className="grid h-28 place-items-end overflow-hidden rounded-lg border border-[#405066] bg-[#111c28] p-1">
                                {selectedMonster.image ? <img src={assetPath(selectedMonster.image)} alt={selectedMonster.name} className={`max-h-full object-contain ${selectedScore === 0 ? "grayscale opacity-55" : ""}`} /> : null}
                            </div>
                            <div>
                                <p className="mb-2 text-sm text-[#cbd3df]">Highest Rank</p>
                                <div className="flex flex-wrap gap-1">
                                    {RANKS.map((rank) => (
                                        <button key={rank} type="button" onClick={() => setRank(rank)} className={`min-w-9 rounded border px-2 py-2 text-sm font-black ${selectedProgress?.rank === rank ? "border-[#ff5757] bg-[#6c2025]" : "border-[#415065] bg-[#131d28] hover:border-[#7182ff]"}`}><span className={rankTone(rank)} style={rankLabelStyle(rank)}>{rank}</span></button>
                                    ))}
                                </div>
                                <p className="mt-3 flex items-center gap-2 text-sm text-[#f5cc3f]"><img src={assetPath("/icons/index.png")} alt="" className="size-7 object-contain" />Rank Points: <b className="text-lg">{selectedRankPoints}</b></p>
                            </div>
                        </div>

                        <div className="border-b border-[#2a3543] py-4">
                            <h3 className="text-sm font-bold uppercase text-[#2eacff]">Breeding Gender</h3>
                            <p className="mt-1 text-xs text-[#8f9bad]">Track the gender of this monster for breeding.</p>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setGender(undefined)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${!selectedProgress?.gender ? "border-[#8a97a8] bg-[#273241] text-white" : "border-[#405066] bg-[#141d27] text-[#9da8b8]"}`}>Unset</button>
                                {(["female", "male"] as const).map((gender) => (
                                    <button key={gender} type="button" onClick={() => setGender(gender)} className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-bold ${selectedProgress?.gender === gender ? GENDERS[gender].tone : "border-[#405066] bg-[#141d27] text-[#b4bdca] hover:border-[#7182a0]"}`}>
                                        <img src={assetPath(GENDERS[gender].icon)} alt="" className="size-6 object-contain" />
                                        {GENDERS[gender].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h3 className="mt-4 text-sm font-bold uppercase text-[#2eacff]">Bonus Points</h3>
                        <div className="mt-2 grid gap-2">
                            {BONUSES.map((bonus) => {
                                const checked = Boolean(selectedProgress?.bonuses?.[bonus.id]);
                                return (
                                    <button key={bonus.id} type="button" onClick={() => toggleBonus(bonus.id)} className="flex items-center gap-3 rounded-md border border-[#304356] bg-[#0d1822] px-3 py-2.5 text-left transition hover:border-[#52708e] hover:bg-[#111f2c]">
                                        <img src={assetPath(bonus.icon)} alt="" className="size-9 object-contain" />
                                        <span className="flex-1 font-semibold text-white">{bonus.label}</span>
                                        <span className="text-sm text-[#d3dae5]">+{bonus.points} Points</span>
                                        <span className={`grid size-7 place-items-center rounded border text-base font-black ${checked ? "border-[#28e86b] bg-[#0d3c20] text-[#35ef76]" : "border-[#697486] bg-[#080d13] text-transparent"}`}>✓</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 rounded-md border border-[#738092] bg-[#080f16] px-3 py-3 text-center text-sm text-[#dce2eb]">
                            {selectedScore === 21 ? (
                                <span className="font-bold text-[#3bea72]">Index complete — 21 / 21</span>
                            ) : (
                                <div className="space-y-1">
                                    {selectedMissingBonuses.length > 0 && <p>Missing <b className="text-[#ff625a]">{selectedMissingBonuses.length}</b> bonus{selectedMissingBonuses.length === 1 ? "" : "es"} <span className="text-[#d65bff]">({selectedMissingBonuses.map((bonus) => bonus.label).join(", ")})</span> to reach <b>21 / 21</b></p>}
                                    {selectedRankPointsRemaining > 0 && <p className="text-[#f5cc3f]">SS rank adds +{selectedRankPointsRemaining} rank points</p>}
                                    <p className="text-base font-bold text-[#cf55ff]">+{selectedMissingBonusPoints + selectedRankPointsRemaining} points available</p>
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={() => setMobileEditorOpen(false)} className="sticky bottom-0 z-10 mt-4 w-full rounded-md border border-[#4d9dff] bg-gradient-to-r from-[#315ee8] to-[#168fff] px-4 py-3 text-base font-black text-white shadow-[0_-8px_24px_rgba(11,20,30,0.9),0_8px_20px_rgba(22,143,255,0.24)] hover:brightness-110 xl:hidden">
                            Apply Changes
                        </button>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button type="button" onClick={markAllBonuses} className="flex items-center justify-center gap-2 rounded-md border border-[#405066] bg-[#18222e] px-3 py-2.5 text-sm font-semibold text-[#d2d9e4] hover:border-[#16a7ff] hover:text-white"><span className="grid size-5 place-items-center rounded-full border border-[#657287] text-xs font-black text-[#b9c3d1]">✓</span>Mark All Bonuses</button>
                            <button type="button" onClick={resetSelected} className="rounded-md border border-[#405066] bg-[#18222e] px-3 py-2.5 text-sm font-semibold text-[#d2d9e4] hover:text-white">↻ Reset</button>
                        </div>
                    </aside>
                )}
            </div>

            </>}

            <section className="mt-5 flex flex-col gap-3 rounded-lg border border-[#254159] bg-[#0b1a26] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-[#cad3df]"><span className="font-bold text-[#ffd84a]">Tip:</span> Your tracker saves automatically in this browser. Export a backup before clearing browser data.</p>
                    {importMessage && <p role="status" className={`mt-1 text-xs ${importMessage.tone === "success" ? "text-[#45ec72]" : "text-[#ff625a]"}`}>{importMessage.text}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <button type="button" onClick={exportTracker} className="rounded-md border border-[#405b70] bg-[#132536] px-4 py-2 text-sm font-semibold text-white hover:border-[#2eacff]">⇧ Export Tracker</button>
                    <button type="button" onClick={() => importInputRef.current?.click()} className="rounded-md border border-[#405b70] bg-[#132536] px-4 py-2 text-sm font-semibold text-white hover:border-[#2eacff]">⇩ Import Tracker</button>
                    <button type="button" onClick={() => setShowClearConfirmation(true)} className="rounded-md border border-[#8c3941] bg-[#35151a] px-4 py-2 text-sm font-semibold text-[#ff8b94] hover:border-[#ff5965] hover:bg-[#4a1a20] hover:text-white">Clear All Monsters</button>
                    <input ref={importInputRef} type="file" accept="application/json,.json" onChange={importTracker} className="hidden" />
                </div>
            </section>

            {showClearConfirmation && (
                <div className="fixed inset-0 z-[100] grid place-items-center px-4">
                    <button type="button" aria-label="Cancel clearing all monsters" onClick={() => setShowClearConfirmation(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
                    <section role="alertdialog" aria-modal="true" aria-labelledby="clear-all-title" aria-describedby="clear-all-description" className="relative w-full max-w-md rounded-xl border border-[#8c3941] bg-[#0d151f] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.75)]">
                        <div className="flex items-start gap-3">
                            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full border border-[#a5454e] bg-[#3c171c] text-xl font-black text-[#ff6873]">!</span>
                            <div>
                                <h2 id="clear-all-title" className="text-xl font-black text-white">Are you sure?</h2>
                                <p id="clear-all-description" className="mt-2 text-sm leading-6 text-[#b8c2d1]">This will permanently clear every monster rank and bonus from this browser. Export a backup first if you may want to restore your progress.</p>
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setShowClearConfirmation(false)} className="rounded-md border border-[#405066] bg-[#18222e] px-3 py-2.5 text-sm font-semibold text-[#d2d9e4] hover:text-white">Cancel</button>
                            <button type="button" onClick={clearAllProgress} className="rounded-md border border-[#ff5965] bg-[#8f202a] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#b22834]">Yes, Clear Everything</button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

function SummaryCard({ label, value, detail, tone, labelTone, progress }: { label: string; value: string; detail: ReactNode; tone: string; labelTone: string; progress?: number }) {
    return (
        <div className="relative overflow-hidden rounded-lg border border-[#344b5e] bg-[#0c151e] px-3 py-3 text-center">
            <p className={`text-[11px] font-bold uppercase tracking-wide ${labelTone}`}>{label}</p>
            <p className={`mt-1 text-2xl font-black sm:text-3xl ${tone}`}>{value}</p>
            <p className="mt-1 flex min-h-4 items-center justify-center text-xs text-[#d6dce5]">{detail}</p>
            {progress !== undefined && (
                <span className="absolute inset-x-2 bottom-1 h-1 overflow-hidden rounded-full bg-[#15222c]">
                    <span className="block h-full rounded-full bg-[#13d853] transition-[width]" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
                </span>
            )}
        </div>
    );
}

function IndexPlanner({ monsters, progress, plans, setPlans, onAchieved }: {
    monsters: (typeof GENERATED_MONSTERS)[number][];
    progress: TrackerProgress;
    plans: TrackerProgress;
    setPlans: (update: (current: TrackerProgress) => TrackerProgress) => void;
    onAchieved: (id: string) => void;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const editorRef = useRef<HTMLElement>(null);
    const [query, setQuery] = useState("");
    const [plannedOnly, setPlannedOnly] = useState(false);
    const [location, setLocation] = useState<LocationFilter>("all");
    const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
    const [rankFilter, setRankFilter] = useState<RankFilter>("all");
    const [filter, setFilter] = useState<Filter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("index");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [bulkMode, setBulkMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    const [bulkRank, setBulkRank] = useState<BulkRankAction | "next">("keep");
    const [bulkGender, setBulkGender] = useState<BulkGenderAction>("keep");
    const [bulkBonuses, setBulkBonuses] = useState<Record<BonusId, BulkBonusAction>>(emptyBulkBonusActions);
    const [message, setMessage] = useState("");
    useCompactEditor(Boolean(editingId) && !bulkMode, editorRef, () => setEditingId(null));
    const hasPlan = (id: string) => gainFor(id) > 0 || Boolean(plans[id]?.gender && plans[id].gender !== progress[id]?.gender);
    const gainFor = (id: string) => scoreFor(plannedProgress(progress[id], plans[id])) - scoreFor(progress[id]);
    const pending = monsters.filter((monster) => hasPlan(monster.id));
    const gain = pending.reduce((sum, monster) => sum + gainFor(monster.id), 0);
    const currentScore = monsters.reduce((sum, monster) => sum + scoreFor(progress[monster.id]), 0);
    // Filter and sort by the projected state, falling back to collected values.
    const visible = monsters.filter((monster) => {
        const projected = plannedProgress(progress[monster.id], plans[monster.id]);
        const score = scoreFor(projected);
        return monster.name.toLowerCase().includes(query.trim().toLowerCase())
            && (!plannedOnly || hasPlan(monster.id))
            && (location === "all" || monster.sources.some((source) => source.location === location))
            && (genderFilter === "all" || projected.gender === genderFilter)
            && (rankFilter === "all" || (rankFilter === "unranked" ? !projected.rank : projected.rank === rankFilter))
            && (filter === "all" || (filter === "complete" ? score === 21 : filter === "incomplete" ? score < 21 : filter === "missing-monster" ? !projected.rank : BONUSES.some(({ id }) => !projected.bonuses?.[id])));
    }).sort((a, b) => {
        const ap = plannedProgress(progress[a.id], plans[a.id]);
        const bp = plannedProgress(progress[b.id], plans[b.id]);
        const as = scoreFor(ap), bs = scoreFor(bp);
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "missing-most") return as - bs || a.indexPosition - b.indexPosition;
        if (sortBy === "score-high") return bs - as || a.indexPosition - b.indexPosition;
        if (sortBy === "closest") return (as === 21 ? 22 : 21 - as) - (bs === 21 ? 22 : 21 - bs) || a.indexPosition - b.indexPosition;
        if (sortBy === "mutation") return compareMutationPriority(ap, bp) || a.indexPosition - b.indexPosition;
        return a.indexPosition - b.indexPosition;
    });
    const selectedVisible = visible.filter(({ id }) => selected.has(id));
    const writeTarget = (next: TrackerProgress, id: string, target: MonsterProgress) => {
        const owned = progress[id];
        const rank = target.rank && RANKS.indexOf(target.rank) > (owned?.rank ? RANKS.indexOf(owned.rank) : -1) ? target.rank : undefined;
        const gender = target.gender && target.gender !== owned?.gender ? target.gender : undefined;
        const bonuses = Object.fromEntries(BONUSES.filter(({ id: bonus }) => target.bonuses?.[bonus] && !owned?.bonuses?.[bonus]).map(({ id: bonus }) => [bonus, true]));
        if (rank || gender || Object.keys(bonuses).length) next[id] = { rank, bonuses, gender };
        else delete next[id];
    };
    const update = (id: string, target: MonsterProgress) => setPlans((current) => {
        const next = { ...current };
        writeTarget(next, id, target);
        return next;
    });
    const hasBulkChanges = bulkRank !== "keep" || bulkGender !== "keep" || BONUSES.some(({ id }) => bulkBonuses[id] !== "keep");
    const applyBulk = () => {
        if (!selectedVisible.length || !hasBulkChanges) return;
        setPlans((current) => {
            const next = { ...current };
            selectedVisible.forEach(({ id }) => {
                const target = current[id] ?? {};
                const owned = progress[id];
                const rank = bulkRank === "keep" ? target.rank : bulkRank === "clear" ? undefined : bulkRank === "next" ? RANKS[Math.min((owned?.rank ? RANKS.indexOf(owned.rank) : -1) + 1, RANKS.length - 1)] : bulkRank;
                const gender = bulkGender === "keep" ? target.gender : bulkGender === "clear" ? undefined : bulkGender;
                const bonuses = { ...target.bonuses };
                BONUSES.forEach(({ id: bonus }) => {
                    if (bulkBonuses[bonus] === "add") bonuses[bonus] = true;
                    if (bulkBonuses[bonus] === "remove") delete bonuses[bonus];
                });
                writeTarget(next, id, { rank, gender, bonuses });
            });
            return next;
        });
        setMessage(`Updated plans for ${selectedVisible.length} monsters. Collected progress is unchanged.`);
        setSelected(new Set());
        setBulkRank("keep"); setBulkGender("keep"); setBulkBonuses(emptyBulkBonusActions());
    };
    const control = "min-w-0 max-w-full rounded-md border border-[#405066] bg-[#131d28] px-3 py-2 text-sm text-white";
    return <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h2 className="text-sm font-bold uppercase tracking-wide text-[#32b5ff]">Upgrade plans</h2><p className="mt-1 text-xs text-[#aeb8c8]">{bulkMode ? "Click cards to select monsters, then apply shared goals below." : "Click a monster to edit its goals."}</p></div>
            <div className="flex flex-wrap gap-5 text-sm">
                <div className="text-[#aeb8c8]">Planned monsters<p className="text-xl font-black text-white">{pending.length}</p></div>
                <div className="text-[#aeb8c8]">Planned gain<p className="text-xl font-black text-[#ffd84a]">+{gain.toLocaleString()}</p></div>
                <div className="text-[#aeb8c8]">Projected score<p className="text-xl font-black text-[#32b5ff]">{(currentScore + gain).toLocaleString()}</p></div>
            </div>
        </div>
        <div className="mt-4">
            <TrackerToolbar search={query} setSearch={setQuery} genderFilter={genderFilter} setGenderFilter={setGenderFilter} rankFilter={rankFilter} setRankFilter={setRankFilter} locationFilter={location} setLocationFilter={setLocation} filter={filter} setFilter={setFilter} sortBy={sortBy} setSortBy={setSortBy} bulkMode={bulkMode} onToggleBulk={() => { setBulkMode(!bulkMode); setEditingId(null); setSelected(new Set()); setMessage(""); }} viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <div className="mb-3"><button type="button" aria-pressed={plannedOnly} onClick={() => setPlannedOnly(!plannedOnly)} className={`${control} ${plannedOnly ? "!border-[#2eacff] !bg-[#123653]" : ""}`}>Planned only ({pending.length})</button></div>
        <p className="mb-3 text-xs text-[#aeb8c8]">Blue + icons = planned · Green icons = collected · Filters use projected values.</p>
        {bulkMode && <div className="mb-4 rounded-xl border border-[#159fce] bg-[#0a1b27] p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2"><div className="mr-auto"><p className="text-[11px] font-bold uppercase text-[#32b5ff]">Bulk plan</p><b className="text-base text-white">{selectedVisible.length} monsters selected</b></div><button type="button" onClick={() => setSelected(new Set(visible.map(({ id }) => id)))} className={control}>Select all results ({visible.length})</button><button type="button" onClick={() => setSelected(new Set())} className={control}>Deselect all</button></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
                <label className="grid gap-1 rounded-md border border-[#304356] bg-[#0c1822] p-2 text-[10px] font-bold uppercase text-[#cbd3df]">Rank goal<select value={bulkRank} onChange={(event) => setBulkRank(event.target.value as BulkRankAction | "next")} className={control}><option value="keep">Keep unchanged</option><option value="next">Next collected rank</option><option value="clear">Remove rank goal</option>{RANKS.map((rank) => <option key={rank} value={rank}>{rank}</option>)}</select></label>
                <label className="grid gap-1 rounded-md border border-[#304356] bg-[#0c1822] p-2 text-[10px] font-bold uppercase text-[#cbd3df]">Gender goal<select value={bulkGender} onChange={(event) => setBulkGender(event.target.value as BulkGenderAction)} className={control}><option value="keep">Keep unchanged</option><option value="clear">Remove gender goal</option><option value="female">Female</option><option value="male">Male</option></select></label>
                {BONUSES.map((bonus) => <label key={bonus.id} className="grid gap-1 rounded-md border border-[#304356] bg-[#0c1822] p-2 text-[10px] font-bold uppercase text-[#cbd3df]"><span className="flex items-center gap-2"><img src={assetPath(bonus.icon)} alt="" className="size-5 object-contain" />{bonus.label}</span><select value={bulkBonuses[bonus.id]} onChange={(event) => setBulkBonuses((current) => ({ ...current, [bonus.id]: event.target.value as BulkBonusAction }))} className={control}><option value="keep">Keep unchanged</option><option value="add">Plan mutation</option><option value="remove">Remove goal</option></select></label>)}
                <button type="button" disabled={!selectedVisible.length || !hasBulkChanges} onClick={applyBulk} className="self-stretch min-h-12 rounded-md border border-[#2eacff] bg-[#145182] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Apply to {selectedVisible.length} plans</button>
            </div>
            <p className="mt-2 text-xs text-[#aeb8c8]">Applies only to selected monsters in the current results. Owned ranks and mutations are skipped.</p>

        </div>}
        {message && <p role="status" className="mb-3 text-sm text-[#80c998]">{message}</p>}
        <div className={`grid items-start gap-4 ${!bulkMode && editingId ? "xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
            <div className={`grid gap-2 ${viewMode === "list" ? "grid-cols-1" : !bulkMode && editingId ? "grid-cols-2 md:grid-cols-3 2xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"}`}>
                {visible.map((monster) => {
                    const owned = progress[monster.id] ?? {};
                    const target = plans[monster.id] ?? {};
                    const projected = plannedProgress(owned, target);
                    const gain = gainFor(monster.id);
                    const planned = hasPlan(monster.id);
                    const active = bulkMode ? selected.has(monster.id) : editingId === monster.id;
                    const rankGoal = projected.rank !== owned.rank;
                    const genderGoal = projected.gender !== owned.gender;
                    const goals = [rankGoal ? `${owned.rank ?? "—"} → ${projected.rank}` : "", ...BONUSES.filter(({ id }) => target.bonuses?.[id] && !owned.bonuses?.[id]).map(({ label }) => label), genderGoal && projected.gender ? GENDERS[projected.gender].label : ""].filter(Boolean);
                    return <button key={monster.id} type="button" aria-pressed={active} aria-label={`${bulkMode ? "Select" : "Edit plan for"} ${monster.name}${goals.length ? `: ${goals.join(", ")}` : ""}`} onClick={() => {
                        if (bulkMode) setSelected((current) => { const next = new Set(current); if (next.has(monster.id)) next.delete(monster.id); else next.add(monster.id); return next; });
                        else setEditingId(monster.id);
                    }} className={`group cam-defer-card relative min-w-0 overflow-hidden rounded-lg border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-[#2eacff] ${active ? "border-[#42baff] bg-[#123653] ring-2 ring-[#2eacff] shadow-[0_0_14px_#168fff33]" : planned ? "border-[#347dba] bg-[#0c1c2b] hover:border-[#64bfff]" : "border-[#344050] bg-[#0c141c] hover:border-[#68849e]"} ${viewMode === "list" ? "flex items-center gap-3" : ""}`}>
                        {bulkMode && active && <span className="absolute right-2 top-2 z-20 grid size-6 place-items-center rounded-full bg-[#2eacff] text-sm font-black text-white">✓</span>}
                        <span className={`${viewMode === "list" ? "w-16 shrink-0 text-lg" : "absolute left-3 top-2 z-10 text-2xl"} font-black`}><span className={rankTone(owned.rank)} style={rankLabelStyle(owned.rank)}>{owned.rank ?? "—"}</span>{rankGoal && <span className="block text-xs font-bold text-[#65c8ff]">→ {projected.rank}</span>}</span>
                        {monster.image && <img src={assetPath(monster.image)} alt="" loading="lazy" decoding="async" fetchPriority="low" className={`${viewMode === "list" ? "size-14 shrink-0" : "mx-auto h-28 w-full px-7"} object-contain drop-shadow-[0_6px_6px_#0008]`} />}
                        <div className={`${viewMode === "list" ? "min-w-0 flex-1" : "mt-2"}`}>
                            <h3 className="truncate text-sm font-bold text-white">{monster.name}</h3>
                            <p className="mt-1 text-xs text-[#9da8b8]"><b className="text-[#ffb138]">{scoreFor(owned)}</b>{gain > 0 && <span className="font-bold text-[#65c8ff]"> → {scoreFor(projected)}</span>} / 21 {gain > 0 && <b className="ml-1 text-[#ffd84a]">+{gain}</b>}</p>
                            <p title={goals.join(" · ")} className={`mt-1 truncate text-[11px] ${planned ? "text-[#65c8ff]" : "text-[#758394]"}`}>{goals.length ? goals.join(" · ") : "No plan"}</p>
                        </div>
                        <div className={`${viewMode === "list" ? "flex shrink-0 gap-1" : "absolute right-2 top-9 flex flex-col gap-1"}`}>
                            {BONUSES.map((bonus) => {
                                const isPlanned = target.bonuses?.[bonus.id] && !owned.bonuses?.[bonus.id];
                                const collected = owned.bonuses?.[bonus.id];
                                return <span key={bonus.id} title={`${bonus.label}: ${isPlanned ? "planned" : collected ? "collected" : "missing"}`} className={`relative grid size-6 place-items-center rounded border bg-[#080d13] p-0.5 ${isPlanned ? "border-[#42baff] shadow-[0_0_5px_#2eacff66]" : collected ? "border-[#35bd70]" : "border-[#344050] opacity-30 grayscale"}`}><img src={assetPath(bonus.icon)} alt={`${bonus.label} ${isPlanned ? "planned" : collected ? "collected" : "missing"}`} className="size-full object-contain" />{isPlanned && <b className="absolute -right-1 -top-1 rounded bg-[#1268a2] px-0.5 text-[9px] leading-3 text-white">+</b>}</span>;
                            })}
                        </div>
                        {projected.gender && <img src={assetPath(GENDERS[projected.gender].icon)} alt={`${genderGoal ? "Planned" : "Collected"} ${projected.gender}`} className={`${viewMode === "list" ? "size-6" : "absolute right-10 top-2 size-7"} object-contain ${genderGoal ? "rounded border border-[#42baff]" : "opacity-60"}`} />}
                    </button>;
                })}
            </div>
            {!bulkMode && editingId && <button type="button" aria-label="Close plan editor" onClick={() => setEditingId(null)} className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm xl:hidden" />}
            {!bulkMode && editingId && (() => {
                const monster = monsters.find(({ id }) => id === editingId);
                if (!monster) return null;
                const owned = progress[monster.id] ?? {};
                const target = plans[monster.id] ?? {};
                const gain = gainFor(monster.id);
                const currentRankIndex = owned.rank ? RANKS.indexOf(owned.rank) : -1;
                const targetRank = target.rank && RANKS.indexOf(target.rank) > currentRankIndex ? target.rank : "";
                return <aside ref={editorRef} tabIndex={-1} role="dialog" aria-labelledby="planning-editor-title" className="fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-[480px] max-h-[85dvh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-xl border border-[#344050] bg-[#0b141e] p-4 shadow-2xl xl:order-last xl:sticky xl:inset-auto xl:top-4 xl:z-auto xl:w-auto xl:max-w-none xl:translate-x-0 xl:translate-y-0 xl:max-h-[calc(100vh-2rem)]">
                    <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-[#32b5ff]">Monster plan</p><button type="button" aria-label="Close plan editor" onClick={() => setEditingId(null)} className="grid size-8 place-items-center rounded border border-[#405066] text-lg text-[#cbd3df]">×</button></div>
                    <div className="flex items-center gap-3">
                        {monster.image && <img src={assetPath(monster.image)} alt="" loading="lazy" decoding="async" fetchPriority="low" className="size-16 object-contain" />}
                        <div className="min-w-0 flex-1"><h3 id="planning-editor-title" className="font-bold text-white">{monster.name}</h3><p className="text-xs text-[#aeb8c8]">Collected: {owned.rank ?? "No rank"} · {scoreFor(owned)} / 21</p></div>
                        {gain > 0 && <span className="text-sm font-black text-[#ffd84a]">+{gain} points</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-[#cbd3df]">Target rank
                            <select aria-label={`${monster.name} target rank`} value={targetRank} onChange={(event) => update(monster.id, { ...target, rank: event.target.value ? event.target.value as Rank : undefined })} className={control}>
                                <option value="">No rank goal</option>{RANKS.filter((rank) => RANKS.indexOf(rank) > currentRankIndex).map((rank) => <option key={rank} value={rank}>{rank} (+{RANK_POINTS[rank] - (owned.rank ? RANK_POINTS[owned.rank] : 0)})</option>)}
                            </select>
                        </label>
                        {currentRankIndex < RANKS.length - 1 && <button type="button" onClick={() => update(monster.id, { ...target, rank: RANKS[currentRankIndex + 1] })} className={`${control} text-xs`}>Next rank</button>}
                    </div>
                    <div className="mt-3">
                        <p className="mb-2 text-xs text-[#aeb8c8]">Gender goal · Collected: {owned.gender ? GENDERS[owned.gender].label : "Unset"}</p>
                        <div className="flex flex-wrap gap-2"><button type="button" aria-pressed={!target.gender || target.gender === owned.gender} onClick={() => update(monster.id, { ...target, gender: undefined })} className={control}>No gender goal</button>{(["female", "male"] as const).map((gender) => <button key={gender} type="button" disabled={owned.gender === gender} aria-pressed={target.gender === gender && owned.gender !== gender} onClick={() => update(monster.id, { ...target, gender: target.gender === gender ? undefined : gender })} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${target.gender === gender || owned.gender === gender ? GENDERS[gender].tone : "border-[#405066] bg-[#131d28] text-[#b4bdca]"}`}><img src={assetPath(GENDERS[gender].icon)} alt="" className="size-5 object-contain" />{GENDERS[gender].label}{owned.gender === gender ? " ✓" : ""}</button>)}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {BONUSES.map((bonus) => {
                            const collected = Boolean(owned.bonuses?.[bonus.id]);
                            const planned = !collected && Boolean(target.bonuses?.[bonus.id]);
                            return <button key={bonus.id} type="button" disabled={collected} aria-pressed={planned} aria-label={`${monster.name}: ${bonus.label}, ${collected ? "collected" : planned ? "planned" : "not planned"}`} onClick={() => update(monster.id, { ...target, bonuses: { ...target.bonuses, [bonus.id]: !planned } })} className={`flex items-center gap-2 rounded-md border px-2 py-2 text-left text-xs ${collected ? "border-[#294a3b] bg-[#11251c] text-[#80c998]" : planned ? "border-[#2eacff] bg-[#123653] text-white" : "border-[#405066] bg-[#131d28] text-[#b4bdca]"}`}>
                                <img src={assetPath(bonus.icon)} alt="" className="size-6 object-contain" /><span>{bonus.label}<span className="block text-[10px]">{collected ? "✓ Collected" : planned ? `✓ Planned · +${bonus.points}` : `Plan · +${bonus.points}`}</span></span>
                            </button>;
                        })}
                    </div>
                    {hasPlan(monster.id) && <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={() => onAchieved(monster.id)} className="rounded-md border border-[#3eac6b] bg-[#153c28] px-3 py-2 text-sm font-bold text-[#a3f5bf]">Mark achieved</button><button type="button" onClick={() => update(monster.id, {})} className={control}>Remove plan</button><span className="text-xs text-[#aeb8c8]">Target: {scoreFor(owned) + gain} / 21</span></div>}
                    {scoreFor(owned) === 21 && <p className="mt-3 text-xs text-[#80c998]">Index complete</p>}

                </aside>;
            })()}
        </div>
        {visible.length === 0 && <p className="py-12 text-center text-sm text-[#aeb8c8]">{plannedOnly ? "No planned upgrades match. Switch off Planned only to choose monsters." : "No monsters match your search."}</p>}
    </section>;
}

function TrackerToolbar({ search, setSearch, genderFilter, setGenderFilter, rankFilter, setRankFilter, locationFilter, setLocationFilter, filter, setFilter, sortBy, setSortBy, bulkMode, onToggleBulk, viewMode, setViewMode, statusOptions = [
    { id: "all", label: "All" }, { id: "incomplete", label: "Incomplete" }, { id: "complete", label: "Complete" }, { id: "missing-monster", label: "Missing Monster" }, { id: "missing-bonuses", label: "Missing Bonuses" },
] }: {
    search: string; setSearch: (value: string) => void;
    genderFilter: GenderFilter; setGenderFilter: (value: GenderFilter) => void;
    rankFilter: RankFilter; setRankFilter: (value: RankFilter) => void;
    locationFilter: LocationFilter; setLocationFilter: (value: LocationFilter) => void;
    filter: Filter; setFilter: (value: Filter) => void;
    sortBy: SortOption; setSortBy: (value: SortOption) => void;
    bulkMode: boolean; onToggleBulk: () => void;
    viewMode: ViewMode; setViewMode: (value: ViewMode) => void;
    statusOptions?: Array<{ id: Filter; label: string; count?: number }>;
}) {
    return <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                    <label className="flex min-w-0 items-center rounded-md border border-[#344050] bg-[#0c131d] px-3 focus-within:border-[#168fff] w-full sm:min-w-56 sm:flex-1">
                        <span aria-hidden="true" className="text-[#7f8b9e]">⌕</span>
                        <input aria-label="Search monsters" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search monsters..." className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-[#677386]" />
                    </label>
                    <select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value as GenderFilter)} aria-label="Filter by gender" className="rounded-md border border-[#344050] bg-[#0c131d] px-3 py-2 text-sm text-[#d5dce6] outline-none focus:border-[#168fff]">
                        <option value="all">Gender: All</option>
                        <option value="female">Gender: Female</option>
                        <option value="male">Gender: Male</option>
                    </select>
                    <select value={rankFilter} onChange={(event) => setRankFilter(event.target.value as RankFilter)} aria-label="Filter by rank" className="rounded-md border border-[#344050] bg-[#0c131d] px-3 py-2 text-sm text-[#d5dce6] outline-none focus:border-[#168fff]">
                        <option value="all">Rank: All</option>
                        <option value="unranked">Rank: Unranked</option>
                        {RANKS.map((rank) => <option key={rank} value={rank}>Rank: {rank}</option>)}
                    </select>
                    <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value as LocationFilter)} aria-label="Filter by island" className="rounded-md border border-[#344050] bg-[#0c131d] px-3 py-2 text-sm text-[#d5dce6] outline-none focus:border-[#168fff]">
                        <option value="all">Island: All</option>
                        {ISLANDS.map((island) => <option key={island} value={island}>{island}</option>)}
                    </select>
                    <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} aria-label="Filter by status" className="min-w-0 rounded-md border border-[#344050] bg-[#0c131d] px-3 py-2 text-sm text-[#d5dce6] outline-none focus:border-[#168fff]">
                        {statusOptions.map((item) => <option key={item.id} value={item.id}>Status: {item.label}{item.count === undefined ? "" : ` (${item.count})`}</option>)}
                    </select>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} aria-label="Sort monsters" className="rounded-md border border-[#344050] bg-[#0c131d] px-3 py-2 text-sm text-[#d5dce6] outline-none focus:border-[#168fff]">
                        <option value="index">Sort: Index Order</option>
                        <option value="missing-most">Sort: Most Missing</option>
                        <option value="closest">Sort: Closest to Complete</option>
                        <option value="score-high">Sort: Highest Score</option>
                        <option value="mutation">Sort: Mutation Priority</option>
                        <option value="name">Sort: Name A–Z</option>
                    </select>
                    <button type="button" onClick={onToggleBulk} aria-pressed={bulkMode} className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${bulkMode ? "border-[#27bdff] bg-[#0d4771] text-white" : "border-[#405b70] bg-[#132536] text-[#d8e0ea] hover:border-[#2eacff] hover:text-white"}`}>
                        {bulkMode ? "Done Editing" : "Bulk Edit"}
                    </button>
                    <div className="grid grid-cols-2 rounded-md border border-[#344050] bg-[#0c131d] p-1" aria-label="View mode">
                        <button type="button" onClick={() => setViewMode("grid")} aria-label="Grid view" aria-pressed={viewMode === "grid"} className={`rounded px-3 py-1 text-sm ${viewMode === "grid" ? "bg-[#174a73] text-white" : "text-[#7f8b9e] hover:text-white"}`}>▦</button>
                        <button type="button" onClick={() => setViewMode("list")} aria-label="List view" aria-pressed={viewMode === "list"} className={`rounded px-3 py-1 text-sm ${viewMode === "list" ? "bg-[#174a73] text-white" : "text-[#7f8b9e] hover:text-white"}`}>☷</button>
                    </div>

    </div>;
}

// Both editors share narrow-screen scroll locking and keyboard behavior.
function useCompactEditor(open: boolean, ref: { current: HTMLElement | null }, onClose: () => void) {
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);
    useEffect(() => {
        if (!open) return;
        const media = window.matchMedia("(max-width: 1279px)");
        let release: (() => void) | undefined;
        const sync = () => {
            release?.();
            release = undefined;
            const panel = ref.current;
            if (!media.matches || !panel) return;
            const previousFocus = document.activeElement as HTMLElement | null;
            const previousOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            panel.setAttribute("aria-modal", "true");
            panel.focus({ preventScroll: true });
            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
                if (event.key !== "Tab") return;
                const controls = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter((element) => element.getClientRects().length > 0);
                const first = controls[0], last = controls[controls.length - 1];
                if (!first) { event.preventDefault(); panel.focus(); return; }
                if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) { event.preventDefault(); first.focus(); }
            };
            document.addEventListener("keydown", onKeyDown);
            release = () => {
                document.body.style.overflow = previousOverflow;
                panel.removeAttribute("aria-modal");
                document.removeEventListener("keydown", onKeyDown);
                if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
            };
        };
        sync();
        media.addEventListener("change", sync);
        return () => { release?.(); media.removeEventListener("change", sync); };
    }, [open, ref]);
}
