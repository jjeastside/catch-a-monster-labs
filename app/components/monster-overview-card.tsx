import type { Rank } from "../types/build";
import type { Monster } from "../types/monster";

type MonsterOverviewCardProps = {
    monster: Monster;
    rank: Rank | null;
    isFavorite: boolean;
    onToggleFavorite: () => void;
};

function createDescription(monster: Monster): string {
    if (monster.description) {
        return monster.description;
    }

    const firstSkill = monster.skills[0];

    const skillText = firstSkill
        ? ` It can use ${firstSkill.name}.`
        : "";

    return `A ${monster.element}-type monster found on ${monster.island}.${skillText}`;
}

export function MonsterOverviewCard({
                                        monster,
                                        rank,
                                        isFavorite,
                                        onToggleFavorite,
                                    }: MonsterOverviewCardProps) {
    return (
        <section className="flex gap-5 rounded-xl border border-[#303848] bg-[#171b25] p-5">
            <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#303848] bg-[#202632]">
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

                    <span className="rounded-md border border-[#303848] bg-[#11141c] px-2.5 py-1 text-xs text-[#d8dee9]">
            Rank {rank ?? "—"}
          </span>

                    <span className="rounded-md border border-[#303848] bg-[#11141c] px-2.5 py-1 text-xs text-[#d8dee9]">
            {monster.island}
          </span>

                    {monster.hasEvolution && (
                        <span className="rounded-md border border-[#79e3ae]/30 bg-[#173126]/40 px-2.5 py-1 text-xs text-[#79e3ae]">
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