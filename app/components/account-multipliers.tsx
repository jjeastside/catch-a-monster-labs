"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { createPortal } from "react-dom";

import { achievementIds, getAchievementsByCategory } from "../data/achievements";
import {
    ADDITIONAL_ACCOUNT_MULTIPLIER_CATEGORIES,
    ACCOUNT_MULTIPLIER_CATEGORIES,
    ACCOUNT_MULTIPLIER_DETAILS,
    getAccountBonuses,
    getCategoryProgress,
} from "../lib/calculations/account-multipliers";
import type { Achievement, AchievementCategory } from "../types/achievement";
import type { Build } from "../types/build";
import { assetPath } from "../lib/asset-path";

type AccountMultipliersProps = {
    build: Build;
    onBuildChangeAction: Dispatch<SetStateAction<Build>>;
};

type AccountProfile = { id: string; name: string; completedAchievementIds: string[] };
const ACCOUNT_PROFILES_KEY = "cam-lab-account-profiles-v1";
const CURRENT_ACCOUNT_BONUSES_KEY = "monster-lab-account-multipliers";
const profileButtonStyle = "inline-flex items-center justify-center gap-2 rounded-lg border border-[#42647e] bg-[#123754] px-3 py-2 text-xs font-bold text-[#a5dcff] transition hover:border-[#79c9ff] hover:bg-[#194765] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

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
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [profileControlTarget, setProfileControlTarget] = useState<HTMLElement | null>(null);
    const profileTriggerRef = useRef<HTMLButtonElement>(null);
    const pickerCloseRef = useRef<HTMLButtonElement>(null);
    const [expandedCategory, setExpandedCategory] = useState<AchievementCategory | null>(null);
    const [indexScoreInput, setIndexScoreInput] = useState("");
    const [profiles, setProfiles] = useState<AccountProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState("");
    const [profileName, setProfileName] = useState("");
    const [profileStatus, setProfileStatus] = useState("");
    const [profilesLoaded, setProfilesLoaded] = useState(false);
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

    const selectedProfile = profiles.find(({ id }) => id === selectedProfileId);
    const profileHasChanges = !!selectedProfile && (
        selectedProfile.completedAchievementIds.length !== selectedSet.size ||
        selectedProfile.completedAchievementIds.some((id) => !selectedSet.has(id))
    );

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            setProfileControlTarget(document.getElementById("account-profile-control"));
        });
        return () => window.cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        const openPicker = () => { setIsOpen(false); setIsPickerOpen(true); };
        window.addEventListener("cam-lab-open-account-profiles", openPicker);
        return () => window.removeEventListener("cam-lab-open-account-profiles", openPicker);
    }, []);

    useEffect(() => {
        if (!isPickerOpen) return;
        pickerCloseRef.current?.focus();
        const trigger = profileTriggerRef.current;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsPickerOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            trigger?.focus();
        };
    }, [isPickerOpen]);

    function openManager() {
        setIsPickerOpen(false);
        setExpandedCategory(null);
        setShowProfileEditor(profiles.length === 0);
        setIsOpen(true);
    }

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            try {
                const stored = JSON.parse(window.localStorage.getItem(ACCOUNT_PROFILES_KEY) ?? "null");
                const loaded: AccountProfile[] = [];
                if (Array.isArray(stored?.profiles)) {
                    for (const value of stored.profiles) {
                        if (!value || typeof value.id !== "string" || typeof value.name !== "string" || !Array.isArray(value.completedAchievementIds) || loaded.some(({ id }) => id === value.id)) continue;
                        loaded.push({ id: value.id, name: value.name.trim().slice(0, 60) || "Account", completedAchievementIds: [...new Set((value.completedAchievementIds as unknown[]).filter((id): id is string => typeof id === "string" && achievementIds.has(id)))] });
                    }
                }
                setProfiles(loaded);
                const active = loaded.find(({ id }) => id === stored?.selectedProfileId);
                if (active) { setSelectedProfileId(active.id); setProfileName(active.name); }
            } catch {
                setProfileStatus("Saved accounts could not be loaded. Your current bonuses are unchanged.");
            }
            setProfilesLoaded(true);
        });
        return () => window.cancelAnimationFrame(frame);
    }, []);

    function persistProfiles(nextProfiles: AccountProfile[], nextSelectedId: string): boolean {
        try {
            window.localStorage.setItem(ACCOUNT_PROFILES_KEY, JSON.stringify({ profiles: nextProfiles, selectedProfileId: nextSelectedId }));
            setProfiles(nextProfiles);
            setSelectedProfileId(nextSelectedId);
            return true;
        } catch {
            setProfileStatus("Unable to save accounts in this browser. Please check browser storage permissions.");
            return false;
        }
    }

    function createProfile() {
        const name = profileName.trim().slice(0, 60);
        if (!name) { setProfileStatus("Enter an account name first."); return; }
        if (profiles.some((profile) => profile.name.toLowerCase() === name.toLowerCase())) {
            setProfileStatus("An account with that name already exists. Use a different name or select it to update."); return;
        }
        const id = window.crypto.randomUUID();
        if (!id) return;
        const next = { id, name, completedAchievementIds: [...selectedSet] };
        const nextProfiles = [...profiles, next];
        if (persistProfiles(nextProfiles, id)) { setProfileName(name); setProfileStatus(`${name} saved.`); }
    }

    function loadProfile(id: string) {
        const profile = profiles.find((entry) => entry.id === id);
        if (!profile) {
            if (persistProfiles(profiles, "")) { setProfileName(""); setProfileStatus(""); }
            return;
        }
        if (!persistProfiles(profiles, id)) return false;
        updateSelectedIds(profile.completedAchievementIds, false);
        setIndexScoreInput("");
        setProfileName(profile.name);
        setProfileStatus(`${profile.name} loaded.`);
        return true;
    }

    function deleteProfile() {
        if (!selectedProfile) return;
        if (persistProfiles(profiles.filter(({ id }) => id !== selectedProfileId), "")) {
            setProfileName("");
            setProfileStatus(`${selectedProfile.name} deleted. Current bonuses are unchanged.`);
        }
    }

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

    const updateSelectedIds = (nextIds: string[], autoSave = true) => {
        const completedAchievementIds = [...new Set(nextIds)];
        let saved = true;
        // The current setup is persistent even without a named account. This
        // uses the same account key already loaded by the calculator and browser.
        try {
            window.localStorage.setItem(CURRENT_ACCOUNT_BONUSES_KEY, JSON.stringify({ completedAchievementIds }));
        } catch {
            saved = false;
            setProfileStatus("Unable to save the current setup. Please check browser storage permissions.");
        }
        // Save explicit edits only. Loading another account or opening a shared
        // build must never overwrite the previously selected saved profile.
        if (autoSave && profilesLoaded && selectedProfile) {
            const nextProfiles = profiles.map((profile) => profile.id === selectedProfileId
                ? { ...profile, completedAchievementIds }
                : profile);
            if (!persistProfiles(nextProfiles, selectedProfileId)) saved = false;
        }
        if (autoSave && saved) setProfileStatus(`${selectedProfile?.name ?? "Current setup"} · Saved automatically.`);
        onBuildChangeAction((current) => ({
            ...current,
            accountMultipliers: { completedAchievementIds },
        }));
    };

    function startNewAccount() {
        if (!persistProfiles(profiles, "")) return;
        setProfileName("");
        setProfileStatus("Enter a name to create an account with your current bonuses.");
    }

    function autoSaveName() {
        if (!selectedProfile) return;
        const name = profileName.trim();
        if (!name || profiles.some((profile) => profile.id !== selectedProfileId && profile.name.toLowerCase() === name.toLowerCase())) {
            setProfileName(selectedProfile.name);
            setProfileStatus(!name ? "Account names cannot be empty." : "That account name is already in use.");
            return;
        }
        if (name !== selectedProfile.name) {
            // Renaming must preserve that profile's saved bonuses, even when a
            // shared build is being previewed with different account bonuses.
            const nextProfiles = profiles.map((profile) => profile.id === selectedProfileId ? { ...profile, name } : profile);
            if (persistProfiles(nextProfiles, selectedProfileId)) {
                setProfileName(name);
                setProfileStatus(`${name} · Saved automatically.`);
            }
        } else setProfileName(name);
    }

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

    const toggleAllCategory = (category: AchievementCategory) => {
        const categoryAchievements = achievementsByCategory[category];
        const categoryIds = new Set(categoryAchievements.map(({ id }) => id));
        const otherIds = selectedIds.filter((id) => !categoryIds.has(id));
        const allSelected = categoryAchievements.every(({ id }) => selectedSet.has(id));
        updateSelectedIds([
            ...otherIds,
            ...(!allSelected ? categoryAchievements.map(({ id }) => id) : []),
        ]);
    };

    const setIndexScore = (rawScore: string) => {
        setIndexScoreInput(rawScore);
        if (rawScore.trim() === "") return;

        const score = Math.max(0, Math.trunc(Number(rawScore) || 0));
        const indexAchievements = achievementsByCategory["index-mania"];
        const indexIds = new Set(indexAchievements.map(({ id }) => id));
        const otherIds = selectedIds.filter((id) => !indexIds.has(id));
        const completedIds = indexAchievements
            .filter(({ goalAmount }) => goalAmount !== null && score >= goalAmount)
            .map(({ id }) => id);

        updateSelectedIds([...otherIds, ...completedIds]);
    };

    const toggleAchievement = (achievement: Achievement) => {
        const categoryAchievements = achievementsByCategory[achievement.category];

        if (achievement.category === "pet-quest" || achievement.category === "index-mania") {
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

    const reset = () => {
        setIndexScoreInput("");
        updateSelectedIds([]);
    };

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

    const profileControl = (
        <button ref={profileTriggerRef} type="button" onClick={() => setIsPickerOpen((open) => !open)}
            aria-label="Account Multipliers" aria-haspopup="dialog" aria-expanded={isPickerOpen} aria-controls="account-profile-picker"
            title={`Account profiles · ${selectedProfile && !profileHasChanges ? selectedProfile.name : "Current setup"}`}
            className="relative flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#25475f] bg-[#0a1931] px-2 text-[#a5dcff] transition hover:border-[#79c9ff] hover:bg-[#123754] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79c9ff] sm:h-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="hidden size-5 sm:block"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" /></svg>
            <span className="text-left text-[9px] font-semibold leading-3 sm:text-[10px]">Account<span className="block">Multipliers</span></span>
            {selectedProfile && !profileHasChanges && <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-[#061023] bg-[#39ef64]" />}
        </button>
    );

    function openCategory(category: AchievementCategory, accountId?: string) {
        if (accountId && !loadProfile(accountId)) return;
        setIsPickerOpen(false);
        setShowProfileEditor(false);
        setExpandedCategory(category);
        setIsOpen(true);
    }

    function bonusPreview(selections: Build["accountMultipliers"], accountId?: string) {
        const index = getCategoryProgress(selections, "index-mania");
        const path = getCategoryProgress(selections, "path-of-progress");
        const quests = getCategoryProgress(selections, "pet-quest");
        const total = getAccountBonuses(selections);
        const accountLabel = accountId ? profiles.find(({ id }) => id === accountId)?.name ?? "saved account" : "current setup";
        const shortcuts: Array<{ category: AchievementCategory; label: string; icon: string; percent: number; color: string }> = [
            { category: "index-mania", label: "Index", icon: "/account-icons/index-mania.png", percent: index.damagePercent, color: "text-[#ffc447]" },
            { category: "path-of-progress", label: "Path", icon: "/account-icons/path-of-progress.png", percent: path.healthPercent, color: "text-[#49ef72]" },
            { category: "pet-quest", label: "Pet DMG", icon: "/account-icons/damage-up.png", percent: quests.damagePercent, color: "text-[#ffe05b]" },
            { category: "pet-quest", label: "Pet HP", icon: "/account-icons/health-up.png", percent: quests.healthPercent, color: "text-[#ffe05b]" },
        ];
        return (
            <span className="relative mt-2 block pointer-events-none">
                <span className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-[#8fa8be]">
                    {shortcuts.map((shortcut) => (
                        <button key={shortcut.label} type="button" disabled={!profilesLoaded}
                            onClick={() => openCategory(shortcut.category, accountId)}
                            aria-label={`Edit ${shortcut.label === "Index" ? "Index Mania" : shortcut.label === "Path" ? "Path of Progress" : `Pet Quests ${shortcut.label === "Pet HP" ? "Health" : "Damage"}`} for ${accountLabel}`}
                            title={`Edit ${ACCOUNT_MULTIPLIER_DETAILS[shortcut.category].label}`}
                            className="relative z-10 pointer-events-auto flex min-w-0 items-center gap-1.5 rounded px-0.5 py-0.5 text-left transition hover:bg-[#79c9ff]/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#79c9ff] disabled:opacity-50">
                            <img src={assetPath(shortcut.icon)} alt="" className="size-5 shrink-0 object-contain" />
                            {shortcut.label}<strong className={`ml-auto ${shortcut.color}`}>{shortcut.percent}%</strong>
                        </button>
                    ))}
                </span>
                <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#25475f]/60 pt-2 text-[10px]">
                    <span className="text-[#ff6388]">+{Number(total.damagePercent.toFixed(2))}% DMG total</span>
                    <span className="text-[#49ef72]">+{Number(total.healthPercent.toFixed(2))}% HP total</span>
                    {total.riftDamagePercent > 0 && <span className="text-[#8be8ff]">+{total.riftDamagePercent}% Rift</span>}
                    {total.critChancePercent > 0 && <span className="text-[#ffe05b]">+{total.critChancePercent}% Crit</span>}
                </span>
            </span>
        );
    }

    return (
        <>
            {profileControlTarget ? createPortal(profileControl, profileControlTarget) : (
                <div className="fixed bottom-4 left-4 z-50">{profileControl}</div>
            )}
            {isPickerOpen && createPortal(
                <div className="fixed inset-0 z-[100]" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setIsPickerOpen(false);
                }}>
                    <section id="account-profile-picker" role="dialog" aria-modal="true" aria-labelledby="account-profile-picker-title"
                        className="fixed right-3 top-[76px] flex max-h-[calc(100dvh-92px)] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-[#294b64] bg-[#071b2b] shadow-[0_16px_60px_rgba(0,0,0,0.65)] sm:right-5 sm:top-[84px] 2xl:top-[104px]">
                        <header className="flex items-center justify-between gap-3 border-b border-[#25475f] px-4 py-3">
                            <div><h2 id="account-profile-picker-title" className="text-sm font-bold text-white">Account Profiles</h2><p className="mt-0.5 text-[11px] text-[#8e99ad]">Choose an account or click a bonus to edit it.</p></div>
                            <button ref={pickerCloseRef} type="button" onClick={() => setIsPickerOpen(false)} aria-label="Close account profiles" className="grid size-8 shrink-0 place-items-center rounded-md border border-[#25475f] text-[#8e99ad] hover:text-white">×</button>
                        </header>
                        <div className="min-h-0 space-y-2 overflow-y-auto p-3">
                            <div className="rounded-lg border border-[#3984af]/70 bg-[#102b40] p-3">
                                <span className="flex items-center justify-between gap-2 text-xs font-bold text-white"><span className="min-w-0 truncate">{selectedProfile && !profileHasChanges ? selectedProfile.name : "Current setup"}</span><span className="shrink-0 rounded bg-[#79c9ff]/15 px-1.5 py-0.5 text-[9px] text-[#79c9ff]">In use</span></span>
                                {bonusPreview(build.accountMultipliers)}
                                {profileHasChanges && <span className="mt-2 block text-[10px] text-[#ffc447]">Current setup differs from {selectedProfile?.name}</span>}
                            </div>
                            <p className="px-1 pt-1 text-[9px] font-bold uppercase tracking-wider text-[#8e99ad]">Saved accounts</p>
                            {!profilesLoaded ? <p className="p-2 text-xs text-[#8e99ad]">Loading accounts…</p> : profiles.length === 0 ? <p className="rounded-lg border border-dashed border-[#25475f] p-3 text-xs leading-5 text-[#8e99ad]">Current setup saves automatically. Open Manage if you want to create a named account, such as Main or Alt.</p> : profiles.map((profile) => {
                                const active = profile.id === selectedProfileId && !profileHasChanges;
                                return <div key={profile.id}
                                    className={`relative block w-full rounded-lg border p-3 text-left transition ${active ? "border-[#3984af] bg-[#102b40]" : "border-[#25475f] bg-[#0a2033] hover:border-[#79c9ff]"}`}>
                                    <button type="button" aria-label={`Use account ${profile.name}`} aria-pressed={active}
                                        onClick={() => loadProfile(profile.id)}
                                        className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-[#79c9ff]" />
                                    <span className="pointer-events-none relative flex w-full items-center justify-between gap-2 text-left">
                                        <span className="truncate text-xs font-bold text-[#e3e8f1]">{profile.name}</span><span className="shrink-0 text-[10px] text-[#79c9ff]">{active ? "✓ Selected" : "Use account →"}</span>
                                    </span>
                                    {bonusPreview({ completedAchievementIds: profile.completedAchievementIds }, profile.id)}
                                </div>;
                            })}
                            <p role="status" className="text-[11px] text-[#a5dcff]">{profileStatus}</p>
                        </div>
                        <footer className="border-t border-[#25475f] p-3"><button type="button" onClick={openManager} className={`${profileButtonStyle} w-full`}>Manage Accounts & Bonuses</button></footer>
                    </section>
                </div>, document.body,
            )}
            {isOpen && (
                <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-2 sm:p-4" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setIsOpen(false);
                }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="account-multipliers-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#294b64] bg-[#071b2b] shadow-2xl">
                        <header className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-[#294b64] bg-[#071b2b] px-4 py-3 sm:px-5 sm:py-4">
                            <div>
                                {expandedCategory && (
                                    <button type="button" onClick={() => setExpandedCategory(null)} className="mb-2 text-xs font-bold text-[#79c9ff] hover:text-white">
                                        ← Back to account bonuses
                                    </button>
                                )}
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#79c9ff]">Account Progress</p>
                                <h2 id="account-multipliers-title" className="mt-1 text-lg font-semibold text-[#f6f8fc]">
                                    {expandedCategory ? `${ACCOUNT_MULTIPLIER_DETAILS[expandedCategory].label} Achievements` : "Account Multipliers"}
                                </h2>
                                <p className="mt-1 text-xs text-[#8e99ad]">
                                    {`${selectedProfile?.name ?? "Current setup"} · Bonus changes save automatically.`}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button type="button" onClick={() => { setIsOpen(false); setIsPickerOpen(true); }} aria-label="Change account" title="Change account" className="grid size-9 place-items-center rounded-md border border-[#294b64] bg-[#0b2337] text-[#a5dcff] hover:border-[#79c9ff]">⇄</button>
                                {!expandedCategory && <button type="button" onClick={() => setShowProfileEditor((shown) => !shown)} aria-label="Edit saved accounts" aria-expanded={showProfileEditor} title="Edit saved accounts" className={`grid size-9 place-items-center rounded-md border text-[#a5dcff] transition hover:border-[#79c9ff] ${showProfileEditor ? "border-[#79c9ff] bg-[#123754]" : "border-[#294b64] bg-[#0b2337]"}`}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="size-5"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" /></svg>
                                </button>}
                                <button ref={closeButtonRef} type="button" onClick={() => setIsOpen(false)} aria-label="Close account multipliers" className="grid size-9 shrink-0 place-items-center rounded-md border border-[#294b64] bg-[#0b2337] text-lg text-[#8e99ad] hover:border-[#43a1df] hover:text-[#79c9ff]">×</button>
                            </div>
                        </header>

                        <div className="space-y-4 p-3 sm:p-5">
                            {!expandedCategory && showProfileEditor && (
                                <section className="rounded-xl border border-[#294b64] bg-[#081e30] p-3" aria-label="Saved accounts">
                                    <h3 className="text-sm font-black text-white">Saved Accounts</h3>
                                    <p className="mt-1 text-[11px] text-[#8e99ad]">Bonus changes save automatically to the selected account. Names save when you leave the name field. Profiles stay saved in this browser.</p>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        <label className="text-[11px] font-semibold text-[#8e99ad]">
                                            Account
                                            <select aria-label="Saved account" value={selectedProfileId} onChange={(event) => loadProfile(event.target.value)} disabled={!profilesLoaded} className="mt-1 block w-full min-w-0 rounded-lg border border-[#42647e] bg-[#0a2236] px-3 py-2 text-sm text-white">
                                                <option value="">Current / new account</option>
                                                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
                                            </select>
                                        </label>
                                        <label className="text-[11px] font-semibold text-[#8e99ad]">
                                            Account name
                                            <input aria-label="Account name" value={profileName} maxLength={60} onChange={(event) => setProfileName(event.target.value)} onBlur={autoSaveName} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} placeholder="e.g. Main or Alt" className="mt-1 block w-full min-w-0 rounded-lg border border-[#42647e] bg-[#0a2236] px-3 py-2 text-sm text-white outline-none focus:border-[#79c9ff]" />
                                        </label>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedProfile ? (
                                            <button type="button" onClick={startNewAccount} disabled={!profilesLoaded} className={profileButtonStyle}>New Account</button>
                                        ) : (
                                            <button type="button" onClick={createProfile} disabled={!profilesLoaded || !profileName.trim()} className={profileButtonStyle}>Create Account</button>
                                        )}
                                        <button type="button" onClick={deleteProfile} disabled={!profilesLoaded || !selectedProfile} className={`${profileButtonStyle} text-[#ff9aab]`}>Delete Account</button>
                                    </div>
                                    {profileHasChanges && <p className="mt-2 text-[11px] text-[#ffc447]">Current setup differs from {selectedProfile?.name}. New bonus edits save automatically to that account. Choose New Account to keep a separate setup.</p>}
                                    <p role="status" className="mt-2 text-[11px] text-[#a5dcff]">{profileStatus}</p>
                                </section>
                            )}
                            <div className={`${expandedCategory ? "hidden" : "grid"} gap-3 sm:grid-cols-2`}>
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
                                            onClick={() => setExpandedCategory(card.category)}
                                            aria-expanded={isExpanded}
                                            className={`group relative overflow-hidden rounded-2xl border-2 p-1 text-left shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 ${frame} ${isExpanded ? "ring-2 ring-[#43a1df]/60" : ""}`}
                                        >
                                            <span className={`relative flex min-h-28 items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r ${glow} to-[#090c10] px-4 py-3`}>
                                                <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1.5px)", backgroundSize: "14px 14px" }} />
                                                <span className="relative grid size-16 shrink-0 place-items-center">
                                                    <img src={assetPath(card.iconSrc)} alt="" className="max-h-16 max-w-16 object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.65)]" />
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
                                                    <img src={assetPath(card.statIconSrc)} alt="" className="ml-auto mt-1 size-7 object-contain" />
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <section className={`${expandedCategory ? "hidden" : "block"} rounded-xl border border-[#294b64] bg-[#081e30] p-3`}>
                                <div className="mb-3 px-1">
                                    <div>
                                        <h3 className="text-sm font-black text-white">Additional Bonuses</h3>
                                        <p className="mt-0.5 text-[10px] text-[#7f8b9e]">Rare account rewards with specialized effects.</p>
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
                                                className={`group flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition ${isSelected ? "border-[#43a1df] bg-[#123754]" : "border-[#294b64] bg-[#0b2235] hover:border-[#42647e] hover:bg-[#11314a]"}`}
                                            >
                                                <img src={assetPath(achievementIcon)} alt="" className="size-12 shrink-0 object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-xs font-black text-white">{details.label}</span>
                                                    <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-[#aab3c2]">
                                                        <img src={assetPath(rewardIcon)} alt="" className="size-6 object-contain" />
                                                        {details.shortReward}
                                                    </span>
                                                </span>
                                                <span className={`grid size-7 shrink-0 place-items-center rounded-md border-2 text-sm font-black ${isSelected ? "border-[#3ee378] bg-[#26c965] text-[#07130b]" : "border-[#42647e] bg-[#081e30] text-transparent"}`}>✓</span>
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
                                    <section className="overflow-hidden rounded-xl border border-[#294b64] bg-[#091e30] shadow-xl">
                                        <div className="border-b border-[#294b64] bg-[#0d283e] p-3 sm:p-4">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-black text-white">{details.label} Achievements</h3>
                                                    <span className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${categoryStyles[category]}`}>
                                                        <img src={assetPath(category === "path-of-progress" ? "/account-icons/health.png" : category === "index-mania" ? "/account-icons/damage.png" : "/account-icons/health-up.png")} alt="" className="size-4 object-contain" />
                                                        {details.shortReward}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-[#8f9aae]">{details.description}</p>
                                            </div>
                                            <div className="mt-3 grid w-full gap-2 sm:grid-cols-2">
                                                <label className="flex min-w-0 items-center gap-2 rounded-lg border border-[#42647e] bg-[#0a2236] px-3 py-2">
                                                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#7f8b9e]">Completed</span>
                                                    <input type="number" min={0} max={categoryAchievements.length} value={progress.completed} onChange={(event) => setCategoryCount(category, Number(event.target.value))} className="min-w-0 flex-1 bg-transparent text-right text-sm font-black text-white outline-none" aria-label={`${details.label} completed`} />
                                                    <span className="shrink-0 text-sm font-black text-[#7f8b9e]">/{categoryAchievements.length}</span>
                                                </label>
                                                {category === "index-mania" && (
                                                    <label className="flex min-w-0 items-center gap-2 rounded-lg border border-[#b87512] bg-[#211506] px-3 py-2">
                                                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#d89b3a]">Index Score</span>
                                                        <input
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={0}
                                                            step={1}
                                                            value={indexScoreInput}
                                                            onChange={(event) => setIndexScore(event.target.value)}
                                                            placeholder="e.g. 2700"
                                                            className="min-w-0 flex-1 bg-transparent text-right text-sm font-black text-white outline-none placeholder:text-[#6f6252]"
                                                            aria-label="Current index score"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                            {category === "index-mania" && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => { setCategoryCount(category, categoryAchievements.length); setIndexScoreInput(""); }} aria-label="Select all Index Mania achievements" className={profileButtonStyle}>
                                                        <span aria-hidden="true" className="grid size-4 place-items-center rounded border border-[#79c9ff] text-[10px]">✓</span>Select All
                                                    </button>
                                                    <button type="button" onClick={() => { setCategoryCount(category, 0); setIndexScoreInput(""); }} aria-label="Clear all Index Mania achievements" className={profileButtonStyle}>
                                                        <span aria-hidden="true" className="grid size-4 place-items-center rounded border border-[#79c9ff] text-[10px]">×</span>Clear All
                                                    </button>
                                                </div>
                                            )}
                                            {category !== "index-mania" && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAllCategory(category)}
                                                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#42647e] bg-[#123754] px-3 py-2 text-xs font-bold text-[#a5dcff] transition hover:border-[#79c9ff] hover:bg-[#194765] hover:text-white"
                                                >
                                                    <span className="grid size-4 place-items-center rounded border border-[#79c9ff] text-[10px]">{progress.completed === categoryAchievements.length ? "✓" : ""}</span>
                                                    {progress.completed === categoryAchievements.length ? "Clear All" : "Select All"}
                                                </button>
                                            )}
                                            <button type="button" onClick={() => setExpandedCategory(null)} className="mt-3 block text-xs font-bold text-[#79c9ff] hover:text-white">← Back to account bonuses</button>
                                        </div>
                                        <div className={category === "index-mania" ? "max-h-80 overflow-y-auto" : ""}>
                                            {categoryAchievements.map((achievement) => {
                                                const isSelected = selectedSet.has(achievement.id);
                                                return (
                                                    <button key={achievement.id} type="button" role="checkbox" aria-checked={isSelected} onClick={() => toggleAchievement(achievement)} className={`flex w-full items-center gap-3 border-b border-[#294b64] px-4 py-3 text-left transition last:border-b-0 ${isSelected ? "bg-[#123754]" : "hover:bg-[#102b42]"}`}>
                                                        <span className={`grid size-7 shrink-0 place-items-center rounded-md border-2 text-sm font-black ${isSelected ? "border-[#3ee378] bg-[#26c965] text-[#07130b]" : "border-[#42647e] bg-[#081e30] text-transparent"}`}>✓</span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-bold text-[#eef1f6]">{achievement.name}</span>
                                                            <span className="mt-0.5 block text-xs text-[#7f8b9e]">{achievementGoal(achievement)}</span>
                                                        </span>
                                                        <span className={`flex shrink-0 items-center gap-1.5 text-xs font-black ${achievement.rewardStat === "health" ? "text-[#39ef64]" : "text-[#ff6388]"}`}>
                                                            <img src={assetPath(achievement.rewardStat === "health" ? "/account-icons/health.png" : "/account-icons/damage.png")} alt="" className="size-5 object-contain" />
                                                            +{achievement.rewardPercent}%
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                );
                            })()}

                            <section className={`${expandedCategory ? "hidden" : "block"} overflow-hidden rounded-2xl border-2 border-[#315772] bg-[#081b2b] p-1 shadow-[0_12px_35px_rgba(0,0,0,0.45)]`}>
                                <div className="rounded-xl bg-gradient-to-b from-[#0d2b42] to-[#071b2b] px-4 py-4 sm:px-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#42505b]" />
                                        <h3 className="text-xl font-black text-white drop-shadow-[0_2px_1px_#000]">Total Bonuses</h3>
                                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#42505b]" />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 sm:divide-x sm:divide-[#39434b]">
                                        <div className="text-center sm:pr-4">
                                            <p className="flex items-center justify-center gap-2 text-2xl font-black text-[#ff517e] drop-shadow-[0_0_10px_rgba(255,81,126,0.35)]"><img src={assetPath("/account-icons/damage.png")} alt="Damage" className="size-9 object-contain" />+{bonuses.damagePercent}%</p>
                                            <p className="text-sm font-black text-white">Damage</p>
                                            <p className="mt-3 rounded-lg border border-[#76243e] bg-[#250c15] px-2 py-1.5 text-[11px] font-bold text-[#ff7899]">{formatBonusPercent(indexProgress.damagePercent)} × {formatBonusPercent(petQuestProgress.damagePercent)} = {formatBonusPercent(bonuses.damagePercent)}</p>
                                        </div>
                                        <div className="border-t border-[#31536a] pt-4 text-center sm:border-t-0 sm:pl-4 sm:pt-0">
                                            <p className="flex items-center justify-center gap-2 text-2xl font-black text-[#39ef64] drop-shadow-[0_0_10px_rgba(57,239,100,0.35)]"><img src={assetPath("/account-icons/health.png")} alt="Health" className="size-9 object-contain" />+{bonuses.healthPercent}%</p>
                                            <p className="text-sm font-black text-white">Health</p>
                                            <p className="mt-3 rounded-lg border border-[#1f7438] bg-[#092314] px-2 py-1.5 text-[11px] font-bold text-[#62f383]">{formatBonusPercent(pathProgress.healthPercent)} × {formatBonusPercent(petQuestProgress.healthPercent)} = {formatBonusPercent(bonuses.healthPercent)}</p>
                                        </div>
                                    </div>
                                    {(bonuses.riftDamagePercent > 0 || bonuses.critChancePercent > 0) && (
                                        <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-[#294b64] pt-3">
                                            {bonuses.riftDamagePercent > 0 && (
                                                <span className="flex items-center gap-1.5 rounded-lg border border-[#247899] bg-[#092634] px-2.5 py-1.5 text-[11px] font-black text-[#83e5ff]">
                                                    <img src={assetPath("/account-icons/rift-damage.png")} alt="" className="size-6 object-contain" />
                                                    +{bonuses.riftDamagePercent}% Rift Damage
                                                </span>
                                            )}
                                            {bonuses.critChancePercent > 0 && (
                                                <span className="flex items-center gap-1.5 rounded-lg border border-[#a98212] bg-[#302505] px-2.5 py-1.5 text-[11px] font-black text-[#ffe05b]">
                                                    <img src={assetPath("/account-icons/crit-chance-up.png")} alt="" className="size-6 object-contain" />
                                                    +{bonuses.critChancePercent}% Crit Chance
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <footer className="sticky bottom-0 z-20 flex justify-between gap-3 border-t border-[#294b64] bg-[#071b2b] px-5 py-4">
                        np    {expandedCategory ? (
                                <button type="button" onClick={() => setExpandedCategory(null)} className="rounded-md px-3 py-2 text-xs font-semibold text-[#79c9ff] hover:text-white">← Back</button>
                            ) : (
                                <button type="button" onClick={reset} disabled={selectedIds.length === 0} className="rounded-md px-3 py-2 text-xs font-semibold text-[#8e99ad] hover:text-[#e3e8f1] disabled:cursor-not-allowed disabled:opacity-40">Reset All</button>
                            )}
                            <button type="button" onClick={() => setIsOpen(false)} className="rounded-md bg-[#58b6ee] px-5 py-2 text-sm font-bold text-[#0b1510] hover:bg-[#87d2ff]">Done</button>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
}
