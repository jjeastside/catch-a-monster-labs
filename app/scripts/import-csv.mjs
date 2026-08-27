import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "data-source");
const outputDir = path.join(root, "data", "generated");

function parseCsv(fileName) {
    const input = fs
        .readFileSync(path.join(sourceDir, fileName), "utf8")
        .replace(/^\uFEFF/, "");

    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < input.length; i += 1) {
        const character = input[i];

        if (quoted) {
            if (
                character === '"' &&
                input[i + 1] === '"'
            ) {
                field += '"';
                i += 1;
            } else if (character === '"') {
                quoted = false;
            } else {
                field += character;
            }
        } else if (character === '"') {
            quoted = true;
        } else if (character === ",") {
            row.push(field);
            field = "";
        } else if (character === "\n") {
            row.push(field.replace(/\r$/, ""));
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += character;
        }
    }

    if (field || row.length) {
        row.push(field.replace(/\r$/, ""));
        rows.push(row);
    }

    const headers = rows.shift();

    return rows
        .filter((values) => values.some(Boolean))
        .map((values) =>
            Object.fromEntries(
                headers.map((header, index) => [
                    header,
                    values[index] ?? "",
                ]),
            ),
        );
}

function number(value, fallback = null) {
    if (value === "") {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid number: ${value}`);
    }

    return parsed;
}

function titleCase(value) {
    return value
        ? value[0].toUpperCase() +
        value.slice(1).toLowerCase()
        : value;
}

function slug(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function splitLines(value) {
    return String(value ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function splitPipeLine(line, maximumFields, context) {
    const fields = line
        .split("|")
        .map((field) => field.trim());

    if (fields.length > maximumFields) {
        throw new Error(
            `${context} has ${fields.length} pipe fields; expected at most ${maximumFields}: ${line}`,
        );
    }

    return fields;
}

const passiveIdsByName = {
    "Vital Surge": "vitalSurge",
    "Critical Chance": "criticalChance",
    "Critical Damage": "criticalDamage",
    "Hard Carapace": "hardCarapace",
    "Sacred Beetle": "sacredBeetle",
    "Fortune Spirit": "fortuneSpirit",
    "Marigon Fortune Spirit": "marigonFortuneSpirit",
    "Mentor Spirit": "mentorSpirit",
    "Capturer's Boon": "captureBoon",
    "Capture's Boon": "captureBoon",
    "Boss Slayer": "bossSlayer",
    "Boss Resistance": "bossResistance",
    "Spire Dominance": "spireDominance",
    "Spire Guard": "spireGuard",
    "Rift Dominance": "riftDominance",
    "Rift Guard": "riftGuard",
    "Trial Power": "trialPower",
    "Dungeon Guard": "dungeonGuard",
    "Last Blessing": "lastBlessing",
    "Potential Seeker": "potentialSeeker",
    "Dragon's Curse": "dragonsCurse",
    "Mutation Catalyst": "mutationCatalyst",
};

function parseDamageInstances(value, skillId) {
    const instances = [
        ...value.matchAll(
            /multiplier:\s*(-?\d+(?:\.\d+)?),\s*hits:\s*(\d+)/g,
        ),
    ].map((match) => ({
        multiplier: Number(match[1]),
        hits: Number(match[2]),
    }));

    if (
        value.trim() !== "[]" &&
        instances.length === 0
    ) {
        throw new Error(
            `Could not parse damageInstances for ${skillId}`,
        );
    }

    return instances;
}

function parseDamageIncreaseEffects(notes) {
    const effects = [];
    const isRandomOutcome = /chance for one of the following to activate/i.test(notes);
    const matches = notes.matchAll(
        /(\d+(?:\.\d+)?)%\s+(self|team)\s+damage\s+for\s+(\d+(?:\.\d+)?)\s*(?:secs?|seconds?)/gi,
    );

    for (const match of matches) {
        effects.push({
            type: "damageIncrease",
            target: match[2].toLowerCase() === "team" ? "Team" : "Self",
            amountPercent: Number(match[1]),
            durationSeconds: Number(match[3]),
            ...(isRandomOutcome
                ? { condition: "Random Egg Blast result" }
                : {}),
        });
    }

    // Joker's Trick omits the target in its source description. The positive
    // Red Card result is a temporary self buff; the Black Card penalty will be
    // handled with Damage Decrease.
    if (/red card:/i.test(notes)) {
        const redCard = notes.match(
            /red card:\s*;?\s*(\d+(?:\.\d+)?)%\s+damage\s+for\s+(\d+(?:\.\d+)?)\s*(?:secs?|seconds?)/i,
        );

        if (redCard) {
            effects.push({
                type: "damageIncrease",
                target: "Self",
                amountPercent: Number(redCard[1]),
                durationSeconds: Number(redCard[2]),
                condition: "Red Card result",
            });
        }
    }

    return effects;
}

function parseSkillStatusEffects(notes) {
    return [
        ...parseDamageIncreaseEffects(notes),
    ];
}

const passiveEffects = {
    fortuneSpirit: (a) => [
        { stat: "coinGain", value: a },
    ],

    mentorSpirit: (a) => [
        { stat: "xpGain", value: a },
    ],

    captureBoon: (a) => [
        { stat: "rankLuck", value: a },
    ],

    bossSlayer: (a) => [
        { stat: "bossDamage", value: a },
    ],

    bossResistance: (a) => [
        { stat: "bossIncomingDamage", value: -a },
    ],

    spireDominance: (a) => [
        { stat: "spireDamage", value: a },
    ],

    spireGuard: (a) => [
        { stat: "spireIncomingDamage", value: -a },
    ],

    riftDominance: (a) => [
        { stat: "riftDamage", value: a },
    ],

    riftGuard: (a) => [
        { stat: "riftIncomingDamage", value: -a },
    ],

    trialPower: (a) => [
        { stat: "dungeonDamage", value: a },
    ],

    dungeonGuard: (a) => [
        { stat: "dungeonIncomingDamage", value: -a },
    ],

    criticalChance: (a) => [
        { stat: "critChance", value: a },
    ],

    criticalDamage: (a) => [
        { stat: "critDamage", value: a },
    ],

    hardCarapace: (a, b) => [
        { stat: "damage", value: a },
        {
            stat: "incomingDamage",
            value: -(b ?? a),
        },
    ],

    marigonFortuneSpirit: (a, b) => [
        { stat: "critChance", value: a },
        { stat: "critDamage", value: b },
    ],

    sacredBeetle: (a) => [
        { stat: "stunImmunity", value: true },
        { stat: "bossDamage", value: a },
    ],

    lastBlessing: (a) => [
        { stat: "healthRestore", value: a },
    ],

    vitalSurge: (a) => [
        { stat: "damage", value: a },
    ],

    potentialSeeker: () => [],

    dragonsCurse: () => [],

    mutationCatalyst: (a) => [
        { stat: "mutationRate", value: a },
    ],
};

const monsterRows = parseCsv("monsters.csv");
const skills = parseCsv("skills.csv");
const achievementRows = parseCsv("achievements.csv");

const monsters = monsterRows.map((monster, index) => {
    const name = monster.Monster.trim();

    if (!name) {
        throw new Error(
            `Monster row ${index + 2} is missing Monster`,
        );
    }

    const growthType = monster["Growth Type"]
        .trim()
        .toLowerCase();

    return {
        monster_id: slug(name),
        name,
        damage: monster.Damage,
        health: monster.Health,
        crit_chance: monster["Crit Chance"],
        growth_type:
            growthType === "dummee" ||
            growthType === "a"
                ? "A"
                : "B",
        element: monster.Element,
        rarity: monster.Rarity,
        evolution_source: slug(
            monster["Evolution Source"],
        ),
        index_position: monster["Index (Position)"],
    };
});

const monsterSkills = monsterRows.flatMap(
    (monster) =>
        ["Skill 1", "Skill 2", "Skill 3"].flatMap(
            (column, index) => {
                const skillName =
                    monster[column].trim();

                return skillName
                    ? [
                        {
                            monster_id: slug(
                                monster.Monster,
                            ),
                            skill_id: slug(skillName),
                            skill_slot: String(
                                index + 1,
                            ),
                        },
                    ]
                    : [];
            },
        ),
);

const monsterPassives = monsterRows.flatMap(
    (monster) =>
        splitLines(monster.Passives).map((line) => {
            const [
                name,
                value1 = "",
                value2 = "",
                condition = "",
            ] = splitPipeLine(
                line,
                4,
                `${monster.Monster} passive`,
            );

            const passiveId =
                passiveIdsByName[name];

            if (!passiveId) {
                throw new Error(
                    `${monster.Monster}: unknown passive "${name}"`,
                );
            }

            return {
                monster_id: slug(monster.Monster),
                passive_id: passiveId,
                value_1: value1,
                value_2: value2,
                condition_1: condition,
            };
        }),
);

const monsterSources = monsterRows.flatMap(
    (monster) =>
        splitLines(monster.Sources).map((line) => {
            const [
                type,
                name,
                location = "",
                status = "",
                condition = "",
                notes = "",
            ] = splitPipeLine(
                line,
                6,
                `${monster.Monster} source`,
            );

            if (!type || !name) {
                throw new Error(
                    `${monster.Monster}: each source requires Type and Name: ${line}`,
                );
            }

            return {
                monster_id: slug(monster.Monster),
                source_type: type,
                source_name: name,
                location,
                status,
                condition,
                notes,
            };
        }),
);

const skillIds = new Set(
    skills.map((skill) => skill.id),
);

const monsterIds = new Set(
    monsters.map((monster) => monster.monster_id),
);

const validationErrors = [];

for (const link of monsterSkills) {
    if (!monsterIds.has(link.monster_id)) {
        validationErrors.push(
            `Unknown monster_id in Monster Skills: ${link.monster_id}`,
        );
    }

    if (!skillIds.has(link.skill_id)) {
        validationErrors.push(
            `Unknown skill_id in Monster Skills: ${link.skill_id}`,
        );
    }
}

for (const passive of monsterPassives) {
    if (!monsterIds.has(passive.monster_id)) {
        validationErrors.push(
            `Unknown monster_id in Monster Passives: ${passive.monster_id}`,
        );
    }

    if (!passiveEffects[passive.passive_id]) {
        validationErrors.push(
            `Unknown passive_id: ${passive.passive_id}`,
        );
    }
}

for (const source of monsterSources) {
    if (!monsterIds.has(source.monster_id)) {
        validationErrors.push(
            `Unknown monster_id in Monster Sources: ${source.monster_id}`,
        );
    }
}

if (validationErrors.length) {
    throw new Error(
        [...new Set(validationErrors)].join("\n"),
    );
}

const skillsByMonster = Map.groupBy(
    monsterSkills,
    (link) => link.monster_id,
);

const passivesByMonster = Map.groupBy(
    monsterPassives,
    (passive) => passive.monster_id,
);

const sourcesByMonster = Map.groupBy(
    monsterSources,
    (source) => source.monster_id,
);

const generatedSkills = Object.fromEntries(
    skills.map((skill) => {
        const statusEffects = parseSkillStatusEffects(skill.notes);

        return [
            skill.id,
            {
            id: skill.id,
            name: skill.name,
            element: titleCase(skill.element),
            damageInstances: parseDamageInstances(
                skill.damageInstances,
                skill.id,
            ),
            cooldown: number(skill.cooldown),

            ...(statusEffects.length > 0
                ? { statusEffects }
                : {}),

            ...(skill.notes
                ? { notes: skill.notes }
                : {}),

            validationStatus:
            skill.validation_status,
            },
        ];
    }),
);

const generatedMonsters = monsters.map(
    (monster) => ({
        id: monster.monster_id,
        name: monster.name,

        image:
            `/monster-artwork/${monster.monster_id}.png`,

        element: titleCase(monster.element),
        rarity: titleCase(monster.rarity),

        sources: (
            sourcesByMonster.get(
                monster.monster_id,
            ) ?? []
        ).map((source) => ({
            type: source.source_type,
            name: source.source_name,

            ...(source.location
                ? { location: source.location }
                : {}),

            ...(source.condition
                ? { condition: source.condition }
                : {}),

            status: source.status,

            ...(source.notes
                ? { notes: source.notes }
                : {}),
        })),

        skillIds: (
            skillsByMonster.get(
                monster.monster_id,
            ) ?? []
        )
            .sort(
                (a, b) =>
                    number(a.skill_slot, 0) -
                    number(b.skill_slot, 0),
            )
            .map((link) => link.skill_id),

        passives: (
            passivesByMonster.get(
                monster.monster_id,
            ) ?? []
        ).map((passive) => {
            const first = number(
                passive.value_1,
                0,
            );

            const second = number(
                passive.value_2,
            );

            return {
                id: passive.passive_id,

                effects:
                    passiveEffects[
                        passive.passive_id
                        ](first, second),

                values: [
                    first,
                    second,
                ].filter(
                    (value) => value !== null,
                ),

                ...(passive.condition_1
                    ? {
                        condition:
                            number(
                                passive.condition_1,
                            ) ??
                            passive.condition_1,
                    }
                    : {}),
            };
        }),

        hasEvolution: monsters.some(
            (candidate) =>
                candidate.evolution_source ===
                monster.monster_id,
        ),

        ...(monster.evolution_source
            ? {
                isEvolved: true,
                evolutionSource:
                monster.evolution_source,
            }
            : {}),

        baseDamageELevel1: number(
            monster.damage,
            0,
        ),

        baseHealthELevel1: number(
            monster.health,
            0,
        ),

        baseCritChance: number(
            monster.crit_chance,
            0,
        ),

        growthType:
            monster.growth_type === "A"
                ? "dummee"
                : "standard",

        indexPosition: number(
            monster.index_position,
            0,
        ),
    }),
);

fs.mkdirSync(outputDir, {
    recursive: true,
});

const banner =
    "// Generated from app/data-source/*.csv by app/scripts/import-csv.mjs. Do not edit manually.\n";

fs.writeFileSync(
    path.join(outputDir, "skills.ts"),
    `${banner}import type { Skill } from "../../types/skill";

export const GENERATED_SKILLS = ${JSON.stringify(
        generatedSkills,
        null,
        2,
    )} as const satisfies Record<string, Skill>;
`,
);

fs.writeFileSync(
    path.join(outputDir, "monsters.ts"),
    `${banner}import type { GeneratedMonster } from "../../types/monster";

export const GENERATED_MONSTERS: GeneratedMonster[] = ${JSON.stringify(
        generatedMonsters,
        null,
        2,
    )};
`,
);

const generatedAchievements = achievementRows.map((row) => ({
    id: row.achievement_id,
    category: row.category,
    order: number(row.order, 0),
    name: row.name,
    island: row.island || null,
    goalType: row.goal_type,
    goalAmount: number(row.goal_amount),
    rewardStat: row.reward_stat,
    rewardPercent: number(row.reward_percent, 0),
    requiresPrevious: row.requires_previous === "true",
    description: row.description,
}));

fs.writeFileSync(
    path.join(outputDir, "achievements.ts"),
    `${banner}import type { Achievement } from "../../types/achievement";

export const GENERATED_ACHIEVEMENTS: Achievement[] = ${JSON.stringify(
        generatedAchievements,
        null,
        2,
    )};
`,
);

console.log(
    `Imported ${monsters.length} monsters, ` +
    `${skills.length} skills, ` +
    `${monsterSkills.length} monster-skill links, ` +
    `${monsterPassives.length} passives, ` +
    `${monsterSources.length} source records, and ` +
    `${achievementRows.length} achievements.`,
);
