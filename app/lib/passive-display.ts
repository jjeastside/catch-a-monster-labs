import type { MonsterPassive } from "../types/build";

/**
 * UI-only passive formatting.
 *
 * Keep passive source data and importer mappings outside this module. This file
 * only turns already-generated MonsterPassive values/effects into human-readable
 * copy for the Monster Database and profile pages.
 */

export function getPassiveUiName(passive: MonsterPassive): string {
    // The importer distinguishes this passive as "Marigon Fortune Spirit".
    // Keep that distinction in the UI so it is not confused with the standard
    // Fortune Spirit passive (Coin Gain).
    if (passive.id === "marigonFortuneSpirit") {
        return "Marigon Fortune Spirit";
    }

    const names: Partial<Record<MonsterPassive["id"], string>> = {
        vitalSurge: "Vital Surge",
        criticalChance: "Critical Chance",
        criticalDamage: "Critical Damage",
        hardCarapace: "Hard Carapace",
        sacredBeetle: "Sacred Beetle",
        fortuneSpirit: "Fortune Spirit",
        mentorSpirit: "Mentor Spirit",
        captureBoon: "Capturer's Boon",
        bossSlayer: "Boss Slayer",
        bossResistance: "Boss Resistance",
        spireDominance: "Spire Dominance",
        spireGuard: "Spire Guard",
        riftDominance: "Rift Dominance",
        riftGuard: "Rift Guard",
        trialPower: "Trial Power",
        dungeonGuard: "Dungeon Guard",
        lastBlessing: "Last Blessing",
        potentialSeeker: "Potential Seeker",
        dragonsCurse: "Dragon's Curse",
        mutationCatalyst: "Mutation Catalyst",
    };

    return names[passive.id] ?? passive.id;
}

export function formatPassiveEffectDescription(
    effect: MonsterPassive["effects"][number],
): string {
    if (typeof effect.value === "boolean") {
        if (effect.stat === "stunImmunity") {
            return effect.value ? "Grants stun immunity" : "Does not grant stun immunity";
        }

        return `${effect.stat}: ${effect.value ? "Yes" : "No"}`;
    }

    const value = effect.value;
    const amount = Math.abs(value);

    switch (effect.stat) {
        case "damage":
            return `${value >= 0 ? "Increases" : "Reduces"} damage by ${amount}%`;
        case "incomingDamage":
            return `${value <= 0 ? "Reduces" : "Increases"} incoming damage by ${amount}%`;
        case "critChance":
            return `${value >= 0 ? "Increases" : "Reduces"} Crit Chance by ${amount}%`;
        case "critDamage":
            return `${value >= 0 ? "Increases" : "Reduces"} Crit Damage by ${amount}%`;
        case "bossDamage":
            return `${value >= 0 ? "Increases" : "Reduces"} damage against bosses by ${amount}%`;
        case "bossIncomingDamage":
            return `${value <= 0 ? "Reduces" : "Increases"} incoming damage from bosses by ${amount}%`;
        case "spireDamage":
            return `${value >= 0 ? "Increases" : "Reduces"} Spire damage by ${amount}%`;
        case "spireIncomingDamage":
            return `${value <= 0 ? "Reduces" : "Increases"} incoming Spire damage by ${amount}%`;
        case "riftDamage":
            return `${value >= 0 ? "Increases" : "Reduces"} Rift damage by ${amount}%`;
        case "riftIncomingDamage":
            return `${value <= 0 ? "Reduces" : "Increases"} incoming Rift damage by ${amount}%`;
        case "dungeonDamage":
            return `${value >= 0 ? "Increases" : "Reduces"} Dungeon damage by ${amount}%`;
        case "dungeonIncomingDamage":
            return `${value <= 0 ? "Reduces" : "Increases"} incoming Dungeon damage by ${amount}%`;
        case "coinGain":
            return `Increases Coins gained by ${amount}%`;
        case "xpGain":
            return `Increases XP gained by ${amount}%`;
        case "rankLuck":
            return `Increases Rank Luck by ${amount}%`;
        case "healthRestore":
            return `Restores ${amount}% Health`;
        case "mutationRate":
            return `Increases Mutation Rate by ${amount}%`;
        default:
            return `${effect.stat}: ${value}`;
    }
}

export function getPassiveConditionDescription(
    passive: MonsterPassive,
): string | null {
    if (passive.id === "vitalSurge" && typeof passive.condition === "number") {
        return `Active while above ${passive.condition}% HP`;
    }

    if (passive.condition != null) {
        return `Condition: ${String(passive.condition)}`;
    }

    return null;
}

export function getPassiveDescription(passive: MonsterPassive): string {
    const firstValue = passive.values?.[0];
    const secondValue = passive.values?.[1];

    switch (passive.id) {
        case "vitalSurge":
            if (typeof firstValue === "number" && typeof passive.condition === "number") {
                return `While above ${passive.condition}% HP, increases damage by ${Math.abs(firstValue)}%.`;
            }
            break;
        case "hardCarapace":
            if (typeof firstValue === "number") {
                const reduction = typeof secondValue === "number" ? Math.abs(secondValue) : Math.abs(firstValue);
                return `Increases damage by ${Math.abs(firstValue)}% and reduces incoming damage by ${reduction}%.`;
            }
            break;
        case "sacredBeetle":
            if (typeof firstValue === "number") {
                return `Grants stun immunity and increases damage against bosses by ${Math.abs(firstValue)}%.`;
            }
            break;
        case "lastBlessing":
            if (typeof firstValue === "number") {
                return `When this monster dies, restores ${Math.abs(firstValue)}% of allies' Health.`;
            }
            break;
        case "marigonFortuneSpirit":
            if (typeof firstValue === "number" && typeof secondValue === "number") {
                return `Increases Crit Chance by ${Math.abs(firstValue)}% and Crit Damage by ${Math.abs(secondValue)}%.`;
            }
            break;
        default:
            break;
    }

    const uniqueEffects = [
        ...new Set(passive.effects.map(formatPassiveEffectDescription)),
    ];

    if (uniqueEffects.length > 0) {
        return `${uniqueEffects.join(". ")}.`;
    }

    if (typeof firstValue === "number") {
        return `Passive value: ${firstValue}%. The exact gameplay effect is not yet modeled in CAM Lab.`;
    }

    return "This passive's exact gameplay effect is not yet modeled in CAM Lab.";
}
