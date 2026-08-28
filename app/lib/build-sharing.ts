import { monsters } from "../data/monsters";
import { EQUIPMENT } from "../data/equipments";
import { TRAITS } from "../data/traits";
import { ATTRIBUTES } from "../data/attributes";
import type {
    Build,
    CombatContext,
    Mutation,
    Rank,
} from "../types/build";

const BUILD_SHARE_PREFIX = "C1";
const BUILD_HASH_PREFIX = "#b=";

// IMPORTANT: This ordering is part of the share-code format.
// Never reorder or remove existing entries after release. New achievements must be appended.
const ACHIEVEMENT_SHARE_IDS = [
    "keen-gatherer-1",
    "keen-gatherer-2",
    "keen-gatherer-3",
    "dex-expert-1",
    "dex-expert-2",
    "dex-expert-3",
    "master-collector-1",
    "master-collector-2",
    "master-collector-3",
    "grandmaster-collector-1",
    "grandmaster-collector-2",
    "grandmaster-collector-3",
    "legendary-collector-1",
    "legendary-collector-2",
    "legendary-collector-3",
    "legendary-collector-4",
    "mythic-collector-1",
    "mythic-collector-2",
    "mythic-collector-3",
    "mythic-collector-4",
    "mythic-collector-5",
    "mythic-collector-6",
    "godly-collector-1",
    "godly-collector-2",
    "godly-collector-3",
    "godly-collector-4",
    "godly-collector-5",
    "celestial-collector-1",
    "celestial-collector-2",
    "celestial-collector-3",
    "celestial-collector-4",
    "celestial-collector-5",
    "astral-collector-1",
    "astral-collector-2",
    "astral-collector-3",
    "astral-collector-4",
    "astral-collector-5",
    "eternal-collector-1",
    "eternal-collector-2",
    "eternal-collector-3",
    "eternal-collector-4",
    "eternal-collector-5",
    "infinite-collector-1",
    "infinite-collector-2",
    "infinite-collector-3",
    "infinite-collector-4",
    "infinite-collector-5",
    "omni-collector-1",
    "omni-collector-2",
    "omni-collector-3",
    "omni-collector-4",
    "first-step",
    "frontier-of-flames",
    "path-of-frozen-echoes",
    "beyond-the-dream",
    "beyond-the-dunes",
    "trial-of-the-tidecaller",
    "dinosaur-paradise",
    "chronicle-of-the-world-tree",
    "floral-haven",
    "mobius-circus",
    "whispers-of-the-shallows",
    "nova-coast",
    "duneveil-isle-pet-quest",
    "tideland-pet-quest",
    "mobius-circus-pet-quest",
    "specter-shallows-pet-quest",
    "rift-challenger",
    "strive-for-perfection",
    "splash-isle",
] as const;

const ACHIEVEMENT_MASK_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

/**
 * Packs achievement selections directly into 6-bit URL-safe characters.
 * This intentionally avoids BigInt so the share-code implementation works
 * with older TypeScript/JavaScript targets as well as modern browsers.
 *
 * Each character stores six achievement flags, so the current achievement
 * list fits in only a handful of characters even when many are selected.
 */
function encodeAchievementIds(ids: string[]): string {
    const selected = new Set(ids);
    const characters: string[] = [];

    for (let offset = 0; offset < ACHIEVEMENT_SHARE_IDS.length; offset += 6) {
        let value = 0;

        for (let bit = 0; bit < 6; bit += 1) {
            const id = ACHIEVEMENT_SHARE_IDS[offset + bit];
            if (id !== undefined && selected.has(id)) {
                value |= 1 << bit;
            }
        }

        characters.push(ACHIEVEMENT_MASK_ALPHABET.charAt(value));
    }

    // Trailing zero groups carry no information, so omit them.
    while (characters.length > 0 && characters[characters.length - 1] === ACHIEVEMENT_MASK_ALPHABET.charAt(0)) {
        characters.pop();
    }

    return characters.join("");
}

