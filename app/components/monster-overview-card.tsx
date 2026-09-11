"use client";

import {useEffect, useState} from "react";
import {createPortal} from "react-dom";

import type {Monster} from "../types/monster";
import {getSkill, getSkillDisplayName} from "../data/skills";
import {assetPath} from "../lib/asset-path";
import {GENERATED_MONSTERS} from "../data/generated/monsters";
import {EvolutionTree, getEvolutionFamily, getEvolutionRoot} from "./evolution-tree";

type MonsterOverviewCardProps = {
    monster: Monster;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onMonsterSelectAction?: (monster: Monster) => void;
};

export const rarityBadgeClasses: Record<Monster["rarity"], string> = {
    Common: "border-[#707070] bg-[#2b2b2b] text-[#d1d1d1]",
    Uncommon: "border-[#28a745] bg-[#123d1d] text-[#65e47a]",
    Rare: "border-[#299ddd] bg-[#102f46] text-[#6bc8ff]",
    Epic: "border-[#bd45d8] bg-[#411546] text-[#eb7cff]",
    Legendary: "border-[#ff9f43] bg-[#4a2910] text-[#ffb866]",
    Mythical:
        "border-[#bd61e8] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.58),rgba(0,0,0,0.08)),linear-gradient(to_right,#e53b3b,#f08324,#f0d832,#35c95c,#249fd5,#a43fc4)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
    Secret:
        "border-[#ff2738] bg-[linear-gradient(to_top,#c91b28,#74101a_48%,#18070b)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",

    Void:
        "border-[#28e9c5] bg-[linear-gradient(135deg,#4acb28,#16b879_45%,#078fa8)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
};

export const rarityImageClasses: Record<Monster["rarity"], string> = {
    Common:
        "border-[#707070] bg-gradient-to-br from-[#353535] to-[#171717]",
    Uncommon:
        "border-[#28a745] bg-gradient-to-br from-[#174d24] to-[#0c2512]",
    Rare:
        "border-[#299ddd] bg-gradient-to-br from-[#17486a] to-[#0b2131]",
    Epic:
        "border-[#bd45d8] bg-gradient-to-br from-[#5b1e64] to-[#27102d]",
    Legendary:
        "border-[#ff9f43] bg-gradient-to-br from-[#6a3a12] to-[#291608]",
    Mythical:
        "border-transparent bg-[linear-gradient(to_right,#ff3347,#ff8a1f,#ffe13b,#35e56f,#22bde8,#b43cff)] shadow-[0_0_24px_rgba(111,91,255,0.42),0_12px_30px_rgba(0,0,0,0.34)]",
    Secret:
        "border-transparent bg-[linear-gradient(135deg,#5d0000,#ff1f1f,#ff7a00,#ffd400,#78ff00)]",
    Void:
        "border-transparent bg-[linear-gradient(135deg,#84ff00,#4cff8f,#00f2ff,#00b7ff,#0096c7)]",
};

const elementIconPaths: Record<Monster["element"], string> = {
    Common: "/element-icons/common.png",
    Grass: "/element-icons/grass.png",
    Water: "/element-icons/water.png",
    Fire: "/element-icons/fire.png",
    Ice: "/element-icons/ice.png",
    Ground: "/element-icons/ground.png",
    Mechanical: "/element-icons/mechanical.png",
    Dragon: "/element-icons/dragon.png",
    Light: "/element-icons/light.png",
    Dark: "/element-icons/dark.png",
    Electric: "/element-icons/electric.png",
};

function getSourceLabel(source: Monster["sources"][number]): string {
    if (
        source.type === "Island Spawn"
    ) {
        return source.location || source.name;
    }

    if (source.type === "Evolution") {
        return source.name.endsWith("Evolution")
            ? source.name
            : `${source.name} Evolution`;
    }

    return source.name;
}

function getUniqueSourceLabels(monster: Monster): string[] {
    return [
        ...new Set(
            monster.sources.map((source) =>
                getSourceLabel(source),
            ),
        ),
    ];
}

