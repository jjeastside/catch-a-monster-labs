"use client";

import { useEffect, useRef, useState } from "react";

import { monsters } from "../data/monsters";
import { createDefaultBuild, type Build } from "../types/build";
import type { Monster } from "../types/monster";

import { BuildEditor } from "./build-editor";
import { AccountMultipliers } from "./account-multipliers";
import { CalculatorResults } from "./calculator-results";
import { MonsterBrowser } from "./monster-browser";
import { TopNavigation } from "./top-navigation";

export function AppShell() {
    const hasInitializedAccountStorage = useRef(false);
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
        const saved = window.localStorage.getItem("monster-lab-account-multipliers");
        if (!saved) return;

        try {
            const parsed = JSON.parse(saved) as Partial<Build["accountMultipliers"]>;
            setBuild((current) => ({
                ...current,
                accountMultipliers: {
                    indexMania: parsed.indexMania === true,
                    petQuestAchievement: parsed.petQuestAchievement === true,
                    pathOfProgress: parsed.pathOfProgress === true,
                },
            }));
        } catch {
            window.localStorage.removeItem("monster-lab-account-multipliers");
        }
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
    const selectedMonster =
        monsters.find((monster) => monster.id === build.monsterId) ?? null;

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
        if (!selectedMonster) {
            return;
        }

        setFavoriteMonsterIds((currentIds) =>
            currentIds.includes(selectedMonster.id)
                ? currentIds.filter((id) => id !== selectedMonster.id)
                : [...currentIds, selectedMonster.id],
        );
    }

    return (
        <div className="min-h-screen bg-[#090b10] text-[#f2f4f8]">
            <TopNavigation />

            <div className="w-full px-4 pt-3 lg:px-5">
                <AccountMultipliers
                    build={build}
                    onBuildChangeAction={setBuild}
                />
            </div>

            <main
                className="
                    grid
                    w-full
                    gap-4
                    p-4
                    pt-3
                    lg:h-[calc(100vh-170px)]
                    lg:grid-cols-[minmax(250px,0.85fr)_minmax(420px,1.65fr)_minmax(280px,1fr)]
                    lg:overflow-hidden
                    lg:p-5
                "
            >
                <MonsterBrowser
                    monsters={monsters}
                    selectedMonster={selectedMonster}
                    onSelect={selectMonster}
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
                />
            </main>
        </div>
    );
}