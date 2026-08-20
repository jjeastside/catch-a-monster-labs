"use client";

import { useMemo, useState } from "react";
import { PASSIVE_DEFINITIONS } from "../data/passives";
import { assetPath } from "../lib/asset-path";
import type { Monster } from "../types/monster";
import { Panel } from "./panel";

const elementColors: Record<string, string> = {
    Common: "#7f8b9e", Grass: "#79e3ae", Water: "#70b7ff",
    Fire: "#ff9d6c", Ice: "#9ee7ff", Ground: "#d6a66f",
};

const elementIconPaths: Record<Monster["element"], string> = {
    Common: "/element-icons/common.png",
    Grass: "/element-icons/grass.png",
    Water: "/element-icons/water.png",
    Fire: "/element-icons/fire.png",
    Ice: "/element-icons/ice.png",
    Ground: "/element-icons/ground.png",
};

const rarityPortraitClasses: Record<Monster["rarity"], string> = {
    Common: "border-[#707070] from-[#353535] to-[#171717]",
    Uncommon: "border-[#28a745] from-[#174d24] to-[#0c2512]",
    Rare: "border-[#299ddd] from-[#17486a] to-[#0b2131]",
    Epic: "border-[#bd45d8] from-[#5b1e64] to-[#27102d]",
    Legendary: "border-[#ff9f43] from-[#6a3a12] to-[#291608]",
    Mythical: "border-transparent bg-[linear-gradient(to_right,#ff3347,#ff8a1f,#ffe13b,#35e56f,#22bde8,#b43cff)] shadow-[0_0_12px_rgba(124,107,255,0.38)]",
    Secret: "border-[#ff7139] from-[#5d1714] to-[#21130b]",
    Void: "border-[#35e9d0] from-[#123c43] to-[#101d2b]",
};

type MonsterBrowserProps = {
    monsters: Monster[];
    selectedMonster: Monster | null;
    onSelectAction: (monster: Monster) => void;
};

type EvolutionFilter = "all" | "can-evolve" | "evolved" | "standard";
type PassiveFilter = "all" | string;
const selectClassName = "min-w-0 rounded-md border border-[#344050] bg-[#141c28] px-3 py-2 text-xs text-[#bfc7d5] outline-none focus:border-[#7182ff]";

type MonsterOptionProps = {
    monster: Monster;
    selected: boolean;
    onSelect: () => void;
    compact?: boolean;
};

function MonsterOption({ monster, selected, onSelect, compact = false }: MonsterOptionProps) {
    const color = elementColors[monster.element] ?? "#7f8b9e";
    const elementIcon = elementIconPaths[monster.element];
    const portraitBackground = "bg-[#111722]/90";
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

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group flex w-full items-center rounded-xl border text-left transition ${compact ? "min-h-[58px] gap-2 px-2.5 py-1.5" : "min-h-[72px] gap-3 px-3 py-2"} ${selected ? "border-[#7182ff] bg-[#202846] shadow-[inset_3px_0_0_#7182ff]" : "border-[#344050] bg-[#141c28] hover:border-[#5c6a80] hover:bg-[#1b202b]"}`}
        >
            <span
                className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border bg-gradient-to-br p-[2px] ${compact ? "size-11" : "size-14"} ${rarityPortraitClasses[monster.rarity]}`}
                style={portraitFrameStyle}
            >
                <span
                    className={`grid h-full w-full place-items-center overflow-hidden rounded-[9px] ${portraitBackground}`}
                    style={portraitStyle}
                >
                    {monster.image ? (
                        <img
                            src={assetPath(monster.image)}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-contain p-0.5 transition-transform duration-200 group-hover:scale-110"
                        />
                    ) : (
                        <span className="text-xs font-black" style={{ color }}>
                            {monster.name.slice(0, 2).toUpperCase()}
                        </span>
                    )}
                </span>
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug text-[#e3e8f1]">
                    {monster.name}
                </span>
                <span className={`${compact ? "mt-0.5" : "mt-1"} flex min-w-0 items-center text-xs text-[#8e99ad]`}>
                    <span className="flex shrink-0 items-center gap-1 font-medium" style={{ color }}>
                        <img src={assetPath(elementIcon)} alt="" className="size-4 object-contain" />
                        {monster.element}
                    </span>
                </span>
            </span>

            <span className={`grid shrink-0 place-items-center text-xl text-[#7f8b9e] ${compact ? "size-8" : "size-9"}`} aria-label={`Favorite ${monster.name}`}>
                ☆
            </span>
        </button>
    );
}