function isCurrentlyObtainable(monster: Monster): boolean {
    return monster.sources.some((source) => source.status === "Current");
}

function formatList(values: string[]): string {
    if (values.length <= 1) {
        return values[0] ?? "";
    }

    if (values.length === 2) {
        return `${values[0]} and ${values[1]}`;
    }

    return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function createSourceText(monster: Monster): string {
    const descriptions: string[] = [];
    const riftLocationsByName = new Map<string, Set<string>>();

    for (const source of monster.sources) {
        if (source.type === "Rift") {
            const locations =
                riftLocationsByName.get(source.name) ?? new Set<string>();

            if (source.location) {
                locations.add(source.location);
            }

            riftLocationsByName.set(source.name, locations);
            continue;
        }

        switch (source.type) {
            case "Event":
                descriptions.push(`during the ${source.name}`);
                break;

            case "Battle Pass":
                descriptions.push(
                    `from the ${source.name} Battle Pass`,
                );
                break;

            case "Evolution":
                descriptions.push(`by evolving ${source.name}`);
                break;

            default: {
                const locationText = source.location
                    ? ` at ${source.location}`
                    : "";
                const timeText = source.time
                    ? ` at ${source.time.toLowerCase()}`
                    : "";
                const weatherText = source.weather?.length
                    ? ` during ${source.weather.join(" or ")} weather`
                    : "";
                const conditionText = source.condition
                    ? source.condition.toLowerCase() === "night and aurora"
                        ? " only at night during Aurora weather"
                        : ` when ${source.condition}`
                    : "";

                if (source.type === "Island Spawn") {
                    descriptions.push(
                        `by defeating and catching roaming monsters on ${source.location || source.name}${timeText}${weatherText}${conditionText}`,
                    );
                } else if (
                    source.name === "First-Time Player Reward"
                ) {
                    descriptions.push(
                        "as a First-Time Player Reward",
                    );
                } else if (source.name.endsWith("Egg")) {
                    descriptions.push(
                        `from the ${source.name}${locationText}`,
                    );
                } else {
                    descriptions.push(
                        `from ${source.name}${locationText}${timeText}${weatherText}${conditionText}`,
                    );
                }
            }
        }
    }

    for (const [riftName, locations] of riftLocationsByName) {
        const locationList = formatList([...locations]);

        descriptions.push(
            locationList
                ? `from ${riftName} located in ${locationList}`
                : `from ${riftName}`,
        );
    }

    return descriptions.join(" or ");
}

function createDescription(monster: Monster): string {
    if (monster.description) {
        return monster.description;
    }

    const skillNames = monster.skillIds
        .map((skillId) => {
            const skill = getSkill(skillId);
            return skill ? getSkillDisplayName(skill.name) : null;
        })
        .filter((name): name is string => Boolean(name));

    const skillText = skillNames.length
        ? ` It can use ${formatList(skillNames)}.`
        : "";

    const monsterClassification =
        `${monster.element}-type ${monster.rarity} monster`;

    if (!isCurrentlyObtainable(monster)) {
        return `A ${monsterClassification} that is currently unobtainable.${skillText}`;
    }

    const sourceText = createSourceText(monster);

    return `A ${monsterClassification} obtainable ${sourceText}.${skillText}`;
}

export function getMonsterPortraitStyles(monster: Monster) {
    const portraitStyle = monster.rarity === "Legendary"
        ? {
            background: "linear-gradient(to top, #c97813 0%, #a0520d 32%, #6b3009 53%, #351708 72%, #160c09 87%, #090808 100%)",
        }
        : monster.rarity === "Mythical"
            ? {
                background: "linear-gradient(to bottom, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.78) 30%, rgba(0,0,0,0.38) 62%, rgba(0,0,0,0.04) 100%), linear-gradient(to right, #e53b3b 0%, #f08324 18%, #f0d832 36%, #35c95c 55%, #249fd5 76%, #a43fc4 100%)",
            }
            : monster.rarity === "Secret"
                ? {
                    background: "linear-gradient(to top, #d91f2c 0%, #bb1724 18%, #77101a 38%, #3a0911 60%, #18070b 79%, #080708 100%)",
                }
                : undefined;
    const portraitFrameStyle = monster.rarity === "Mythical"
        ? { border: "none", padding: "2px" }
        : monster.rarity === "Legendary"
            ? { border: "none", padding: "2px", background: "#f28a22" }
            : monster.rarity === "Secret"
                ? { border: "none", padding: "2px", background: "#ff2738" }
                : monster.rarity === "Void"
                    ? {
                        border: "none",
                        padding: "2px",
                        background: "linear-gradient(135deg, #84ff00 0%, #4cff8f 32%, #00f2ff 68%, #0096c7 100%)",
                    }
                    : undefined;

    return { portraitStyle, portraitFrameStyle };
}

export function MonsterOverviewCard({ monster, isFavorite, onToggleFavorite, onMonsterSelectAction }: MonsterOverviewCardProps) {
    const [evolutionOpen, setEvolutionOpen] = useState(false);
    const elementIcon = elementIconPaths[monster.element];
    const evolutionRoot = getEvolutionRoot(monster.id);
    const evolutionFamily = evolutionRoot ? getEvolutionFamily(evolutionRoot) : [];
    const hasEvolutionFamily = evolutionFamily.length > 1;
    const evolutionSource = monster.sources.find((source) => source.type === "Evolution");
    const evolutionLabel = evolutionSource
        ? (evolutionSource.name.endsWith("Evolution") ? evolutionSource.name : `${evolutionSource.name} Evolution`)
        : "Evolution available";

    useEffect(() => {
        if (!evolutionOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setEvolutionOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [evolutionOpen]);
    const { portraitStyle, portraitFrameStyle } = getMonsterPortraitStyles(monster);
    return (
        <section className="relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-xl border border-[#344050] bg-[#141c28] p-4 sm:flex-row sm:gap-6 sm:p-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-64 bg-[radial-gradient(circle_at_left,rgba(117,133,255,0.09),transparent_70%)]" />
            <div
                className={`relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 p-[3px] shadow-[0_12px_30px_rgba(0,0,0,0.28)] sm:size-40 xl:size-44 ${
                    rarityImageClasses[monster.rarity]
                }`}
                style={portraitFrameStyle}
            >
                <div
                    className="grid h-full w-full place-items-center overflow-hidden rounded-[13px] bg-[#10141d]/85"
                    style={portraitStyle}
                >
                    {monster.image ? (
                        <img
                            src={assetPath(monster.image)}
                            alt={monster.name}
                            className="h-full w-full object-contain p-1 drop-shadow-[0_10px_10px_rgba(0,0,0,0.38)]"
                        />
                    ) : (
                        <span className="text-xl font-black text-[#7182ff]">
                {monster.name.slice(0, 2).toUpperCase()}
            </span>
                    )}
                </div>
            </div>

            <div className="relative min-w-0 flex-1 py-1">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">
                            Monster Overview
                        </p>

                        <h2 className="mt-1 break-words text-2xl font-bold tracking-tight text-[#f6f8fc] sm:text-3xl">
                            {monster.name}
                        </h2>
                    </div>

                    <button
                        type="button"
                        aria-label={
                            isFavorite
                                ? `Remove ${monster.name} from favorites`
                                : `Add ${monster.name} to favorites`
                        }
                        aria-pressed={isFavorite}
                        onClick={onToggleFavorite}
                        className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#344050] bg-[#0f1620] text-xl text-[#7182ff] transition hover:border-[#7182ff]"
                    >
                        {isFavorite ? "★" : "☆"}
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#344050] bg-[#0f1620] px-2.5 text-xs leading-none text-[#e3e8f1]">
                        <img
                            src={assetPath(elementIcon)}
                            alt=""
                            className="size-4 object-contain"
                        />
                        {monster.element}
                    </span>

                    <span
                        className={`inline-flex h-7 items-center justify-center rounded-md border px-2.5 text-xs font-semibold leading-none ${
                            rarityBadgeClasses[monster.rarity]
                        }`}
                    >
    {monster.rarity}
</span>

                    {!isCurrentlyObtainable(monster) && (
                        <span className="rounded-md border border-[#ef4444]/40 bg-[#3a171b]/70 px-2.5 py-1 text-xs font-semibold text-[#ff7b86]">
                            Currently Unobtainable
                        </span>
                    )}

                    {getUniqueSourceLabels(monster)
                        .filter((sourceLabel) => !monster.sources.some((source) => source.type === "Evolution" && getSourceLabel(source) === sourceLabel))
                        .map((sourceLabel) => (
                            <span
                                key={`${monster.id}-${sourceLabel}`}
                                className="rounded-md border border-[#344050] bg-[#0f1620] px-2.5 py-1 text-xs text-[#e3e8f1]"
                            >
                                {sourceLabel}
                            </span>
                        ))}

                    {hasEvolutionFamily && (
                        <button
                            type="button"
                            onClick={() => setEvolutionOpen(true)}
                            className="group inline-flex items-center gap-1.5 rounded-md border border-[#344050] bg-[#0f1620] px-2.5 py-1 text-xs font-medium text-[#e3e8f1] transition hover:border-[#7182ff]/70 hover:bg-[#151e2e] hover:text-white hover:shadow-[0_0_14px_rgba(113,130,255,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7182ff]/60"
                            aria-haspopup="dialog"
                        >
                            <img
                                src={assetPath("/icons/evolution.png")}
                                alt=""
                                aria-hidden="true"
                                className="h-5 w-5 shrink-0 object-contain opacity-100 transition group-hover:scale-105"
                            />
                            {evolutionLabel}
                            <span aria-hidden="true" className="ml-0.5 text-[11px] text-[#7f8b9e] transition group-hover:text-[#aab5c8]">›</span>
                        </button>
                    )}
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-[#aab2c1]">
                    {createDescription(monster)}
                </p>

            </div>

            {evolutionOpen && evolutionRoot && typeof document !== "undefined"
                ? createPortal(
                    <div
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-[#05080d]/75 p-3 backdrop-blur-[2px] sm:p-6"
                        role="presentation"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setEvolutionOpen(false);
                        }}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="evolution-tree-title"
                            className="max-h-[88vh] w-full max-w-[850px] overflow-hidden rounded-2xl border border-[#41536c] bg-[#101925] shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-[#2f3c4e] px-4 py-4 sm:px-6">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border border-[#344050] bg-[#0f1620]">
                                        <img
                                            src={assetPath("/icons/evolution.png")}
                                            alt=""
                                            aria-hidden="true"
                                            className="size-7 object-contain"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                            <h2 id="evolution-tree-title" className="text-xl font-bold text-[#f5f7fb] sm:text-2xl">Evolution Tree</h2>
                                            <span className="text-xs font-semibold text-[#8e99ad]">{evolutionFamily.length} forms</span>
                                        </div>
                                        <p className="mt-0.5 text-sm text-[#aab2c1]">{evolutionRoot.name} Evolution Line</p>
                                        <p className="mt-2 text-xs text-[#7f8b9e]">Click a monster to view it in the calculator.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEvolutionOpen(false)}
                                    aria-label="Close evolution tree"
                                    className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#344050] bg-[#0d141e] text-xl text-[#c8d0dc] transition hover:border-[#5a6a80] hover:text-white"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="max-h-[calc(88vh-118px)] overflow-auto px-4 py-5 sm:px-6">
                                <EvolutionTree
                                    rootMonster={evolutionRoot}
                                    selectedMonsterId={monster.id}
                                    compact={false}
                                    onMonsterSelectAction={(monsterId) => {
                                        const selected = GENERATED_MONSTERS.find((candidate) => candidate.id === monsterId);
                                        if (selected) onMonsterSelectAction?.(selected);
                                        setEvolutionOpen(false);
                                    }}
                                />
                            </div>
                        </section>
                    </div>,
                    document.body,
                )
                : null}
        </section>
    );
}