function decodeAchievementIds(value: string): string[] {
    const ids: string[] = [];

    for (let groupIndex = 0; groupIndex < value.length; groupIndex += 1) {
        const packedValue = ACHIEVEMENT_MASK_ALPHABET.indexOf(value.charAt(groupIndex));
        if (packedValue < 0) {
            throw new Error("Invalid achievement mask.");
        }

        for (let bit = 0; bit < 6; bit += 1) {
            if ((packedValue & (1 << bit)) === 0) continue;

            const id = ACHIEVEMENT_SHARE_IDS[groupIndex * 6 + bit];
            if (id !== undefined) ids.push(id);
        }
    }

    return ids;
}



const RANK_TO_CODE: Record<Rank, string> = {
    E: "0",
    D: "1",
    C: "2",
    B: "3",
    A: "4",
    S: "5",
    SS: "6",
};

const CODE_TO_RANK: Record<string, Rank> = {
    "0": "E",
    "1": "D",
    "2": "C",
    "3": "B",
    "4": "A",
    "5": "S",
    "6": "SS",
};

const CONTEXT_TO_CODE: Record<Exclude<CombatContext, "standard">, string> = {
    spire: "s",
    rift: "r",
    dungeon: "d",
};

const CODE_TO_CONTEXT: Record<string, Exclude<CombatContext, "standard">> = {
    s: "spire",
    r: "rift",
    d: "dungeon",
};

const MUTATION_TO_CODE: Record<Mutation, string> = {
    huge: "h",
    "huge-x": "H",
    shiny: "s",
    "shiny-x": "S",
    bloodlit: "b",
    "bloodlit-x": "B",
    fairy: "f",
    "fairy-x": "F",
};

const CODE_TO_MUTATION: Record<string, Mutation> = {
    h: "huge",
    H: "huge-x",
    s: "shiny",
    S: "shiny-x",
    b: "bloodlit",
    B: "bloodlit-x",
    f: "fairy",
    F: "fairy-x",
};

function encodeValue(value: string): string {
    return encodeURIComponent(value);
}

function decodeValue(value: string): string {
    return decodeURIComponent(value);
}

function encodeIndexedId(id: string, ids: readonly string[]): string {
    const index = ids.indexOf(id);
    if (index < 0) return `_${encodeValue(id)}`;
    return index.toString(36);
}

function decodeIndexedId(value: string, ids: readonly string[]): string | null {
    if (value.startsWith("_")) return decodeValue(value.slice(1));
    const index = Number.parseInt(value, 36);
    if (!Number.isInteger(index) || index < 0 || index >= ids.length) return null;
    return ids[index] ?? null;
}

const MONSTER_SHARE_IDS = monsters.map(({ id }) => id);
const SKILL_SHARE_IDS = [...new Set(monsters.flatMap(({ skillIds }) => skillIds))];
const EQUIPMENT_SHARE_IDS = EQUIPMENT.map(({ id }) => id);
const TRAIT_SHARE_IDS = TRAITS.map(({ id }) => id);
const ATTRIBUTE_SHARE_IDS = ATTRIBUTES.map(({ id }) => id);

function encodeIndexedList(values: string[], ids: readonly string[]): string {
    return values.map((value) => encodeIndexedId(value, ids)).join(",");
}

function decodeIndexedList(value: string, ids: readonly string[]): string[] {
    if (!value) return [];

    // The Worker URI-encodes the full C1 code in the redirect URL, so commas
    // inside list fields can arrive as "%2C". Decode the list container before
    // splitting it into individual IDs.
    return decodeValue(value)
        .split(",")
        .map((item) => decodeIndexedId(item, ids))
        .filter((item): item is string => item !== null);
}

function firstSkillIdForMonster(monsterId: string | null): string | null {
    if (!monsterId) return null;
    return monsters.find(({ id }) => id === monsterId)?.skillIds[0] ?? null;
}

