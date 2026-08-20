"use client";

import { useEffect, useRef, useState } from "react";

import { monsters } from "../data/monsters";
import { achievementIds, getAchievementsByCategory } from "../data/achievements";
import { createDefaultBuild, type Build } from "../types/build";
import type { Monster } from "../types/monster";

import { BuildEditor } from "./build-editor";
import { AccountMultipliers } from "./account-multipliers";
import { CalculatorResults } from "./calculator-results";
import { MonsterBrowser } from "./monster-browser";
import { TopNavigation } from "./top-navigation";
import { SiteFooter } from "./site-footer";
import { SiteHeading } from "./site-heading";
import { SavedBuildsPanel, type SavedBuildSlot } from "./saved-builds-panel";

const SAVED_BUILDS_KEY = "cam-lab-saved-builds";
const LEGACY_SAVED_BUILD_KEY = "cam-lab-saved-build";
const ACTIVE_BUILD_KEY = "cam-lab-active-build";
const LEGACY_SELECTED_MONSTER_KEY = "cam-lab-selected-monster";
const SAVE_SLOT_COUNT = 3;

function emptySaveSlots(): Array<SavedBuildSlot | null> {
    return Array.from({ length: SAVE_SLOT_COUNT }, () => null);
}

function normalizeSavedBuild(saved: Partial<Build>): Build {
    const legacyBossContext = String(saved.combatContext) === "boss";

    return {
        ...createDefaultBuild({
            monsterId: saved.monsterId ?? null,
            evolutionPercent: saved.evolutionPercent,
        }),
        ...saved,
        targetIsBoss: saved.targetIsBoss === true || legacyBossContext,
        combatContext: legacyBossContext
            ? "standard"
            : saved.combatContext ?? "standard",
    };
}

