"use client";

import Link from "next/link";

import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { assetPath } from "../lib/asset-path";
import type { GeneratedMonster, Monster } from "../types/monster";

const rarityNodeClasses: Record<Monster["rarity"], string> = {
    Common: "border-[#707070] bg-gradient-to-br from-[#292929] to-[#11151c]",
    Uncommon: "border-[#28a745] bg-gradient-to-br from-[#174d24] to-[#0d1913]",
    Rare: "border-[#299ddd] bg-gradient-to-br from-[#17486a] to-[#0b1620]",
    Epic: "border-[#bd45d8] bg-gradient-to-br from-[#5b1e64] to-[#17121d]",
    Legendary: "border-[#ff9f43] bg-gradient-to-br from-[#6a3a12] to-[#1b130c]",
    Mythical: "border-transparent bg-[linear-gradient(to_right,#ff3347,#ff8a1f,#ffe13b,#35e56f,#22bde8,#b43cff)]",
    Secret: "border-transparent bg-[linear-gradient(135deg,#5d0000,#ff1f1f,#ff7a00,#ffd400,#78ff00)]",
    Void: "border-transparent bg-[linear-gradient(135deg,#84ff00,#4cff8f,#00f2ff,#00b7ff,#0096c7)]",
};

const rarityBadgeClasses: Record<Monster["rarity"], string> = {
    Common: "border-[#707070] bg-[#20242b] text-[#d1d1d1]",
    Uncommon: "border-[#28a745] bg-[#123d1d] text-[#65e47a]",
    Rare: "border-[#299ddd] bg-[#102f46] text-[#6bc8ff]",
    Epic: "border-[#bd45d8] bg-[#411546] text-[#eb7cff]",
    Legendary: "border-[#ff9f43] bg-[#4a2910] text-[#ffb866]",
    Mythical: "border-[#bd61e8] bg-[linear-gradient(to_right,#d83f4f,#d98731,#b4a52b,#47a55f,#3d83a4,#8c4ca6)] text-white",
    Secret: "border-[#ff2738] bg-[#4a1118] text-[#ff7b86]",
    Void: "border-[#28e9c5] bg-[#123c3c] text-[#67f2dd]",
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

export function getEvolutionChildren(monsterId: string): GeneratedMonster[] {
    return GENERATED_MONSTERS
        .filter((monster) => monster.evolutionSource === monsterId)
        .sort((a, b) => a.indexPosition - b.indexPosition);
}

export function getEvolutionRoot(monsterId: string): GeneratedMonster | null {
    let current = GENERATED_MONSTERS.find((monster) => monster.id === monsterId) ?? null;
    const seen = new Set<string>();

    while (current?.evolutionSource && !seen.has(current.id)) {
        seen.add(current.id);
        const parent = GENERATED_MONSTERS.find((monster) => monster.id === current?.evolutionSource);
        if (!parent) break;
        current = parent;
    }

    return current;
}

export function getEvolutionFamily(rootMonster: GeneratedMonster): GeneratedMonster[] {
    const family: GeneratedMonster[] = [];
    const visit = (monster: GeneratedMonster) => {
        family.push(monster);
        getEvolutionChildren(monster.id).forEach(visit);
    };
    visit(rootMonster);
    return family;
}

function EvolutionNodeCard({
    monster,
    selectedMonsterId,
    compact,
    onMonsterSelectAction,
    linkProfiles,
}: {
    monster: GeneratedMonster;
    selectedMonsterId: string;
    compact: boolean;
    onMonsterSelectAction?: (monsterId: string) => void;
    linkProfiles: boolean;
}) {
    const selected = monster.id === selectedMonsterId;
    const frameClass = rarityNodeClasses[monster.rarity];
    const cardClass = `${compact ? "w-[176px] p-2" : "w-[220px] p-2.5"} group rounded-xl border bg-[#111925] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7182ff] ${
        selected
            ? "border-[#7182ff] ring-2 ring-[#7182ff]/55 shadow-[0_0_22px_rgba(113,130,255,0.18)]"
            : "border-[#344050] hover:border-[#7182ff]/65 hover:bg-[#151f2d]"
    }`;

    const content = (
        <div className="flex min-w-0 items-center gap-3">
            <div className={`grid ${compact ? "size-14" : "size-[72px]"} shrink-0 place-items-center rounded-lg border p-[2px] ${frameClass}`}>
                <div className="grid h-full w-full place-items-center overflow-hidden rounded-[6px] bg-[#0b111a]/90">
                    {monster.image ? (
                        <img
                            src={assetPath(monster.image)}
                            alt=""
                            className="h-full w-full object-contain p-1"
                        />
                    ) : (
                        <span className="text-xs font-black text-[#7182ff]">{monster.name.slice(0, 2).toUpperCase()}</span>
                    )}
                </div>
            </div>

            <div className="min-w-0 flex-1">
                <p className={`${compact ? "text-xs" : "text-sm"} truncate font-bold text-[#f4f7fb]`} title={monster.name}>
                    {monster.name}
                </p>
                <span className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${rarityBadgeClasses[monster.rarity]}`}>
                    {monster.rarity}
                </span>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#aab2c1]">
                    <img src={assetPath(elementIconPaths[monster.element])} alt="" className="size-3.5 object-contain" />
                    <span>{monster.element}</span>
                </div>
            </div>
        </div>
    );

    if (linkProfiles) {
        return (
            <Link href={`/monster-database/${monster.id}`} className={cardClass} aria-current={selected ? "true" : undefined}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            className={cardClass}
            aria-current={selected ? "true" : undefined}
            onClick={() => onMonsterSelectAction?.(monster.id)}
        >
            {content}
        </button>
    );
}

function EvolutionBranch({
    monster,
    selectedMonsterId,
    compact,
    onMonsterSelectAction,
    linkProfiles,
}: {
    monster: GeneratedMonster;
    selectedMonsterId: string;
    compact: boolean;
    onMonsterSelectAction?: (monsterId: string) => void;
    linkProfiles: boolean;
}) {
    const children = getEvolutionChildren(monster.id);

    return (
        <div className="flex items-center">
            <EvolutionNodeCard
                monster={monster}
                selectedMonsterId={selectedMonsterId}
                compact={compact}
                onMonsterSelectAction={onMonsterSelectAction}
                linkProfiles={linkProfiles}
            />

            {children.length > 0 ? (
                <div className="flex items-center">
                    <div className={`${compact ? "w-5" : "w-8"} h-px bg-[#60708a]`} />
                    <div className={`relative flex flex-col ${compact ? "gap-3" : "gap-4"} pl-6`}>
                        {children.length > 1 ? (
                            <div className="absolute bottom-[28px] left-0 top-[28px] w-px bg-[#60708a]" />
                        ) : null}

                        {children.map((child) => (
                            <div
                                key={child.id}
                                className="relative before:absolute before:-left-6 before:top-1/2 before:h-px before:w-6 before:bg-[#60708a]"
                            >
                                <EvolutionBranch
                                    monster={child}
                                    selectedMonsterId={selectedMonsterId}
                                    compact={compact}
                                    onMonsterSelectAction={onMonsterSelectAction}
                                    linkProfiles={linkProfiles}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function EvolutionTree({
    rootMonster,
    selectedMonsterId,
    compact = false,
    onMonsterSelectAction,
    linkProfiles = false,
}: {
    rootMonster: GeneratedMonster;
    selectedMonsterId: string;
    compact?: boolean;
    onMonsterSelectAction?: (monsterId: string) => void;
    linkProfiles?: boolean;
}) {
    return (
        <div className="overflow-x-auto pb-2">
            <div className="min-w-max py-1 pr-4">
                <EvolutionBranch
                    monster={rootMonster}
                    selectedMonsterId={selectedMonsterId}
                    compact={compact}
                    onMonsterSelectAction={onMonsterSelectAction}
                    linkProfiles={linkProfiles}
                />
            </div>
        </div>
    );
}
