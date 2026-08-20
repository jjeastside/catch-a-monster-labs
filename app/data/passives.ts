import type { MonsterPassive, Passive } from "../types/build";

export type PassiveDefinition = {
    id: Passive;
    name: string;
};

export const PASSIVE_DEFINITIONS: Record<Passive, PassiveDefinition> = {
    vitalSurge: {
        id: "vitalSurge",
        name: "Vital Surge",
    },

    criticalChance: {
        id: "criticalChance",
        name: "Critical Chance",
    },

    criticalDamage: {
        id: "criticalDamage",
        name: "Critical Damage",
    },

    hardCarapace: {
        id: "hardCarapace",
        name: "Hard Carapace",
    },

    sacredBeetle: {
        id: "sacredBeetle",
        name: "Sacred Beetle",
    },

    fortuneSpirit: {
        id: "fortuneSpirit",
        name: "Fortune Spirit",
    },

    mentorSpirit: {
        id: "mentorSpirit",
        name: "Mentor Spirit",
    },

    captureBoon: {
        id: "captureBoon",
        name: "Capturer's Boon",
    },

    bossSlayer: {
        id: "bossSlayer",
        name: "Boss Slayer",
    },

    bossResistance: {
        id: "bossResistance",
        name: "Boss Resistance",
    },

    spireDominance: {
        id: "spireDominance",
        name: "Spire Dominance",
    },

    spireGuard: {
        id: "spireGuard",
        name: "Spire Guard",
    },

    riftDominance: {
        id: "riftDominance",
        name: "Rift Dominance",
    },

    riftGuard: {
        id: "riftGuard",
        name: "Rift Guard",
    },

    trialPower: {
        id: "trialPower",
        name: "Trial Power",
    },

    dungeonGuard: {
        id: "dungeonGuard",
        name: "Dungeon Guard",
    },

    lastBlessing: {
        id: "lastBlessing",
        name: "Last Blessing",
    },
    marigonFortuneSpirit: {
        id: "marigonFortuneSpirit",
        name: "Fortune Spirit",
    },
    potentialSeeker: {
        id: "potentialSeeker",
        name: "Potential Seeker",
    },
    dragonsCurse: {
        id: "dragonsCurse",
        name: "Dragon's Curse",
    },

    mutationCatalyst: {
        id: "mutationCatalyst",
        name: "Mutation Catalyst",
    },
};

const TEAM_EXCLUDED_PASSIVE_IDS = new Set<Passive>([
    // Self-only passives: these belong only to the monster that owns them.
    "lastBlessing",
    "dragonsCurse",
    "hardCarapace",

    // Progression/luck passives that should not be inherited from teammates.
    "fortuneSpirit",
    "mentorSpirit",
    "captureBoon",
    "potentialSeeker",
    "mutationCatalyst",
]);

const TEAM_TRANSFERABLE_EFFECT_STATS = new Set<string>([
    "damage",
    "incomingDamage",
    "critChance",
    "critDamage",
    "bossDamage",
    "bossIncomingDamage",
    "spireDamage",
    "spireIncomingDamage",
    "riftDamage",
    "riftIncomingDamage",
    "dungeonDamage",
    "dungeonIncomingDamage",
]);

export function getTransferablePassiveFromTeammate(
    passive: MonsterPassive,
): MonsterPassive | null {
    if (TEAM_EXCLUDED_PASSIVE_IDS.has(passive.id)) {
        return null;
    }

    const transferableEffects = passive.effects.filter((effect) =>
        TEAM_TRANSFERABLE_EFFECT_STATS.has(effect.stat),
    );

    if (transferableEffects.length === 0) {
        return null;
    }

    return {
        ...passive,
        effects: transferableEffects.map((effect) => ({ ...effect })),
    };
}

export function canSharePassiveFromTeammate(passive: MonsterPassive): boolean {
    return getTransferablePassiveFromTeammate(passive) !== null;
}

export function getPassiveDisplayName(passive: MonsterPassive): string {
    return PASSIVE_DEFINITIONS[passive.id]?.name ?? passive.id;
}

export function getPassiveImagePath(
    passive: MonsterPassive,
): string | null {
    const files: Partial<Record<Passive, string>> = {
        vitalSurge: "vital-surge.png",

        criticalChance: "critical-damage.png",
        criticalDamage: "critical-damage.png",
        marigonFortuneSpirit: "critical-damage.png",

        hardCarapace: "hard-carapace.png",

        sacredBeetle: "sacred-beetle.png",
        lastBlessing: "last-blessing.png",
        potentialSeeker: "potential-seeker.png",
        mutationCatalyst: "mutation-catalyst.png",

        fortuneSpirit: "fortune-spirit.png",
        mentorSpirit: "mentor-spirit.png",

        captureBoon: "capturer's-boon.png",

        bossSlayer: "boss-slayer.png",
        bossResistance: "boss-resistance.png",

        spireDominance: "spire-dominance.png",
        spireGuard: "spire-guard.png",

        riftDominance: "rift-dominance.png",
        riftGuard: "rift-guard.png",

        trialPower: "trial-power.png",
        dungeonGuard: "dungeon-guard.png",

        dragonsCurse: "dragon's-curse.png",
    };

    const file = files[passive.id];

    return file
        ? `/passive-images/${file}`
        : null;
}


export function mergeUniquePassives(
    ...passiveGroups: Array<MonsterPassive[] | undefined>
): MonsterPassive[] {
    const seenNames = new Set<string>();
    const merged: MonsterPassive[] = [];

    // First preserve the existing "same passive does not stack" rule.
    // Earlier groups have priority: selected monster -> teammate 1 -> teammate 2.
    passiveGroups.forEach((group, groupIndex) => {
        for (const passive of group ?? []) {
            const passiveToMerge =
                groupIndex === 0
                    ? passive
                    : getTransferablePassiveFromTeammate(passive);

            if (!passiveToMerge) {
                continue;
            }

            const definition = PASSIVE_DEFINITIONS[passiveToMerge.id];
            const nameKey = (definition?.name ?? passiveToMerge.id).trim().toLowerCase();

            if (seenNames.has(nameKey)) continue;

            seenNames.add(nameKey);
            merged.push({
                ...passiveToMerge,
                effects: passiveToMerge.effects.map((effect) => ({ ...effect })),
            });
        }
    });

    // Crit Chance and Crit Damage are special team-wide conflicts:
    // only the strongest bonus for each stat applies, but mixed passives keep
    // their other non-conflicting effects.
    const strongestCritEffect = new Map<"critChance" | "critDamage", {
        passiveIndex: number;
        effectIndex: number;
        value: number;
    }>();

    merged.forEach((passive, passiveIndex) => {
        passive.effects.forEach((effect, effectIndex) => {
            if (
                (effect.stat !== "critChance" && effect.stat !== "critDamage") ||
                typeof effect.value !== "number"
            ) {
                return;
            }

            const current = strongestCritEffect.get(effect.stat);

            if (!current || effect.value > current.value) {
                strongestCritEffect.set(effect.stat, {
                    passiveIndex,
                    effectIndex,
                    value: effect.value,
                });
            }
        });
    });

    return merged
        .map((passive, passiveIndex) => ({
            ...passive,
            effects: passive.effects.filter((effect, effectIndex) => {
                if (effect.stat !== "critChance" && effect.stat !== "critDamage") {
                    return true;
                }

                const strongest = strongestCritEffect.get(effect.stat);

                return (
                    strongest?.passiveIndex === passiveIndex &&
                    strongest.effectIndex === effectIndex
                );
            }),
        }))
        .filter((passive) => passive.effects.length > 0);
}