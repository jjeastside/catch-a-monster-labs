import type { Trait } from "../types/trait";

export const TRAITS: Trait[] = [
    { id: "impair-1", name: "Impair I", rarity: "rare", image: "/trait-icons/impair-1.png", symbolImage: "/trait-symbols/impair.png", effects: [{ type: "damage", percentage: 5, description: "+5% Skill Damage" }] },
    { id: "impair-2", name: "Impair II", rarity: "epic", image: "/trait-icons/impair-2.png", symbolImage: "/trait-symbols/impair.png", effects: [{ type: "damage", percentage: 10, description: "+10% Skill Damage" }] },
    { id: "impair-3", name: "Impair III", rarity: "legendary", image: "/trait-icons/impair-3.png", symbolImage: "/trait-symbols/impair.png", effects: [{ type: "damage", percentage: 15, description: "+15% Skill Damage" }] },
    { id: "impair-4", name: "Impair IV", rarity: "mythical", image: "/trait-icons/impair-4.png", symbolImage: "/trait-symbols/impair.png", naturalSource: "Runegolem", effects: [{ type: "damage", percentage: 30, description: "+30% Skill Damage" }] },
    { id: "fortify-1", name: "Fortify I", rarity: "rare", image: "/trait-icons/fortify-1.png", symbolImage: "/trait-symbols/fortify.png", effects: [{ type: "damageReduction", percentage: 5, description: "+5% Damage Reduction" }] },
    { id: "fortify-2", name: "Fortify II", rarity: "epic", image: "/trait-icons/fortify-2.png", symbolImage: "/trait-symbols/fortify.png", effects: [{ type: "damageReduction", percentage: 10, description: "+10% Damage Reduction" }] },
    { id: "fortify-3", name: "Fortify III", rarity: "legendary", image: "/trait-icons/fortify-3.png", symbolImage: "/trait-symbols/fortify.png", effects: [{ type: "damageReduction", percentage: 15, description: "+15% Damage Reduction" }] },
    { id: "fortify-4", name: "Fortify IV", rarity: "mythical", image: "/trait-icons/fortify-4.png", symbolImage: "/trait-symbols/fortify.png", naturalSource: "Beatopus", effects: [{ type: "damageReduction", percentage: 30, description: "+30% Damage Reduction" }] },
    { id: "hasten-1", name: "Hasten I", rarity: "rare", image: "/trait-icons/hasten-1.png", symbolImage: "/trait-symbols/hasten.png", effects: [{ type: "cooldownReduction", percentage: 5, description: "-5% Skill Cooldown" }] },
    { id: "hasten-2", name: "Hasten II", rarity: "epic", image: "/trait-icons/hasten-2.png", symbolImage: "/trait-symbols/hasten.png", effects: [{ type: "cooldownReduction", percentage: 10, description: "-10% Skill Cooldown" }] },
    { id: "hasten-3", name: "Hasten III", rarity: "legendary", image: "/trait-icons/hasten-3.png", symbolImage: "/trait-symbols/hasten.png", effects: [{ type: "cooldownReduction", percentage: 15, description: "-15% Skill Cooldown" }] },
    { id: "elude-1", name: "Elude I", rarity: "rare", image: "/trait-icons/elude-1.png", symbolImage: "/trait-symbols/elude.png", effects: [{ type: "dodgeChance", percentage: 5, description: "+5% Dodge Chance" }] },
    { id: "elude-2", name: "Elude II", rarity: "epic", image: "/trait-icons/elude-2.png", symbolImage: "/trait-symbols/elude.png", effects: [{ type: "dodgeChance", percentage: 10, description: "+10% Dodge Chance" }] },
    { id: "elude-3", name: "Elude III", rarity: "legendary", image: "/trait-icons/elude-3.png", symbolImage: "/trait-symbols/elude.png", effects: [{ type: "dodgeChance", percentage: 15, description: "+15% Dodge Chance" }] },
    { id: "scorch", name: "Scorch", rarity: "mythical", image: "/trait-icons/scorch.png", symbolImage: "/trait-symbols/scorching.png", naturalSource: "Stormhorn", effects: [{ type: "burnDuration", percentage: 50, description: "+50% Burn Duration" }] },
    { id: "rebirth", name: "Rebirth", rarity: "mythical", image: "/trait-icons/rebirth.png", symbolImage: "/trait-symbols/revive.png", naturalSource: "Crabblaze", effects: [{ type: "revive", percentage: 20, description: "Revives once per battle with 20% HP" }] },
    { id: "gallop", name: "Gallop", rarity: "mythical", image: "/trait-icons/gallop.png", symbolImage: "/trait-symbols/gallop.png", effects: [{ type: "mountSpeed", percentage: 5, description: "+5 Mount Speed" }] },
    { id: "grace", name: "Grace", rarity: "mythical", image: "/trait-icons/grace.png", symbolImage: "/trait-symbols/grace.png", naturalSource: "Rainimp", effects: [{ type: "healingReceived", percentage: 30, description: "+30% Healing Received" }] },
    { id: "vitiate", name: "Vitiate - Attack Reduction", rarity: "mythical", image: "/trait-icons/vitiate.png", symbolImage: "/trait-symbols/vitiate.png", effects: [{ type: "attackReductionEffectiveness", percentage: 50, description: "+50% Attack Reduction Effectiveness" }] },
    { id: "fragility-vulnerable", name: "Vitiate - Vulnerable", rarity: "mythical", image: "/trait-icons/vitiate.png", symbolImage: "/trait-symbols/fragility.png", naturalSource: "Sylvaris", effects: [
            { type: "vulnerabilityEffectiveness", percentage: 50, description: "+50% Vulnerability Effectiveness" },
        ] },
    { id: "fragility-status", name: "Vitiate - Burn/Poison Damage", rarity: "mythical", image: "/trait-icons/vitiate.png", symbolImage: "/trait-symbols/fragility.png", naturalSource: "Sylvaris", effects: [
            { type: "damage", percentage: 50, description: "+50% Damage to Burning or Poisoned targets", condition: "targetStatused" },
        ] },
];

export function getTrait(id: string | null | undefined): Trait | null {
    const migratedId = id === "fragility" ? "fragility-vulnerable" : id;
    return TRAITS.find((trait) => trait.id === migratedId) ?? null;
}

export function getAvailableTraits(): Trait[] {
    return TRAITS;
}
