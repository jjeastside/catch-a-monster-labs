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
const SAVE_SLOT_COUNT = 3;

function emptySaveSlots(): Array<SavedBuildSlot | null> {
    return Array.from({ length: SAVE_SLOT_COUNT }, () => null);
}

export function AppShell() {
    const hasInitializedAccountStorage = useRef(false);
    const hasInitializedFavoriteStorage = useRef(false);
    const hasInitializedMonsterStorage = useRef(false);
    const [savedBuildsMode, setSavedBuildsMode] = useState<"save" | "load" | null>(null);
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
            const savedMonsterId = window.localStorage.getItem("cam-lab-selected-monster");
            const savedMonster = monsters.find(({ id }) => id === savedMonsterId);

            if (savedMonster) {
                selectMonster(savedMonster);
            }
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        if (!hasInitializedMonsterStorage.current) {
            hasInitializedMonsterStorage.current = true;
            return;
        }

        if (build.monsterId) {
            window.localStorage.setItem("cam-lab-selected-monster", build.monsterId);
        } else {
            window.localStorage.removeItem("cam-lab-selected-monster");
        }
    }, [build.monsterId]);

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
                                build: candidateBuild as Build,
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
                    build: legacyBuild as Build,
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

            const parsed = savedSlot.build;
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
                weaponAttributeIds: Array.isArray(parsed.weaponAttributeIds) ? parsed.weaponAttributeIds : [],
                armorAttributeIds: Array.isArray(parsed.armorAttributeIds) ? parsed.armorAttributeIds : [],
                combatContext: parsed.combatContext ?? "standard",
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
        <div className="min-h-screen bg-[#181c25] text-[#f2f4f8]">
            <TopNavigation />
            <SiteHeading />

            <div className="mx-auto w-full max-w-[1800px] px-4 pt-3 sm:px-5 xl:px-7 2xl:px-8">
                <AccountMultipliers
                    build={build}
                    onBuildChangeAction={setBuild}
                />
            </div>

            <main
                className="
                    grid
                    mx-auto
                    w-full
                    max-w-[1800px]
                    gap-4
                    px-4
                    pb-5
                    pt-3
                    sm:px-5
                    lg:h-[calc(100vh-233px)]
                    lg:grid-cols-[minmax(250px,0.85fr)_minmax(420px,1.65fr)_minmax(280px,1fr)]
                    lg:overflow-hidden
                    xl:gap-5
                    xl:px-7
                    2xl:px-8
                "
            >
                <MonsterBrowser
                    monsters={monsters}
                    selectedMonster={selectedMonster}
                    onSelectAction={selectMonster}
                />

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

                <BuildEditor
                    monster={selectedMonster}
                    build={build}
                    onBuildChangeAction={setBuild}
                    onResetAction={resetBuild}
                    onOpenSaveBuildsAction={() => setSavedBuildsMode("save")}
                    onOpenLoadBuildsAction={() => setSavedBuildsMode("load")}
                />
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