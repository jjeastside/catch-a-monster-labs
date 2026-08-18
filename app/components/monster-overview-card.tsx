import type {Monster} from "../types/monster";
import {getSkill} from "../data/skills";
import {assetPath} from "../lib/asset-path";

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
        "border-[#bd61e8] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.58),rgba(0,0,0,0.08)),linear-gradient(to_right,#e53b3b,#f08324,#f0d832,#35c95c,#249fd5,#a43fc4)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
    Secret:
        "border-[#ff2738] bg-[linear-gradient(to_top,#c91b28,#74101a_48%,#18070b)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",

    Void:
        "border-[#28e9c5] bg-[linear-gradient(135deg,#4acb28,#16b879_45%,#078fa8)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
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
        .map((skillId) => getSkill(skillId)?.name)
        .filter((name): name is string => Boolean(name));

    const skillText = skillNames.length
        ? ` It can use ${formatList(skillNames)}.`
        : "";

    const monsterClassification =
        `${monster.element}-type ${monster.rarity} monster`;

    const sourceText = createSourceText(monster);

    return `A ${monsterClassification} obtainable ${sourceText}.${skillText}`;
}

export function MonsterOverviewCard({
                                        monster,
                                        isFavorite,
                                        onToggleFavorite,
                                    }: MonsterOverviewCardProps) {
    const elementIcon = elementIconPaths[monster.element];
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
        <section className="relative flex gap-6 overflow-hidden rounded-xl border border-[#303848] bg-[#1a1f2a] p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-64 bg-[radial-gradient(circle_at_left,rgba(117,133,255,0.09),transparent_70%)]" />
            <div
                className={`relative grid size-40 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 p-[3px] shadow-[0_12px_30px_rgba(0,0,0,0.28)] xl:size-44 ${
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
                        <span className="text-xl font-black text-[#7585ff]">
                {monster.name.slice(0, 2).toUpperCase()}
            </span>
                    )}
                </div>
            </div>

            <div className="relative min-w-0 flex-1 py-1">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7585ff]">
                            Monster Overview
                        </p>

                        <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#f2f4f8]">
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
                        className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#303848] bg-[#131720] text-xl text-[#7585ff] transition hover:border-[#7585ff]"
                    >
                        {isFavorite ? "★" : "☆"}
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 rounded-md border border-[#303848] bg-[#131720] px-2.5 py-1 text-xs text-[#d8dee9]">
                        <img
                            src={assetPath(elementIcon)}
                            alt=""
                            className="size-4 object-contain"
                        />
                        {monster.element}
                    </span>

                    <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                            rarityBadgeClasses[monster.rarity]
                        }`}
                    >
    {monster.rarity}
</span>

                    {getUniqueSourceLabels(monster).map(
                        (sourceLabel) => (
                            <span
                                key={`${monster.id}-${sourceLabel}`}
                                className="rounded-md border border-[#303848] bg-[#131720] px-2.5 py-1 text-xs text-[#d8dee9]"
                            >
                                {sourceLabel}
                            </span>
                        ),
                    )}

                    {monster.hasEvolution && (
                        <span
                            className="rounded-md border border-[#7585ff]/30 bg-[#1f2540]/40 px-2.5 py-1 text-xs text-[#7585ff]">
              Evolution available
            </span>
                    )}
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-[#aab2c1]">
                    {createDescription(monster)}
                </p>

            </div>
        </section>
    );
}