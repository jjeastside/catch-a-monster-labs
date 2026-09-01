"use client";

import Link from "next/link";

import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { assetPath } from "../lib/asset-path";
import type { GeneratedMonster } from "../types/monster";

function getEvolutionChildren(monsterId: string): GeneratedMonster[] {
    return GENERATED_MONSTERS
        .filter((monster) => monster.evolutionSource === monsterId)
        .sort((a, b) => a.indexPosition - b.indexPosition);
}

function EvolutionNodeCard({
    monster,
    depth,
    selectedMonsterId,
    compact,
    onMonsterSelect,
    linkProfiles,
}: {
    monster: GeneratedMonster;
    depth: number;
    selectedMonsterId: string;
    compact: boolean;
    onMonsterSelect?: (monsterId: string) => void;
    linkProfiles: boolean;
}) {
    const selected = monster.id === selectedMonsterId;
    const cardClass = `${compact ? "w-[108px] p-2" : "w-[132px] p-3"} rounded-xl border text-center transition ${
        selected
            ? "border-[#7182ff] bg-[#18213a] ring-1 ring-[#7182ff]/50"
            : "border-[#344050] bg-[#111925] hover:border-[#7182ff]/60"
    }`;

    const content = (
        <>
            <div className={`mx-auto grid ${compact ? "size-14" : "size-16"} place-items-center overflow-hidden rounded-lg bg-[#0b111a]`}>
                {monster.image ? (
                    <img
                        src={assetPath(monster.image)}
                        alt={monster.name}
                        className="h-full w-full object-contain p-1"
                    />
                ) : null}
            </div>
            <p
                className={`mt-2 truncate ${compact ? "text-[9px]" : "text-[10px]"} font-black text-[#dbe2ee]`}
                title={monster.name}
            >
                {monster.name}
            </p>
            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#657287]">
                {depth === 0 ? "Base" : `Stage ${depth}`}
            </p>
        </>
    );

    if (linkProfiles) {
        return (
            <Link href={`/monster-database/${monster.id}`} className={cardClass}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            className={cardClass}
            onClick={() => onMonsterSelect?.(monster.id)}
        >
            {content}
        </button>
    );
}

function EvolutionBranch({
    monster,
    depth,
    selectedMonsterId,
    compact,
    onMonsterSelect,
    linkProfiles,
}: {
    monster: GeneratedMonster;
    depth: number;
    selectedMonsterId: string;
    compact: boolean;
    onMonsterSelect?: (monsterId: string) => void;
    linkProfiles: boolean;
}) {
    const children = getEvolutionChildren(monster.id);

    return (
        <div className="flex items-center">
            <EvolutionNodeCard
                monster={monster}
                depth={depth}
                selectedMonsterId={selectedMonsterId}
                compact={compact}
                onMonsterSelect={onMonsterSelect}
                linkProfiles={linkProfiles}
            />

            {children.length > 0 ? (
                <div className="flex items-center">
                    <div className={`${compact ? "w-4" : "w-6"} h-px bg-[#526078]`} />

                    <div className={`relative flex flex-col ${compact ? "gap-3" : "gap-4"} pl-5`}>
                        {children.length > 1 ? (
                            <div className="absolute bottom-[22px] left-0 top-[22px] w-px bg-[#526078]" />
                        ) : null}

                        {children.map((child) => (
                            <div
                                key={child.id}
                                className="relative before:absolute before:-left-5 before:top-1/2 before:h-px before:w-5 before:bg-[#526078]"
                            >
                                <EvolutionBranch
                                    monster={child}
                                    depth={depth + 1}
                                    selectedMonsterId={selectedMonsterId}
                                    compact={compact}
                                    onMonsterSelect={onMonsterSelect}
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
    onMonsterSelect,
    linkProfiles = false,
}: {
    rootMonster: GeneratedMonster;
    selectedMonsterId: string;
    compact?: boolean;
    onMonsterSelect?: (monsterId: string) => void;
    linkProfiles?: boolean;
}) {
    return (
        <div className="overflow-x-auto pb-2">
            <div className="min-w-max py-1 pr-4">
                <EvolutionBranch
                    monster={rootMonster}
                    depth={0}
                    selectedMonsterId={selectedMonsterId}
                    compact={compact}
                    onMonsterSelect={onMonsterSelect}
                    linkProfiles={linkProfiles}
                />
            </div>
        </div>
    );
}
