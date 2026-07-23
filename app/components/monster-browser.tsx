import { filterLabels } from "../data/monsters";
import type { Monster } from "../types/monster";
import { Panel } from "./panel";

const elementColors: Record<string, string> = {
    Common: "#788295",
    Grass: "#79e3ae",
    Water: "#70b7ff",
    Fire: "#ff9d6c",
    Ice: "#9ee7ff",
    Ground: "#d6a66f",
};

type MonsterBrowserProps = {
    monsters: Monster[];
    selectedMonster: Monster | null;
    onSelect: (monster: Monster) => void;
};

export function MonsterBrowser({
                                   monsters,
                                   selectedMonster,
                                   onSelect,
                               }: MonsterBrowserProps) {
    return (
        <Panel
            eyebrow="Step 1"
            title="Monster Browser"
            action={
                <span className="rounded-full bg-[#202632] px-2.5 py-1 text-xs text-[#99a2b3]">
          {selectedMonster ? "1 selected" : "0 selected"}
        </span>
            }
        >
            <div className="flex flex-1 flex-col gap-4 p-5">
                <label className="relative block">
                    <span className="sr-only">Search monsters</span>
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#788295]">
            ⌕
          </span>
                    <input
                        type="search"
                        placeholder="Search monsters"
                        className="w-full rounded-lg border border-[#303848] bg-[#0d1017] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#697386] focus:border-[#79e3ae]"
                    />
                </label>

                <div className="grid grid-cols-2 gap-2">
                    {filterLabels.map((label) => (
                        <button
                            key={label}
                            type="button"
                            className="rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-left text-xs text-[#99a2b3]"
                        >
                            {label}
                            <span className="float-right">⌄</span>
                        </button>
                    ))}
                </div>

                <div className="flex flex-1 flex-col gap-2 overflow-auto pr-1">
                    {monsters.map((monster) => {
                        const selected = selectedMonster?.id === monster.id;
                        const color = elementColors[monster.element] ?? "#788295";
                        const sourceNames = monster.sources
                            .map((source) => source.name)
                            .join(" · ");

                        return (
                            <button
                                key={monster.id}
                                type="button"
                                onClick={() => onSelect(monster)}
                                className={`flex items-center gap-3 rounded-lg border p-3 text-left ${
                                    selected
                                        ? "border-[#79e3ae] bg-[#173126]"
                                        : "border-[#303848] bg-[#171b25] hover:border-[#4b566a]"
                                }`}
                            >
                <span
                    className="grid size-10 shrink-0 place-items-center rounded-lg text-xs font-black"
                    style={{
                        backgroundColor: `${color}26`,
                        color,
                    }}
                >
                  {monster.name.slice(0, 2).toUpperCase()}
                </span>

                                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#e8ebf0]">
                    {monster.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#99a2b3]">
                    {monster.element} · {monster.rarity} · {sourceNames}
                  </span>
                </span>

                                <span
                                    className="text-lg text-[#788295]"
                                    aria-label={`Favorite ${monster.name}`}
                                >
                  ☆
                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </Panel>
    );
}