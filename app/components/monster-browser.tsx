"use client";

import { useMemo, useState } from "react";
import type { Monster } from "../types/monster";
import { Panel } from "./panel";

const elementColors: Record<string, string> = {
    Common: "#788295", Grass: "#79e3ae", Water: "#70b7ff",
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
    Mythical: "border-transparent bg-[conic-gradient(from_210deg,#ff3b3b,#ff9f1c,#ffe94a,#48f58a,#39d9ff,#637bff,#d65cff,#ff3b86,#ff3b3b)] shadow-[0_0_12px_rgba(124,107,255,0.38)]",
    Secret: "border-[#ff7139] from-[#5d1714] to-[#21130b]",
    Void: "border-[#35e9d0] from-[#123c43] to-[#101d2b]",
};

type MonsterBrowserProps = {
    monsters: Monster[];
    selectedMonster: Monster | null;
    onSelect: (monster: Monster) => void;
};

type EvolutionFilter = "all" | "can-evolve" | "evolved" | "standard";
const selectClassName = "min-w-0 rounded-md border border-[#303848] bg-[#1a1f2a] px-3 py-2 text-xs text-[#c5cbd5] outline-none focus:border-[#7585ff]";

type MonsterOptionProps = {
    monster: Monster;
    selected: boolean;
    onSelect: () => void;
    compact?: boolean;
};

function MonsterOption({ monster, selected, onSelect, compact = false }: MonsterOptionProps) {
    const color = elementColors[monster.element] ?? "#788295";
    const elementIcon = elementIconPaths[monster.element];

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group flex w-full items-center rounded-xl border text-left transition ${compact ? "min-h-[58px] gap-2 px-2.5 py-1.5" : "min-h-[72px] gap-3 px-3 py-2"} ${selected ? "border-[#7585ff] bg-[#1f2540] shadow-[inset_3px_0_0_#7585ff]" : "border-[#303848] bg-[#1a1f2a] hover:border-[#4b566a] hover:bg-[#1b202b]"}`}
        >
            <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border bg-gradient-to-br p-[2px] ${compact ? "size-11" : "size-14"} ${rarityPortraitClasses[monster.rarity]}`}>
                <span className={`grid h-full w-full place-items-center overflow-hidden rounded-[9px] ${monster.rarity === "Mythical" ? "bg-[conic-gradient(from_225deg_at_50%_55%,#16874a,#12a8a7,#365dcc,#743bb0,#b92c79,#bd3d35,#b87818,#16874a)]" : "bg-[#111722]/90"}`}>
                    {monster.image ? (
                        <img
                            src={monster.image}
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
                <span className="block text-sm font-semibold leading-snug text-[#e8ebf0]">
                    {monster.name}
                </span>
                <span className={`${compact ? "mt-0.5" : "mt-1"} flex min-w-0 items-center text-xs text-[#99a2b3]`}>
                    <span className="flex shrink-0 items-center gap-1 font-medium" style={{ color }}>
                        <img src={elementIcon} alt="" className="size-4 object-contain" />
                        {monster.element}
                    </span>
                </span>
            </span>

            <span className={`grid shrink-0 place-items-center text-xl text-[#788295] ${compact ? "size-8" : "size-9"}`} aria-label={`Favorite ${monster.name}`}>
                ☆
            </span>
        </button>
    );
}

