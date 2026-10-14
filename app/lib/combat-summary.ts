import type { Build } from "../types/build";
import { ACCOUNT_MULTIPLIER_CATEGORIES, ACCOUNT_MULTIPLIER_DETAILS, getCategoryProgress } from "./calculations/account-multipliers";
import { getEquipment } from "../data/equipments";
import { getAttribute } from "../data/attributes";
import { monsters } from "../data/monsters";
import { getSkill } from "../data/skills";
import { getTrait } from "../data/traits";

export type CombatSummaryItem = { label: string; value: string; icon: string; secondaryIcon?: string };

export const COMBAT_CONTEXTS = [
    { id: "standard", label: "Standard", icon: "/account-icons/damage.png" },
    { id: "spire", label: "Spire", icon: "/passive-images/spire-dominance.png" },
    { id: "rift", label: "Rift", icon: "/passive-images/rift-dominance.png" },
    { id: "dungeon", label: "Dungeon", icon: "/passive-images/dungeon-guard.png" },
] as const;

export function getAccountSummary(build: Build): CombatSummaryItem[] {
    return ACCOUNT_MULTIPLIER_CATEGORIES.map((category) => {
        const progress = getCategoryProgress(build.accountMultipliers, category);
        const rewards = [
            progress.healthPercent ? `+${progress.healthPercent}% HP` : "",
            progress.damagePercent ? `+${progress.damagePercent}% DMG` : "",
            progress.riftDamagePercent ? `+${progress.riftDamagePercent}% Rift DMG` : "",
            progress.critChancePercent ? `+${progress.critChancePercent}% Crit Chance` : "",
        ].filter(Boolean);
        return {
            label: ACCOUNT_MULTIPLIER_DETAILS[category].label,
            value: `${progress.completed}/${progress.total} · ${rewards.join(", ") || "No bonus"}`,
            icon: category === "pet-quest" ? "/account-icons/health-up.png" : `/account-icons/${category}.png`,
            secondaryIcon: category === "pet-quest" ? "/account-icons/damage-up.png" : undefined,
        };
    });
}

export function getConditionSummary(build: Build): CombatSummaryItem[] {
    const context = COMBAT_CONTEXTS.find(({ id }) => id === build.combatContext) ?? COMBAT_CONTEXTS[0];
    const items: CombatSummaryItem[] = [{ label: "Encounter", value: context.label, icon: context.icon }];
    if (build.targetIsBoss) items.push({ label: "Target is Boss", value: "Active", icon: "/passive-images/boss-slayer.png" });
    if (build.targetStatused) items.push({ label: "Burning or Poisoned", value: "Active", icon: "/icons/burn-effect.png", secondaryIcon: "/icons/poison-effect.png" });
    if (build.rallyingWarCryActive) items.push({ label: "Team Damage Increase", value: "Active", icon: "/icons/damage-increase.png" });
    if (build.vulnerabilityActive) items.push({ label: "Vulnerability", value: "Active", icon: "/icons/vulnerability.png" });
    if (build.rudeAwakeningActive) items.push({ label: "Rude Awakening", value: "2× Damage", icon: "/attributes/rude-awakening.png" });
    items.push({ label: "Current HP", value: `${build.currentHpPercent}%`, icon: "/account-icons/health.png" });
    return items;
}

export function getBuildSummary(build: Build): CombatSummaryItem[] {
    const weapon = getEquipment(build.weaponId);
    const armor = getEquipment(build.armorId);
    const trait = getTrait(build.traitId);
    const mutationIcons: Record<string, string> = { huge: "/icons/Huge.png", shiny: "/icons/Shiny.png", bloodlit: "/icons/Bloodlit.png", fairy: "/icons/Fairy.png", "huge-x": "/icons/huge-x.png", "shiny-x": "/icons/shiny-x.png", "bloodlit-x": "/icons/bloodlit-x.png", "fairy-x": "/icons/fairy-x.png" };
    const skill = getSkill(build.selectedSkillId);
    return [
        { label: "Build", value: `${(build.combatMode ?? "pve").toUpperCase()} · Lv ${build.level} · Rank ${build.rank ?? "E"} · +${build.enhancement}`, icon: "/account-icons/damage.png" },
        { label: "Breed ATK / HP", value: `${build.damageGeneticPotential}% / ${build.healthGeneticPotential}% · EM ${build.evolutionPercent}%`, icon: "/icons/breed-attack.png", secondaryIcon: "/icons/breed-health.png" },
        { label: "Weapon", value: weapon ? `${weapon.name} (${weapon.percentage}%)` : "None", icon: weapon ? `/gear/${weapon.id}.png` : "/account-icons/damage.png" },
        { label: "Armor", value: armor ? `${armor.name} (${armor.percentage}%)` : "None", icon: armor ? `/gear/${armor.id}.png` : "/account-icons/health.png" },
        ...(trait ? [{ label: "Trait", value: trait.name, icon: trait.image }] : []),
        ...build.mutations.map((mutation) => ({ label: "Mutation", value: mutation.replace("-x", " X"), icon: mutationIcons[mutation] })),
        ...build.weaponAttributeIds.flatMap((id) => { const attribute = getAttribute(id); return attribute ? [{ label: "Weapon Attribute", value: attribute.name, icon: `/attributes/${id}.png` }] : []; }),
        ...build.armorAttributeIds.flatMap((id) => { const attribute = getAttribute(id); return attribute ? [{ label: "Armor Attribute", value: attribute.name, icon: `/attributes/${id}.png` }] : []; }),
        ...(skill ? [{ label: "Skill", value: skill.name, icon: "/account-icons/damage.png" }] : []),
        ...build.teammateMonsterIds.flatMap((id) => { const monster = monsters.find((entry) => entry.id === id); return monster ? [{ label: "Teammate", value: monster.name, icon: monster.image || "/account-icons/damage.png" }] : []; }),
    ];
}
