import type {Monster} from "../types/monster";
import {getSkill} from "../data/skills";

type MonsterOverviewCardProps = {
    monster: Monster;
    isFavorite: boolean;
    onToggleFavorite: () => void;
};

const rarityBadgeClasses: Record<Monster["rarity"], string> = {
    Common: "border-[#707070] bg-[#2b2b2b] text-[#d1d1d1]",
    Uncommon: "border-[#28a745] bg-[#123d1d] text-[#65e47a]",
    Rare: "border-[#299ddd] bg-[#102f46] text-[#6bc8ff]",
    Epic: "border-[#bd45d8] bg-[#411546] text-[#eb7cff]",
    Legendary: "border-[#ff9f43] bg-[#4a2910] text-[#ffb866]",
    Mythical:
        "border-transparent bg-[linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#00ff66,#00ccff,#3366ff,#cc33ff)] text-white",
    Secret:
        "border-transparent bg-[linear-gradient(135deg,#5d0000,#ff1f1f,#ff7a00,#ffd400,#78ff00)] text-white",

    Void:
        "border-transparent bg-[linear-gradient(135deg,#84ff00,#4cff8f,#00f2ff,#00b7ff,#0096c7)] text-white",
};

const rarityImageClasses: Record<Monster["rarity"], string> = {
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
        "border-transparent bg-[conic-gradient(from_180deg,#ff0000,#ff9900,#ffff00,#00ff66,#00ccff,#3366ff,#cc33ff,#ff0000)]",
    Secret:
        "border-transparent bg-[linear-gradient(135deg,#5d0000,#ff1f1f,#ff7a00,#ffd400,#78ff00)]",
    Void:
        "border-transparent bg-[linear-gradient(135deg,#84ff00,#4cff8f,#00f2ff,#00b7ff,#0096c7)]",
};

function createDescription(monster: Monster): string {
    if (monster.description) {
        return monster.description;
    }

    const firstSkill = getSkill(
        monster.skillIds[0] ?? null,
    );

    const skillText = firstSkill
        ? ` It can use ${firstSkill.name}.`
        : "";

    const sourceText = monster.sources
        .map((source) => {
            switch (source.type) {
                case "Island":
                    return `found on ${source.name}`;

                case "Egg":
                    return `hatched from the ${source.name}`;

                case "Starter Pet":
                    return `received as a ${source.name}`;

                case "Event":
                    return `available during the ${source.name}`;

                default:
                    return `obtained from ${source.name}`;
            }
        })
        .join(", ");

    return `A ${monster.rarity} ${monster.element}-type monster ${sourceText}.${skillText}`;
}

export function MonsterOverviewCard({
                                        monster,
                                        isFavorite,
                                        onToggleFavorite,
                                    }: MonsterOverviewCardProps) {
    return (
        <section className="flex gap-5 rounded-xl border border-[#303848] bg-[#171b25] p-5">
            <div
                className={`grid size-28 shrink-0 place-items-center overflow-hidden rounded-xl border-2 p-[2px] ${
                    rarityImageClasses[monster.rarity]
                }`}
            >
                <div className="grid h-full w-full place-items-center overflow-hidden rounded-[9px] bg-[#171b25]/80">
                    {monster.image ? (
                        <img
                            src={monster.image}
                            alt={monster.name}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <span className="text-xl font-black text-[#79e3ae]">
                {monster.name.slice(0, 2).toUpperCase()}
            </span>
                    )}
                </div>
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#79e3ae]">
                            Monster Overview
                        </p>

                        <h2 className="mt-1 text-2xl font-semibold text-[#f2f4f8]">
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
                        className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#303848] bg-[#11141c] text-xl text-[#79e3ae] transition hover:border-[#79e3ae]"
                    >
                        {isFavorite ? "★" : "☆"}
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-md border border-[#303848] bg-[#11141c] px-2.5 py-1 text-xs text-[#d8dee9]">
            {monster.element}
          </span>

                    <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                            rarityBadgeClasses[monster.rarity]
                        }`}
                    >
    {monster.rarity}
</span>

                    {monster.sources.map((source) => (
                        <span
                            key={`${source.type}-${source.name}`}
                            className="rounded-md border border-[#303848] bg-[#11141c] px-2.5 py-1 text-xs text-[#d8dee9]"
                        >
        {source.name}
    </span>
                    ))}

                    {monster.hasEvolution && (
                        <span
                            className="rounded-md border border-[#79e3ae]/30 bg-[#173126]/40 px-2.5 py-1 text-xs text-[#79e3ae]">
              Evolution available
            </span>
                    )}
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#99a2b3]">
                    {createDescription(monster)}
                </p>
            </div>
        </section>
    );
}