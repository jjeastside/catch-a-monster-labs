"use client";

import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { assetPath } from "../lib/asset-path";

const STORAGE_KEY = "cam-lab-index-tracker-v1";
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
    { id: "shiny", label: "Shiny", points: 2, icon: "/icons/Shiny.png" },
    { id: "bloodlit", label: "Bloodlit", points: 2, icon: "/icons/Bloodlit.png" },
    { id: "fairy", label: "Fairy", points: 2, icon: "/icons/Fairy.png" },
    { id: "huge", label: "Huge", points: 3, icon: "/icons/Huge.png" },
] as const;

type Rank = (typeof RANKS)[number];
type BonusId = (typeof BONUSES)[number]["id"];
type MonsterProgress = {
    rank?: Rank;
    bonuses?: Partial<Record<BonusId, boolean>>;
};
type TrackerProgress = Record<string, MonsterProgress>;
type Filter = "all" | "incomplete" | "complete" | "missing-monster" | "missing-bonuses";
type SortOption = "index" | "missing-most" | "closest" | "score-high" | "name";
type ViewMode = "grid" | "list";
type BulkRankAction = "keep" | "clear" | Rank;
type BulkBonusAction = "keep" | "add" | "remove";

function scoreFor(progress?: MonsterProgress) {
    const rankPoints = progress?.rank ? RANK_POINTS[progress.rank] : 0;
    const bonusPoints = BONUSES.reduce(
        (total, bonus) => total + (progress?.bonuses?.[bonus.id] ? bonus.points : 0),
        0,
    );
    return rankPoints + bonusPoints;
}

function rankTone(rank?: Rank) {
    if (rank === "SS") return "text-[#ff5757]";
    if (rank === "S") return "text-[#ffad32]";
    if (rank === "A") return "text-[#ffd84a]";
    if (rank === "B") return "text-[#d965ff]";
    if (rank === "C") return "text-[#55d7ff]";
    if (rank === "D") return "text-[#45ec72]";
    return "text-[#aeb8c8]";
}

function emptyBonuses(): Partial<Record<BonusId, boolean>> {
    return {};
}

function emptyBulkBonusActions(): Record<BonusId, BulkBonusAction> {
    return Object.fromEntries(BONUSES.map((bonus) => [bonus.id, "keep"])) as Record<BonusId, BulkBonusAction>;
}

