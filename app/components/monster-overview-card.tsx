import type { Rank } from "../types/build";
import type { Monster } from "../types/monster";

type MonsterOverviewCardProps = {
    monster: Monster;
    rank: Rank | null;
    isFavorite: boolean;
    onToggleFavorite: () => void;
};

function createDescription(monster: Monster): string {
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
        <section className="monster-overview-card">
            <div className="monster-overview-artwork">
                {monster.image ? (
                    <img
                        src={monster.image}
                        alt={monster.name}
                    />
                ) : (
                    <span>
            {monster.name.slice(0, 2).toUpperCase()}
          </span>
                )}
            </div>

            <div className="monster-overview-content">
                <div className="monster-overview-heading">
                    <h2>{monster.name}</h2>

                    <button
                        type="button"
                        aria-label={
                            isFavorite
                                ? `Remove ${monster.name} from favorites`
                                : `Add ${monster.name} to favorites`
                        }
                        aria-pressed={isFavorite}
                        onClick={onToggleFavorite}
                    >
                        {isFavorite ? "★" : "☆"}
                    </button>
                </div>

                <div className="monster-overview-badges">
                    <span>{monster.element}</span>
                    <span>{rank ?? "—"}</span>
                    <span>{monster.island}</span>
                </div>

                <p>{createDescription(monster)}</p>
            </div>
        </section>
    );
}