/**
 * C1 is a sparse compact format. Values use positional/index codes and base-36
 * numbers so the URL stays short without needing a backend.
 * Only values that differ from the normal build defaults are written.
 *
 * Example default build:
 *   C1m2f
 *
 * Each field starts with a one-character key. Fields are separated by ~.
 * Numeric values are encoded in base-36 when possible.
 */
function encodeInt(value: number): string {
    return Math.round(value).toString(36);
}

function decodeInt(value: string): number {
    return Number.parseInt(value, 36);
}

function encodeEvolutionPercent(value: number): string {
    // Store hundredths above the 100% default. Example: 187.45% -> 8745 -> 6qx.
    return encodeInt(Math.round(value * 100) - 10_000);
}

function decodeEvolutionPercent(value: string): number {
    return (decodeInt(value) + 10_000) / 100;
}

function encodeGeneticPotential(value: number): string {
    // GP moves in 6% segments (0, 6, 12 ... 60), so store the segment index.
    return encodeInt(value / 6);
}

function decodeGeneticPotential(value: string): number {
    return decodeInt(value) * 6;
}

export function encodeBuildForShare(build: Build): string {
    const parts: string[] = [];

    if (build.monsterId) parts.push(`m${encodeIndexedId(build.monsterId, MONSTER_SHARE_IDS)}`);
    if (build.level !== 1) parts.push(`l${encodeInt(build.level)}`);

    const defaultRank: Rank | null = build.monsterId ? "E" : null;
    if (build.rank !== defaultRank) {
        parts.push(`r${build.rank === null ? "n" : RANK_TO_CODE[build.rank]}`);
    }

    if (build.enhancement !== 0) parts.push(`e${encodeInt(build.enhancement)}`);
    if (build.healthGeneticPotential !== 6) parts.push(`h${encodeGeneticPotential(build.healthGeneticPotential)}`);
    if (build.damageGeneticPotential !== 6) parts.push(`d${encodeGeneticPotential(build.damageGeneticPotential)}`);
    if (build.evolutionPercent !== 100) parts.push(`v${encodeEvolutionPercent(build.evolutionPercent)}`);

    if (build.mutations.length > 0) {
        parts.push(`u${build.mutations.map((mutation) => MUTATION_TO_CODE[mutation]).join("")}`);
    }

    if (build.traitId) parts.push(`t${encodeIndexedId(build.traitId, TRAIT_SHARE_IDS)}`);

    let flags = 0;
    if (build.targetStatused) flags |= 1;
    if (build.targetIsBoss) flags |= 2;
    if (build.combatContext === "spire") flags |= 4;
    if (build.combatContext === "rift") flags |= 8;
    if (build.combatContext === "dungeon") flags |= 12;
    if (build.rallyingWarCryActive) flags |= 16;
    if (build.vulnerabilityActive) flags |= 32;
    if (flags !== 0) parts.push(`f${encodeInt(flags)}`);

    const defaultSkillId = firstSkillIdForMonster(build.monsterId);
    if (build.selectedSkillId !== defaultSkillId) {
        parts.push(`s${build.selectedSkillId === null ? "n" : encodeIndexedId(build.selectedSkillId, SKILL_SHARE_IDS)}`);
    }

    if (build.weaponId) parts.push(`w${encodeIndexedId(build.weaponId, EQUIPMENT_SHARE_IDS)}`);
    if (build.armorId) parts.push(`a${encodeIndexedId(build.armorId, EQUIPMENT_SHARE_IDS)}`);
    if (build.weaponAttributeIds.length > 0) parts.push(`W${encodeIndexedList(build.weaponAttributeIds, ATTRIBUTE_SHARE_IDS)}`);
    if (build.armorAttributeIds.length > 0) parts.push(`A${encodeIndexedList(build.armorAttributeIds, ATTRIBUTE_SHARE_IDS)}`);
    if (build.currentHpPercent !== 100) parts.push(`p${encodeInt(build.currentHpPercent)}`);
    if (build.preDungeonLevel !== null) parts.push(`q${encodeInt(build.preDungeonLevel)}`);

    if (build.teammateMonsterIds.some((id) => id !== null)) {
        // Team-passive monsters are stored by stable monster ID rather than
        // by their position in the monsters array. Adding/reordering monsters
        // must never change which teammate an existing share code points to.
        parts.push(
            `N${build.teammateMonsterIds
                .map((id) => (id === null ? "" : encodeValue(id)))
                .join(",")}`,
        );
    }

    const completedAchievementIds = build.accountMultipliers.completedAchievementIds;
    if (completedAchievementIds.length > 0) {
        parts.push(`i${encodeAchievementIds(completedAchievementIds)}`);
    }

    return `${BUILD_SHARE_PREFIX}${parts.join("~")}`;
}