export function MonsterBrowser({ monsters, selectedMonster, onSelectAction }: MonsterBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [rarityFilter, setRarityFilter] = useState("all");
    const [elementFilter, setElementFilter] = useState("all");
    const [evolutionFilter, setEvolutionFilter] = useState<EvolutionFilter>("all");
    const [passiveFilter, setPassiveFilter] = useState<PassiveFilter>("all");
    const [showAllMonsters, setShowAllMonsters] = useState(false);
    const [visibleMonsterCount, setVisibleMonsterCount] = useState(60);

    const filterOptions = useMemo(() => ({
        sources: [...new Set(monsters.flatMap((monster) =>
            monster.sources.map((source) => source.type),
        ))].filter((source) => source !== "Evolution").sort(),
        rarities: [...new Set(monsters.map((monster) => monster.rarity))].sort(),
        elements: [...new Set(monsters.map((monster) => monster.element))].sort(),
        passives: [...new Set(monsters.flatMap((monster) =>
            (monster.passives ?? []).map((passive) => PASSIVE_DEFINITIONS[passive.id].name),
        ))].sort(),
    }), [monsters]);

    const filteredMonsters = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return monsters.filter((monster) => {
            const searchableValues = [
                monster.name, monster.id, monster.element, monster.rarity,
                ...monster.sources.flatMap((source) => [
                    source.type, source.name, source.location ?? "",
                ]),
                ...(monster.passives ?? []).map((passive) => PASSIVE_DEFINITIONS[passive.id].name),
            ];
            const matchesSearch = !query || searchableValues.some((value) =>
                value.toLowerCase().includes(query),
            );
            const matchesSource = sourceFilter === "all" ||
                monster.sources.some((source) => source.type === sourceFilter);
            const matchesRarity = rarityFilter === "all" || monster.rarity === rarityFilter;
            const matchesElement = elementFilter === "all" || monster.element === elementFilter;
            const matchesEvolution = evolutionFilter === "all" ||
                (evolutionFilter === "can-evolve" && monster.hasEvolution) ||
                (evolutionFilter === "evolved" && monster.isEvolved === true) ||
                (evolutionFilter === "standard" && !monster.hasEvolution && monster.isEvolved !== true);
            const passiveNames = (monster.passives ?? []).map((passive) =>
                PASSIVE_DEFINITIONS[passive.id].name,
            );
            const matchesPassive = passiveFilter === "all" ||
                passiveNames.includes(passiveFilter);

            return matchesSearch && matchesSource && matchesRarity &&
                matchesElement && matchesEvolution && matchesPassive;
        });
    }, [monsters, searchQuery, sourceFilter, rarityFilter, elementFilter, evolutionFilter, passiveFilter]);

    const activeFilterCount = [sourceFilter, rarityFilter, elementFilter, evolutionFilter, passiveFilter]
        .filter((value) => value !== "all").length;

    const clearFilters = () => {
        setSourceFilter("all");
        setRarityFilter("all");
        setElementFilter("all");
        setEvolutionFilter("all");
        setPassiveFilter("all");
    };

    return (
        <>
            <Panel
                eyebrow="Select"
                title="Monster Browser"
                action={<span className="rounded-full bg-[#202632] px-2.5 py-1 text-xs text-[#8e99ad]">
        {selectedMonster ? "1 selected" : "0 selected"}
      </span>}
            >
                <div className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-4 overflow-x-hidden p-4 sm:p-5">
                    <label className="relative block">
                        <span className="sr-only">Search monsters</span>
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8b9e]">⌕</span>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search monsters"
                            className="w-full rounded-lg border border-[#344050] bg-[#0d131d] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#69768a] focus:border-[#7182ff]"
                        />
                    </label>

                    <div className="grid w-full min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
                        <label className="sr-only" htmlFor="source-filter">Source</label>
                        <select id="source-filter" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className={selectClassName}>
                            <option value="all">All sources</option>
                            {filterOptions.sources.map((source) => <option key={source} value={source}>{source}</option>)}
                        </select>

                        <label className="sr-only" htmlFor="rarity-filter">Rarity</label>
                        <select id="rarity-filter" value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)} className={selectClassName}>
                            <option value="all">All rarities</option>
                            {filterOptions.rarities.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
                        </select>

                        <label className="sr-only" htmlFor="element-filter">Element</label>
                        <select id="element-filter" value={elementFilter} onChange={(event) => setElementFilter(event.target.value)} className={selectClassName}>
                            <option value="all">All elements</option>
                            {filterOptions.elements.map((element) => <option key={element} value={element}>{element}</option>)}
                        </select>

                        <label className="sr-only" htmlFor="evolution-filter">Evolution</label>
                        <select id="evolution-filter" value={evolutionFilter} onChange={(event) => setEvolutionFilter(event.target.value as EvolutionFilter)} className={selectClassName}>
                            <option value="all">All Evolution Types</option>
                            <option value="can-evolve">Can evolve</option>
                            <option value="evolved">Evolved forms</option>
                            <option value="standard">No evolution</option>
                        </select>

                        <label className="sr-only" htmlFor="passive-filter">Passive</label>
                        <select id="passive-filter" value={passiveFilter} onChange={(event) => setPassiveFilter(event.target.value)} className={`${selectClassName} col-span-2`}>
                            <option value="all">All Passive Types</option>
                            {filterOptions.passives.map((passive) => <option key={passive} value={passive}>{passive}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#7f8b9e]">
                        <span>{filteredMonsters.length} of {monsters.length} monsters</span>
                        {activeFilterCount > 0 && (
                            <button type="button" onClick={clearFilters} className="text-[#7182ff] hover:text-[#a8b0ff]">
                                Clear {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
                            </button>
                        )}
                    </div>

                    <div className="flex h-[792px] min-h-64 max-h-[calc(100vh-22rem)] flex-none flex-col gap-2 overflow-y-scroll pr-1 lg:h-auto lg:min-h-0 lg:flex-1">
                        {filteredMonsters.map((monster) => (
                            <MonsterOption
                                key={monster.id}
                                monster={monster}
                                selected={selectedMonster?.id === monster.id}
                                onSelect={() => onSelectAction(monster)}
                            />
                        ))}

                        {filteredMonsters.length === 0 && (
                            <p className="py-8 text-center text-sm text-[#7f8b9e]">No monsters match your search and filters.</p>
                        )}
                    </div>

                    {filteredMonsters.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setVisibleMonsterCount(60);
                                setShowAllMonsters(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#344050] bg-[#141c28] px-4 py-3 text-sm font-semibold text-[#e3e8f1] transition hover:border-[#5c6a80] hover:bg-[#1b202b]"
                        >
                        <span aria-hidden="true" className="grid grid-cols-2 gap-0.5">
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                        </span>
                            View All Monsters
                            <span className="text-xs font-normal text-[#7f8b9e]">({filteredMonsters.length})</span>
                        </button>
                    )}
                </div>
            </Panel>

            {showAllMonsters && (
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="all-monsters-title"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setShowAllMonsters(false);
                    }}
                >
                    <section className="flex h-[92vh] max-h-[58rem] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#344050] bg-[#0f1620] shadow-2xl">
                        <div className="border-b border-[#344050] p-3 sm:px-4 sm:py-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7182ff]">
                                        Monster Database
                                    </p>
                                    <h2 id="all-monsters-title" className="mt-0.5 text-lg font-bold text-[#f6f8fc]">
                                        Select a Monster
                                    </h2>
                                    <p className="mt-1 text-xs text-[#7f8b9e]">
                                        {filteredMonsters.length} matching monsters
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAllMonsters(false)}
                                    aria-label="Close all monsters"
                                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#344050] text-lg text-[#8e99ad] transition hover:bg-[#1b202b] hover:text-white"
                                >
                                    ×
                                </button>
                            </div>

                            <label className="relative mt-3 block">
                                <span className="sr-only">Search all monsters</span>
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8b9e]">⌕</span>
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                        setVisibleMonsterCount(60);
                                    }}
                                    placeholder="Search all monsters"
                                    autoFocus
                                    className="w-full rounded-lg border border-[#344050] bg-[#0d131d] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#69768a] focus:border-[#7182ff]"
                                />
                            </label>
                        </div>

                        <div
                            className="min-h-0 flex-1 overflow-y-scroll p-3 sm:p-4"
                            onScroll={(event) => {
                                const element = event.currentTarget;
                                if (element.scrollHeight - element.scrollTop - element.clientHeight < 320) {
                                    setVisibleMonsterCount((count) =>
                                        Math.min(count + 60, filteredMonsters.length),
                                    );
                                }
                            }}
                        >
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-2">
                                {filteredMonsters.slice(0, visibleMonsterCount).map((monster) => (
                                    <MonsterOption
                                        key={monster.id}
                                        monster={monster}
                                        compact
                                        selected={selectedMonster?.id === monster.id}
                                        onSelect={() => {
                                            onSelectAction(monster);
                                            setShowAllMonsters(false);
                                        }}
                                    />
                                ))}
                            </div>

                            {visibleMonsterCount < filteredMonsters.length && (
                                <p className="py-4 text-center text-xs text-[#7f8b9e]">
                                    Keep scrolling to load more monsters
                                </p>
                            )}

                            {filteredMonsters.length === 0 && (
                                <p className="py-16 text-center text-sm text-[#7f8b9e]">
                                    No monsters match your search and filters.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