export function AppShell() {
    const hasInitializedAccountStorage = useRef(false);
    const hasInitializedFavoriteStorage = useRef(false);
    const [hasLoadedActiveBuild, setHasLoadedActiveBuild] = useState(false);
    const [savedBuildsMode, setSavedBuildsMode] = useState<"save" | "load" | null>(null);
    const [mobilePanel, setMobilePanel] = useState<"monster" | "results" | "build">("monster");
    const [savedBuildSlots, setSavedBuildSlots] = useState<Array<SavedBuildSlot | null>>(emptySaveSlots);
    const [build, setBuild] = useState<Build>(() => {
        const defaultMonster = monsters[0];

        return {
            ...createDefaultBuild({
                monsterId: defaultMonster?.id ?? null,
            }),
            selectedSkillId:
                defaultMonster?.skillIds[0] ?? null,
        };
    });

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            const saved = window.localStorage.getItem("monster-lab-account-multipliers");
            if (!saved) return;

            try {
                const parsed = JSON.parse(saved) as Partial<Build["accountMultipliers"]> & {
                    indexMania?: boolean;
                    petQuestAchievement?: boolean;
                    pathOfProgress?: boolean;
                };
                const storedIds = Array.isArray(parsed.completedAchievementIds)
                    ? parsed.completedAchievementIds.filter(
                        (id): id is string => typeof id === "string" && achievementIds.has(id),
                    )
                    : [];

                if (storedIds.length === 0) {
                    if (parsed.indexMania) {
                        storedIds.push(...getAchievementsByCategory("index-mania").map(({ id }) => id));
                    }
                    if (parsed.pathOfProgress) {
                        storedIds.push(...getAchievementsByCategory("path-of-progress").map(({ id }) => id));
                    }
                    if (parsed.petQuestAchievement) {
                        storedIds.push(...getAchievementsByCategory("pet-quest").map(({ id }) => id));
                    }
                }

                setBuild((current) => ({
                    ...current,
                    accountMultipliers: {
                        completedAchievementIds: [...new Set(storedIds)],
                    },
                }));
            } catch {
                window.localStorage.removeItem("monster-lab-account-multipliers");
            }
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        if (!hasInitializedAccountStorage.current) {
            hasInitializedAccountStorage.current = true;
            return;
        }

        window.localStorage.setItem(
            "monster-lab-account-multipliers",
            JSON.stringify(build.accountMultipliers),
        );
    }, [build.accountMultipliers]);

    const [favoriteMonsterIds, setFavoriteMonsterIds] = useState<string[]>([]);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            const saved = window.localStorage.getItem("cam-lab-favorite-monsters");
            if (!saved) return;

            try {
                const parsed = JSON.parse(saved);
                if (!Array.isArray(parsed)) return;

                const validMonsterIds = new Set(monsters.map(({ id }) => id));
                setFavoriteMonsterIds(
                    parsed.filter(
                        (id): id is string =>
                            typeof id === "string" && validMonsterIds.has(id),
                    ),
                );
            } catch {
                window.localStorage.removeItem("cam-lab-favorite-monsters");
            }
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        if (!hasInitializedFavoriteStorage.current) {
            hasInitializedFavoriteStorage.current = true;
            return;
        }

        window.localStorage.setItem(
            "cam-lab-favorite-monsters",
            JSON.stringify(favoriteMonsterIds),
        );
    }, [favoriteMonsterIds]);

    const selectedMonster =
        monsters.find((monster) => monster.id === build.monsterId) ?? null;

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            try {
                const savedActiveBuild = window.localStorage.getItem(ACTIVE_BUILD_KEY);

                if (savedActiveBuild) {
                    const parsed = normalizeSavedBuild(
                        JSON.parse(savedActiveBuild) as Partial<Build>,
                    );
                    const savedMonster = monsters.find(
                        ({ id }) => id === parsed.monsterId,
                    );

                    if (savedMonster) {
                        setBuild((current) => ({
                            ...parsed,
                            monsterId: savedMonster.id,
                            selectedSkillId:
                                parsed.selectedSkillId &&
                                savedMonster.skillIds.includes(parsed.selectedSkillId)
                                    ? parsed.selectedSkillId
                                    : savedMonster.skillIds[0] ?? null,
                            mutations: Array.isArray(parsed.mutations)
                                ? parsed.mutations
                                : [],
                            traitId:
                                typeof parsed.traitId === "string"
                                    ? parsed.traitId
                                    : null,
                            teammateMonsterIds: Array.isArray(parsed.teammateMonsterIds)
                                ? [
                                    parsed.teammateMonsterIds[0] ?? null,
                                    parsed.teammateMonsterIds[1] ?? null,
                                ]
                                : [null, null],
                            targetStatused: parsed.targetStatused === true,
                            targetIsBoss: parsed.targetIsBoss === true,
                            weaponAttributeIds: Array.isArray(parsed.weaponAttributeIds)
                                ? parsed.weaponAttributeIds
                                : [],
                            armorAttributeIds: Array.isArray(parsed.armorAttributeIds)
                                ? parsed.armorAttributeIds
                                : [],
                            currentHpPercent:
                                typeof parsed.currentHpPercent === "number"
                                    ? parsed.currentHpPercent
                                    : 100,
                            // Account multipliers already have their own persistent key.
                            accountMultipliers: current.accountMultipliers,
                        }));
                    }
                } else {
                    // One-time fallback for users coming from the older
                    // selected-monster-only persistence.
                    const savedMonsterId =
                        window.localStorage.getItem(LEGACY_SELECTED_MONSTER_KEY);
                    const savedMonster = monsters.find(
                        ({ id }) => id === savedMonsterId,
                    );

                    if (savedMonster) {
                        setBuild((current) => ({
                            ...createDefaultBuild({ monsterId: savedMonster.id }),
                            selectedSkillId: savedMonster.skillIds[0] ?? null,
                            accountMultipliers: current.accountMultipliers,
                        }));
                    }
                }
            } catch {
                window.localStorage.removeItem(ACTIVE_BUILD_KEY);
            } finally {
                setHasLoadedActiveBuild(true);
            }
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        if (!hasLoadedActiveBuild) {
            return;
        }

        try {
            window.localStorage.setItem(
                ACTIVE_BUILD_KEY,
                JSON.stringify({
                    ...build,
                    // Stored separately; don't duplicate account state here.
                    accountMultipliers: { completedAchievementIds: [] },
                }),
            );

            // Keep the old key updated for backwards compatibility.
            if (build.monsterId) {
                window.localStorage.setItem(
                    LEGACY_SELECTED_MONSTER_KEY,
                    build.monsterId,
                );
            } else {
                window.localStorage.removeItem(LEGACY_SELECTED_MONSTER_KEY);
            }
        } catch {
            // localStorage can fail in private/restricted browser contexts.
        }
    }, [build, hasLoadedActiveBuild]);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            try {
                const saved = window.localStorage.getItem(SAVED_BUILDS_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        const slots = emptySaveSlots();
                        parsed.slice(0, SAVE_SLOT_COUNT).forEach((value, index) => {
                            if (!value || typeof value !== "object") return;
                            const candidate = value as Partial<SavedBuildSlot>;
                            const candidateBuild = candidate.build as Partial<Build> | undefined;
                            if (!candidateBuild?.monsterId) return;
                            if (!monsters.some(({ id }) => id === candidateBuild.monsterId)) return;

                            slots[index] = {
                                version: 1,
                                savedAt: typeof candidate.savedAt === "number" ? candidate.savedAt : Date.now(),
                                build: normalizeSavedBuild(candidateBuild),
                            };
                        });
                        setSavedBuildSlots(slots);
                        return;
                    }
                }

                // One-time migration from the original single-save system into Slot 1.
                const legacy = window.localStorage.getItem(LEGACY_SAVED_BUILD_KEY);
                if (!legacy) return;

                const legacyBuild = JSON.parse(legacy) as Partial<Build>;
                if (!legacyBuild.monsterId || !monsters.some(({ id }) => id === legacyBuild.monsterId)) return;

                const migrated: SavedBuildSlot = {
                    version: 1,
                    savedAt: Date.now(),
                    build: normalizeSavedBuild(legacyBuild),
                };
                const slots = emptySaveSlots();
                slots[0] = migrated;
                setSavedBuildSlots(slots);
                window.localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(slots));
            } catch {
                window.localStorage.removeItem(SAVED_BUILDS_KEY);
            }
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    function selectMonster(monster: Monster) {
        setBuild((current) => ({
            ...createDefaultBuild({ monsterId: monster.id }),
            selectedSkillId: monster.skillIds[0] ?? null,
            accountMultipliers: current.accountMultipliers,
        }));
    }

    function resetBuild() {
        if (!selectedMonster) {
            setBuild((current) => ({
                ...createDefaultBuild(),
                accountMultipliers: current.accountMultipliers,
            }));
            return;
        }

        setBuild((current) => ({
            ...createDefaultBuild({ monsterId: selectedMonster.id }),
            selectedSkillId: selectedMonster.skillIds[0] ?? null,
            accountMultipliers: current.accountMultipliers,
        }));
    }

    function toggleSelectedMonsterFavorite() {
        if (!selectedMonster) return;

        setFavoriteMonsterIds((currentIds) =>
            currentIds.includes(selectedMonster.id)
                ? currentIds.filter((id) => id !== selectedMonster.id)
                : [...currentIds, selectedMonster.id],
        );
    }

    function persistSavedBuildSlots(nextSlots: Array<SavedBuildSlot | null>): boolean {
        try {
            window.localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(nextSlots));
            setSavedBuildSlots(nextSlots);
            return true;
        } catch {
            return false;
        }
    }

    function saveBuildToSlot(slotIndex: number): boolean {
        if (!selectedMonster || slotIndex < 0 || slotIndex >= SAVE_SLOT_COUNT) return false;

        const nextSlots = [...savedBuildSlots];
        nextSlots[slotIndex] = {
            version: 1,
            savedAt: Date.now(),
            build: {
                ...build,
                accountMultipliers: { completedAchievementIds: [] },
            },
        };

        return persistSavedBuildSlots(nextSlots);
    }

    function loadBuildFromSlot(slotIndex: number): boolean {
        try {
            const savedSlot = savedBuildSlots[slotIndex];
            if (!savedSlot) return false;

            const parsed = normalizeSavedBuild(savedSlot.build);
            const savedMonster = monsters.find(({ id }) => id === parsed.monsterId);
            if (!savedMonster) return false;

            setBuild((current) => ({
                ...createDefaultBuild({ monsterId: savedMonster.id }),
                ...parsed,
                monsterId: savedMonster.id,
                selectedSkillId: parsed.selectedSkillId && savedMonster.skillIds.includes(parsed.selectedSkillId)
                    ? parsed.selectedSkillId
                    : savedMonster.skillIds[0] ?? null,
                mutations: Array.isArray(parsed.mutations) ? parsed.mutations : [],
                traitId: typeof parsed.traitId === "string" ? parsed.traitId : null,
                targetStatused: parsed.targetStatused === true,
                targetIsBoss: parsed.targetIsBoss === true,
                weaponAttributeIds: Array.isArray(parsed.weaponAttributeIds) ? parsed.weaponAttributeIds : [],
                armorAttributeIds: Array.isArray(parsed.armorAttributeIds) ? parsed.armorAttributeIds : [],
                combatContext: parsed.combatContext,
                currentHpPercent: typeof parsed.currentHpPercent === "number" ? parsed.currentHpPercent : 100,
                accountMultipliers: current.accountMultipliers,
            }));
            return true;
        } catch {
            return false;
        }
    }

    function clearBuildSlot(slotIndex: number) {
        if (slotIndex < 0 || slotIndex >= SAVE_SLOT_COUNT) return;
        const nextSlots = [...savedBuildSlots];
        nextSlots[slotIndex] = null;
        persistSavedBuildSlots(nextSlots);
    }

    return (
        <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0b111a] text-[#f6f8fc]">
            <TopNavigation />
            <SiteHeading />

            <div className="mx-auto w-full max-w-[1800px] px-3 pt-2 sm:px-5 sm:pt-3 xl:px-7 2xl:px-8">
                <AccountMultipliers
                    build={build}
                    onBuildChangeAction={setBuild}
                />
            </div>

            <nav
                aria-label="Calculator sections"
                className="sticky top-0 z-40 mx-3 mt-2 grid grid-cols-3 overflow-hidden rounded-lg border border-[#3b4759] bg-[#0d131d]/95 p-1 shadow-lg backdrop-blur sm:mx-5 sm:mt-3 lg:hidden"
            >
                {([
                    ["monster", "Monster"],
                    ["results", "Results"],
                    ["build", "Build"],
                ] as const).map(([panel, label]) => (
                    <button
                        key={panel}
                        type="button"
                        aria-current={mobilePanel === panel ? "page" : undefined}
                        onClick={() => setMobilePanel(panel)}
                        className={`min-w-0 rounded-md px-1 py-2 text-xs font-semibold transition ${
                            mobilePanel === panel
                                ? "bg-[#7182ff] text-white shadow-[0_4px_16px_rgba(113,130,255,0.28)]"
                                : "text-[#8e99ad] hover:bg-[#141c28] hover:text-white"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            <main
                className="
                    grid
                    mx-auto
                    w-full
                    max-w-[1800px]
                    gap-4
                    px-3
                    pb-5
                    pt-2
                    sm:px-5
                    lg:h-[calc(100vh-233px)]
                    lg:grid-cols-[minmax(250px,0.85fr)_minmax(420px,1.65fr)_minmax(280px,1fr)]
                    lg:overflow-hidden
                    xl:gap-5
                    xl:px-7
                    2xl:px-8
                "
            >
                <div className={`${mobilePanel === "monster" ? "block" : "hidden"} w-full min-w-0 max-w-full overflow-hidden lg:block`}>
                    <MonsterBrowser
                        monsters={monsters}
                        selectedMonster={selectedMonster}
                        onSelectAction={(monster) => {
                            selectMonster(monster);
                            setMobilePanel("results");
                        }}
                    />
                </div>

                <div className={`${mobilePanel === "results" ? "block" : "hidden"} w-full min-w-0 max-w-full overflow-hidden lg:block`}>
                    <CalculatorResults
                        monster={selectedMonster}
                        build={build}
                        isFavorite={
                            selectedMonster
                                ? favoriteMonsterIds.includes(selectedMonster.id)
                                : false
                        }
                        onToggleFavorite={toggleSelectedMonsterFavorite}
                    />
                </div>

                <div className={`${mobilePanel === "build" ? "block" : "hidden"} w-full min-w-0 max-w-full overflow-hidden lg:block`}>
                    <BuildEditor
                        monster={selectedMonster}
                        build={build}
                        onBuildChangeAction={setBuild}
                        onResetAction={resetBuild}
                        onOpenSaveBuildsAction={() => setSavedBuildsMode("save")}
                        onOpenLoadBuildsAction={() => setSavedBuildsMode("load")}
                    />
                </div>
            </main>

            <SiteFooter />

            {savedBuildsMode && (
                <SavedBuildsPanel
                    mode={savedBuildsMode}
                    currentBuild={build}
                    currentMonster={selectedMonster}
                    monsters={monsters}
                    slots={savedBuildSlots}
                    onCloseAction={() => setSavedBuildsMode(null)}
                    onSaveSlotAction={saveBuildToSlot}
                    onLoadSlotAction={loadBuildFromSlot}
                    onClearSlotAction={clearBuildSlot}
                />
            )}
        </div>
    );
}