function decodeBuildCode(code: string): Partial<Build> | null {
    try {
        const encoded = code.slice(BUILD_SHARE_PREFIX.length);
        const build: Partial<Build> = {};
        const accountMultipliers: Build["accountMultipliers"] = {
            completedAchievementIds: [],
        };
        let hasAccountMultipliers = false;

        if (!encoded) return null;

        for (const part of encoded.split("~")) {
            if (!part) continue;

            const key = part.charAt(0);
            const value = part.slice(1);

            switch (key) {
                case "m":
                    build.monsterId = decodeIndexedId(value, MONSTER_SHARE_IDS);
                    break;
                case "l":
                    build.level = decodeInt(value);
                    break;
                case "r":
                    build.rank = value === "n" ? null : CODE_TO_RANK[value];
                    break;
                case "e":
                    build.enhancement = decodeInt(value);
                    break;
                case "h":
                    build.healthGeneticPotential = decodeGeneticPotential(value);
                    break;
                case "d":
                    build.damageGeneticPotential = decodeGeneticPotential(value);
                    break;
                case "v":
                    build.evolutionPercent = decodeEvolutionPercent(value);
                    break;
                case "u":
                    build.mutations = [...value]
                        .map((mutationCode) => CODE_TO_MUTATION[mutationCode])
                        .filter((mutation): mutation is Mutation => Boolean(mutation));
                    break;
                case "t":
                    build.traitId = decodeIndexedId(value, TRAIT_SHARE_IDS);
                    break;
                case "f": {
                    const flags = decodeInt(value);
                    build.targetStatused = (flags & 1) !== 0;
                    build.targetIsBoss = (flags & 2) !== 0;
                    build.rallyingWarCryActive = (flags & 16) !== 0;
                    build.vulnerabilityActive = (flags & 32) !== 0;
                    const contextBits = flags & 12;
                    build.combatContext =
                        contextBits === 4 ? "spire" :
                            contextBits === 8 ? "rift" :
                                contextBits === 12 ? "dungeon" :
                                    "standard";
                    break;
                }
                case "s":
                    build.selectedSkillId = (value === "n" ? null : decodeIndexedId(value, SKILL_SHARE_IDS)) as Build["selectedSkillId"];
                    break;
                case "w":
                    build.weaponId = decodeIndexedId(value, EQUIPMENT_SHARE_IDS);
                    break;
                case "a":
                    build.armorId = decodeIndexedId(value, EQUIPMENT_SHARE_IDS);
                    break;
                case "W":
                    build.weaponAttributeIds = decodeIndexedList(value, ATTRIBUTE_SHARE_IDS);
                    break;
                case "A":
                    build.armorAttributeIds = decodeIndexedList(value, ATTRIBUTE_SHARE_IDS);
                    break;
                case "p":
                    build.currentHpPercent = decodeInt(value);
                    break;
                case "q":
                    build.preDungeonLevel = decodeInt(value);
                    break;
                case "N": {
                    // Decode the whole teammate list before splitting because
                    // the redirect URL encodes the comma as "%2C".
                    const teammateIds = decodeValue(value).split(",");
                    const decodeTeammateId = (monsterId: string | undefined): string | null => {
                        if (!monsterId) return null;
                        return monsters.some(({ id }) => id === monsterId) ? monsterId : null;
                    };

                    build.teammateMonsterIds = [
                        decodeTeammateId(teammateIds[0]),
                        decodeTeammateId(teammateIds[1]),
                    ];
                    break;
                }
                case "n": {
                    // Legacy indexed teammate encoding for older shared links.
                    // These commas can also arrive URI-encoded by the Worker.
                    const teammateIds = decodeValue(value).split(",");
                    build.teammateMonsterIds = [
                        teammateIds[0] ? decodeIndexedId(teammateIds[0], MONSTER_SHARE_IDS) : null,
                        teammateIds[1] ? decodeIndexedId(teammateIds[1], MONSTER_SHARE_IDS) : null,
                    ];
                    break;
                }
                case "i":
                    accountMultipliers.completedAchievementIds = decodeAchievementIds(value);
                    hasAccountMultipliers = true;
                    break;
                default:
                    break;
            }
        }

        if (!build.monsterId) return null;

        if (hasAccountMultipliers) {
            build.accountMultipliers = accountMultipliers;
        }

        return build;
    } catch {
        return null;
    }
}