export function IndexTracker() {
    const [progress, setProgress] = useState<TrackerProgress>({});
    const [hasLoaded, setHasLoaded] = useState(false);
    const [selectedId, setSelectedId] = useState(GENERATED_MONSTERS[0]?.id ?? "");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("index");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(() => new Set());
    const [bulkHiddenIds, setBulkHiddenIds] = useState<Set<string>>(() => new Set());
    const [showBulkHidden, setShowBulkHidden] = useState(false);
    const [hideBulkAfterApply, setHideBulkAfterApply] = useState(true);
    const [bulkRankAction, setBulkRankAction] = useState<BulkRankAction>("keep");
    const [bulkBonusActions, setBulkBonusActions] = useState<Record<BonusId, BulkBonusAction>>(emptyBulkBonusActions);
    const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
    const [showClearConfirmation, setShowClearConfirmation] = useState(false);
    const [importMessage, setImportMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

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
        if (hasLoaded) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        }
    }, [hasLoaded, progress]);

    useEffect(() => {
        if (!mobileEditorOpen || !window.matchMedia("(max-width: 1279px)").matches) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileEditorOpen(false);
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [mobileEditorOpen]);

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
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return a.indexPosition - b.indexPosition;
        });
    }, [bulkHiddenIds, bulkMode, filter, monsters, progress, search, showBulkHidden, sortBy]);

    const bulkSelectableVisibleMonsters = visibleMonsters.filter((monster) => !bulkHiddenIds.has(monster.id));

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
        updateSelected({ rank, bonuses: selectedProgress?.bonuses ?? emptyBonuses() });
    };

    const toggleBonus = (bonusId: BonusId) => {
        updateSelected({
            rank: selectedProgress?.rank,
            bonuses: {
                ...selectedProgress?.bonuses,
                [bonusId]: !selectedProgress?.bonuses?.[bonusId],
            },
        });
    };

    const markAllBonuses = () => {
        updateSelected({
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

    const hasBulkChanges = bulkRankAction !== "keep"
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

                BONUSES.forEach((bonus) => {
                    const action = bulkBonusActions[bonus.id];
                    if (action === "add") bonuses[bonus.id] = true;
                    if (action === "remove") delete bonuses[bonus.id];
                });

                if (!rank && Object.keys(bonuses).length === 0) delete next[monsterId];
                else next[monsterId] = { rank, bonuses };
            });
            return next;
        });

        if (hideBulkAfterApply) {
            setBulkHiddenIds((current) => new Set([...current, ...selectedIds]));
        }
        setBulkSelectedIds(new Set());
        setBulkRankAction("keep");
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
            version: 1,
            exportedAt: new Date().toISOString(),
            progress,
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
            const parsed = JSON.parse(await file.text()) as { version?: unknown; progress?: unknown };
            if (parsed.version !== 1 || !parsed.progress || typeof parsed.progress !== "object" || Array.isArray(parsed.progress)) {
                throw new Error("Invalid tracker backup");
            }

            const monsterIds = new Set(monsters.map((monster) => monster.id));
            const imported: TrackerProgress = {};
            Object.entries(parsed.progress).forEach(([monsterId, value]) => {
                if (!monsterIds.has(monsterId) || !value || typeof value !== "object" || Array.isArray(value)) return;
                const candidate = value as { rank?: unknown; bonuses?: unknown };
                const rank = typeof candidate.rank === "string" && RANKS.includes(candidate.rank as Rank)
                    ? candidate.rank as Rank
                    : undefined;
                const bonuses: Partial<Record<BonusId, boolean>> = {};
                if (candidate.bonuses && typeof candidate.bonuses === "object" && !Array.isArray(candidate.bonuses)) {
                    BONUSES.forEach((bonus) => {
                        if ((candidate.bonuses as Record<string, unknown>)[bonus.id] === true) bonuses[bonus.id] = true;
                    });
                }
                if (rank || Object.keys(bonuses).length > 0) imported[monsterId] = { rank, bonuses };
            });

            setProgress(imported);
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
                    <div className="flex items-center gap-3">
                        <img src={assetPath("/icons/index.png")} alt="" className="size-14 object-contain sm:size-16" />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">Index Tracker</h1>
                            <p className="mt-1 text-sm text-[#c2cad7] sm:text-base">
                                Track every monster and maximize your <span className="text-[#ffd53d]">Index Score.</span>
                            </p>
                        </div>
                    </div>

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
                        {RANKS.slice().reverse().map((rank) => <span key={rank} className={rankTone(rank)}>{rank}: <span className="text-white">{RANK_POINTS[rank]}</span></span>)}
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

            <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {filters.map((item) => (
                        <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`shrink-0 rounded-md border px-3 py-2 text-xs font-semibold sm:text-sm ${filter === item.id ? "border-[#168fff] bg-[#0c2941] text-[#42b6ff]" : "border-[#344050] bg-[#111923] text-[#aab4c4] hover:text-white"}`}>
                            {item.label} ({item.count})
                        </button>
                    ))}
                </div>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                    <label className="flex min-w-0 items-center rounded-md border border-[#344050] bg-[#0c131d] px-3 focus-within:border-[#168fff] lg:w-72">
                        <span aria-hidden="true" className="text-[#7f8b9e]">⌕</span>
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search monsters..." className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-[#677386]" />
                    </label>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} aria-label="Sort monsters" className="rounded-md border border-[#344050] bg-[#0c131d] px-3 py-2 text-sm text-[#d5dce6] outline-none focus:border-[#168fff]">
                        <option value="index">Sort: Index Order</option>
                        <option value="missing-most">Sort: Most Missing</option>
                        <option value="closest">Sort: Closest to Complete</option>
                        <option value="score-high">Sort: Highest Score</option>
                        <option value="name">Sort: Name A–Z</option>
                    </select>
                    <button type="button" onClick={() => setBulkModeActive(!bulkMode)} aria-pressed={bulkMode} className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${bulkMode ? "border-[#27bdff] bg-[#0d4771] text-white" : "border-[#405b70] bg-[#132536] text-[#d8e0ea] hover:border-[#2eacff] hover:text-white"}`}>
                        {bulkMode ? "Done Editing" : "Bulk Edit"}
                    </button>
                    <div className="grid grid-cols-2 rounded-md border border-[#344050] bg-[#0c131d] p-1" aria-label="View mode">
                        <button type="button" onClick={() => setViewMode("grid")} aria-label="Grid view" aria-pressed={viewMode === "grid"} className={`rounded px-3 py-1 text-sm ${viewMode === "grid" ? "bg-[#174a73] text-white" : "text-[#7f8b9e] hover:text-white"}`}>▦</button>
                        <button type="button" onClick={() => setViewMode("list")} aria-label="List view" aria-pressed={viewMode === "list"} className={`rounded px-3 py-1 text-sm ${viewMode === "list" ? "bg-[#174a73] text-white" : "text-[#7f8b9e] hover:text-white"}`}>☷</button>
                    </div>
                </div>
            </section>

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

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <label className="rounded-md border border-[#304356] bg-[#0d1822] px-3 py-2">
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-[#f5cc3f]">Highest Rank</span>
                            <select value={bulkRankAction} onChange={(event) => setBulkRankAction(event.target.value as BulkRankAction)} style={{ colorScheme: "dark" }} className="mt-1 w-full bg-transparent text-sm font-semibold text-white outline-none">
                                <option value="keep" className="bg-[#0d1822] text-white">Keep current</option>
                                {RANKS.map((rank) => <option key={rank} value={rank} className="bg-[#0d1822] text-white">Set to {rank}</option>)}
                                <option value="clear" className="bg-[#0d1822] text-white">Clear rank</option>
                            </select>
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
                            {visibleMonsters.map((monster) => {
                                const monsterProgress = progress[monster.id];
                                const score = scoreFor(monsterProgress);
                                const isHidden = bulkHiddenIds.has(monster.id);
                                const isSelected = bulkMode ? bulkSelectedIds.has(monster.id) : monster.id === selectedMonster?.id;
                                return (
                                    <div key={monster.id} className="flex min-w-0 flex-col gap-1">
                                        <button type="button" disabled={bulkMode && isHidden} onClick={() => { if (bulkMode) toggleBulkSelection(monster.id); else { setSelectedId(monster.id); setMobileEditorOpen(true); } }} aria-pressed={isSelected} aria-label={bulkMode ? `${isSelected ? "Deselect" : "Select"} ${monster.name}` : `Edit ${monster.name}`} className={`group relative w-full flex-1 overflow-hidden rounded-lg border bg-gradient-to-b from-[#101b27] to-[#0b121a] p-3 text-left transition ${viewMode === "grid" ? "min-h-48" : "grid min-h-28 grid-cols-[90px_1fr] items-center gap-3"} ${isSelected ? "border-[#16a1ff] shadow-[0_0_14px_rgba(22,161,255,0.38)]" : "border-[#334153] hover:border-[#64809f]"} ${isHidden ? "opacity-40 grayscale" : ""}`}>
                                            {bulkMode && <span aria-hidden="true" className={`absolute left-3 top-3 z-20 grid size-7 place-items-center rounded border text-sm font-black ${isSelected ? "border-[#2be577] bg-[#0c572b] text-white" : "border-[#738196] bg-[#091019] text-transparent"}`}>✓</span>}
                                            {bulkMode && isHidden && <span className="absolute left-12 top-3 z-20 rounded bg-[#1d2733] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c6cfdb]">Hidden</span>}
                                            <span className={`absolute ${bulkMode ? "left-12" : "left-3"} ${bulkMode && isHidden ? "top-10" : "top-2"} z-10 text-2xl font-black drop-shadow-[0_2px_2px_#000] ${rankTone(monsterProgress?.rank)}`}>{monsterProgress?.rank ?? "—"}</span>
                                            <div className={`flex items-end justify-center ${viewMode === "grid" ? "h-32" : "h-24"}`}>
                                                {monster.image ? <img src={assetPath(monster.image)} alt="" loading="lazy" className={`${viewMode === "grid" ? "max-h-32" : "max-h-24"} ${score === 0 ? "grayscale opacity-55" : ""} w-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.55)] transition-all group-hover:scale-105`} /> : null}
                                            </div>
                                            <div className="mt-1 flex items-end justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-white">{monster.name}</p>
                                                    <p className="mt-1 font-black text-[#ffb138]">{score} <span className="font-normal text-[#8e99ad]">/ 21</span></p>
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
                </section>

                {!bulkMode && selectedMonster && mobileEditorOpen && <button type="button" aria-label="Close monster progress" onClick={() => setMobileEditorOpen(false)} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden" />}

                {!bulkMode && selectedMonster && (
                    <aside role="dialog" aria-modal={mobileEditorOpen ? "true" : undefined} aria-label={`${selectedMonster.name} index progress`} className={`${mobileEditorOpen ? "fixed inset-x-3 bottom-3 top-16 z-50 overflow-y-auto" : "hidden"} rounded-xl border border-[#344050] bg-[#0b141e] p-4 shadow-2xl xl:sticky xl:inset-auto xl:top-4 xl:z-auto xl:block xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto`}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[#2eacff]">Monster Progress</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`text-2xl font-black ${rankTone(selectedProgress?.rank)}`}>{selectedProgress?.rank ?? "—"}</span>
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
                                        <button key={rank} type="button" onClick={() => setRank(rank)} className={`min-w-9 rounded border px-2 py-2 text-sm font-black ${selectedProgress?.rank === rank ? "border-[#ff5757] bg-[#6c2025] text-white" : "border-[#415065] bg-[#131d28] text-[#c4ccd8] hover:border-[#7182ff]"}`}>{rank}</button>
                                    ))}
                                </div>
                                <p className="mt-3 flex items-center gap-2 text-sm text-[#f5cc3f]"><img src={assetPath("/icons/index.png")} alt="" className="size-7 object-contain" />Rank Points: <b className="text-lg">{selectedRankPoints}</b></p>
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
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button type="button" onClick={markAllBonuses} className="flex items-center justify-center gap-2 rounded-md border border-[#16a7ff] bg-gradient-to-r from-[#073c75] to-[#075fa6] px-3 py-2.5 text-sm font-semibold text-white hover:brightness-110"><span className="grid size-5 place-items-center rounded-full bg-white text-xs font-black text-[#1765a5]">✓</span>Mark All Bonuses</button>
                            <button type="button" onClick={resetSelected} className="rounded-md border border-[#405066] bg-[#18222e] px-3 py-2.5 text-sm font-semibold text-[#d2d9e4] hover:text-white">↻ Reset</button>
                        </div>
                    </aside>
                )}
            </div>

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
