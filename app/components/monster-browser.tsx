"use client";

import { useMemo, useState } from "react";
import type { Monster } from "../types/monster";
import { Panel } from "./panel";

const elementColors: Record<string, string> = {
    Common: "#788295", Grass: "#79e3ae", Water: "#70b7ff",
    Fire: "#ff9d6c", Ice: "#9ee7ff", Ground: "#d6a66f",
};

type MonsterBrowserProps = {
    monsters: Monster[];
    selectedMonster: Monster | null;
    onSelect: (monster: Monster) => void;
};

type EvolutionFilter = "all" | "can-evolve" | "evolved" | "standard";
const selectClassName = "min-w-0 rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-xs text-[#c5cbd5] outline-none focus:border-[#79e3ae]";

export function MonsterBrowser({ monsters, selectedMonster, onSelect }: MonsterBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [rarityFilter, setRarityFilter] = useState("all");
    const [elementFilter, setElementFilter] = useState("all");
    const [evolutionFilter, setEvolutionFilter] = useState<EvolutionFilter>("all");

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
        <Panel
            eyebrow="Step 1"
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
                        className="w-full rounded-lg border border-[#303848] bg-[#0d1017] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#697386] focus:border-[#79e3ae]"
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
                        <button type="button" onClick={clearFilters} className="text-[#79e3ae] hover:text-[#a6f0cb]">
                            Clear {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
                        </button>
                    )}
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                    {filteredMonsters.map((monster) => {
                        const selected = selectedMonster?.id === monster.id;
                        const color = elementColors[monster.element] ?? "#788295";
                        const sourceNames = monster.sources.map((source) => source.name).join(" · ");
                        return (
                            <button
                                key={monster.id}
                                type="button"
                                onClick={() => onSelect(monster)}
                                className={`flex items-center gap-3 rounded-lg border p-3 text-left ${selected ? "border-[#79e3ae] bg-[#173126]" : "border-[#303848] bg-[#171b25] hover:border-[#4b566a]"}`}
                            >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg text-xs font-black" style={{ backgroundColor: `${color}26`, color }}>
                  {monster.name.slice(0, 2).toUpperCase()}
                </span>
                                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#e8ebf0]">{monster.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-[#99a2b3]">
                    {monster.element} · {monster.rarity} · {sourceNames}
                  </span>
                </span>
                                <span className="text-lg text-[#788295]" aria-label={`Favorite ${monster.name}`}>☆</span>
                            </button>
                        );
                    })}

                    {filteredMonsters.length === 0 && (
                        <p className="py-8 text-center text-sm text-[#788295]">No monsters match your search and filters.</p>
                    )}
                </div>
            </div>
        </Panel>
    );
}