export function decodeSharedBuildCode(code: string): Partial<Build> | null {
    if (!code.startsWith(BUILD_SHARE_PREFIX)) return null;
    return decodeBuildCode(code);
}

export function getSharedBuildFromLocation(): Partial<Build> | null {
    const hash = window.location.hash;
    if (!hash.startsWith(BUILD_HASH_PREFIX)) return null;
    return decodeSharedBuildCode(hash.slice(BUILD_HASH_PREFIX.length));
}

export type BuildSharePreview = {
    monsterName: string;
    rarity: string;
    element: string;
    damage: string;
    health: string;
    critChance: string;
    critMultiplier: string;
    imagePath?: string;
};

const SHARE_PREVIEW_BASE_URL =
    process.env.NEXT_PUBLIC_SHARE_PREVIEW_URL?.trim() ||
    "https://cam-lab-share.camlab.workers.dev";

function getSharePreviewBaseUrl(): string {
    return SHARE_PREVIEW_BASE_URL.replace(/\/+$/, "");
}

export function createBuildShareCode(build: Build): string {
    return encodeBuildForShare(build);
}

export function createBuildShareUrl(build: Build, _preview?: BuildSharePreview): string {
    const code = createBuildShareCode(build);
    return `${getSharePreviewBaseUrl()}/b/${encodeURIComponent(code)}`;
}

type PrimedShareResponse = {
    ok: boolean;
    shortId?: string;
    shareUrl?: string;
};

export async function primeBuildSharePreview(
    build: Build,
    preview: BuildSharePreview,
): Promise<string> {
    const buildCode = createBuildShareCode(build);
    const baseUrl = getSharePreviewBaseUrl();

    const response = await fetch(`${baseUrl}/share`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            buildCode,
            preview,
        }),
        keepalive: true,
        mode: "cors",
    });

    if (!response.ok) {
        throw new Error(`Failed to prime share preview (${response.status})`);
    }

    const data = (await response.json()) as PrimedShareResponse;
    const shortToken = data.shortId?.trim();
    const shareUrl =
        data.shareUrl?.trim() ||
        (shortToken
            ? `${baseUrl}/b/${encodeURIComponent(shortToken)}`
            : `${baseUrl}/b/${encodeURIComponent(buildCode)}`);

    void fetch(`${baseUrl}/card.png?b=${encodeURIComponent(shortToken || buildCode)}`, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        keepalive: true,
    }).catch(() => {
        // Best-effort warm-up only.
    });

    return shareUrl;
}