export function MonsterBrowser({ monsters, selectedMonster, onSelect }: MonsterBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [rarityFilter, setRarityFilter] = useState("all");
    const [elementFilter, setElementFilter] = useState("all");
    const [evolutionFilter, setEvolutionFilter] = useState<EvolutionFilter>("all");
    const [showAllMonsters, setShowAllMonsters] = useState(false);
    const [visibleMonsterCount, setVisibleMonsterCount] = useState(60);

    const filterOptions = useMemo(() => ({
        sources: [...new Set(monsters.flatMap((monster) =>
            monster.sources.map((source) => source.type),
        ))].sort(),
        rarities: [...new Set(monsters.map((monster) => monster.rarity))].sort(),
        elements: [...new Set(monsters.map((monster) => monster.element))].sort(),
    }), [monsters]);

    const filteredMonsters = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return monsters.filter((monster) => {
            const searchableValues = [
                monster.name, monster.id, monster.element, monster.rarity,
                ...monster.sources.flatMap((source) => [
                    source.type, source.name, source.location ?? "",
                ]),
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

            return matchesSearch && matchesSource && matchesRarity &&
                matchesElement && matchesEvolution;
        });
    }, [monsters, searchQuery, sourceFilter, rarityFilter, elementFilter, evolutionFilter]);

    const activeFilterCount = [sourceFilter, rarityFilter, elementFilter, evolutionFilter]
        .filter((value) => value !== "all").length;

    const clearFilters = () => {
        setSourceFilter("all");
        setRarityFilter("all");
        setElementFilter("all");
        setEvolutionFilter("all");
    };

    return (
        <>
            <Panel
                eyebrow="Select"
                title="Monster Browser"
                action={<span className="rounded-full bg-[#202632] px-2.5 py-1 text-xs text-[#99a2b3]">
        {selectedMonster ? "1 selected" : "0 selected"}
      </span>}
            >
                <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                    <label className="relative block">
                        <span className="sr-only">Search monsters</span>
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#788295]">⌕</span>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search monsters"
                            className="w-full rounded-lg border border-[#303848] bg-[#11151e] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#697386] focus:border-[#7585ff]"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
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
                            <option value="all">All evolution types</option>
                            <option value="can-evolve">Can evolve</option>
                            <option value="evolved">Evolved forms</option>
                            <option value="standard">No evolution</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#788295]">
                        <span>{filteredMonsters.length} of {monsters.length} monsters</span>
                        {activeFilterCount > 0 && (
                            <button type="button" onClick={clearFilters} className="text-[#7585ff] hover:text-[#a8b0ff]">
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
                                onSelect={() => onSelect(monster)}
                            />
                        ))}

                        {filteredMonsters.length === 0 && (
                            <p className="py-8 text-center text-sm text-[#788295]">No monsters match your search and filters.</p>
                        )}
                    </div>

                    {filteredMonsters.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setVisibleMonsterCount(60);
                                setShowAllMonsters(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#303848] bg-[#1a1f2a] px-4 py-3 text-sm font-semibold text-[#d8dee9] transition hover:border-[#4b566a] hover:bg-[#1b202b]"
                        >
                        <span aria-hidden="true" className="grid grid-cols-2 gap-0.5">
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                            <span className="size-1.5 rounded-[1px] border border-current"/>
                        </span>
                            View All Monsters
                            <span className="text-xs font-normal text-[#788295]">({filteredMonsters.length})</span>
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
                    <section className="flex h-[92vh] max-h-[58rem] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#303848] bg-[#131720] shadow-2xl">
                        <div className="border-b border-[#303848] p-3 sm:px-4 sm:py-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7585ff]">
                                        Monster Database
                                    </p>
                                    <h2 id="all-monsters-title" className="mt-0.5 text-lg font-bold text-[#f2f4f8]">
                                        Select a Monster
                                    </h2>
                                    <p className="mt-1 text-xs text-[#788295]">
                                        {filteredMonsters.length} matching monsters
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAllMonsters(false)}
                                    aria-label="Close all monsters"
                                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#303848] text-lg text-[#99a2b3] transition hover:bg-[#1b202b] hover:text-white"
                                >
                                    ×
                                </button>
                            </div>

                            <label className="relative mt-3 block">
                                <span className="sr-only">Search all monsters</span>
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#788295]">⌕</span>
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                        setVisibleMonsterCount(60);
                                    }}
                                    placeholder="Search all monsters"
                                    autoFocus
                                    className="w-full rounded-lg border border-[#303848] bg-[#11151e] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#697386] focus:border-[#7585ff]"
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
                                            onSelect(monster);
                                            setShowAllMonsters(false);
                                        }}
                                    />
                                ))}
                            </div>

                            {visibleMonsterCount < filteredMonsters.length && (
                                <p className="py-4 text-center text-xs text-[#788295]">
                                    Keep scrolling to load more monsters
                                </p>
                            )}

                            {filteredMonsters.length === 0 && (
                                <p className="py-16 text-center text-sm text-[#788295]">
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