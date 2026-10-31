import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getEquipment } from "../data/equipments";
import { getAttribute } from "../data/attributes";
import { getMonsterStatData } from "../data/monster-stats";
import { createDefaultBuild } from "../types/build";
import { calculateStats } from "./calculations/stats";
import { calculateSkillAttributeEffects, calculateStunAegisShield, getActiveAttributeIds, getAttributeSlotCount } from "./calculations/attributes";
import { GearShieldEffectCards } from "../components/calculator-results";

const fusionBuild = () => ({ ...createDefaultBuild({ monsterId: "dummee" }), armorId: "fusion-core" });

describe("Fusion Core and Stun Aegis", () => {
    it("imports selectable Secret armor, its fixed attribute, description, and images", () => {
        expect(getEquipment("fusion-core")).toMatchObject({ type: "armor", rarity: "Secret", percentage: 32, attributes: ["stun-aegis", "random", "random"] });
        expect(getAttributeSlotCount("Secret", "fusion-core")).toBe(2);
        expect(getAttribute("stun-aegis")).toMatchObject({ effectType: "stun_shield", value: 10, description: "When Stunned, gain a shield equal to 10% of your max Health." });
        for (const asset of ["gear/fusion-core.png", "attributes/stun-aegis.png", "icons/attribute-resistance.png"]) expect(existsSync(`public/${asset}`)).toBe(true);
    });

    it("applies the fixed attribute exactly once and computes a 10% shield", () => {
        const build = { ...fusionBuild(), armorAttributeIds: ["stun-aegis", "stun-aegis"] };
        expect(getActiveAttributeIds(build).filter(id => id === "stun-aegis")).toHaveLength(1);
        expect(calculateStunAegisShield(build, 123456)).toEqual({ percent: 10, amount: 12345.6 });
        expect(calculateSkillAttributeEffects(build, "Fire").stunShieldPercent).toBe(10);
    });

    it.each(["pve", "pvp"] as const)("uses calculated max Health in %s, including the armor's Health bonus", combatMode => {
        const build = { ...fusionBuild(), combatMode, level: 50, rank: "S" as const, mutations: ["huge" as const] };
        const stats = calculateStats(getMonsterStatData("dummee"), build)!;
        const withoutArmor = calculateStats(getMonsterStatData("dummee"), { ...build, armorId: null })!;
        expect(stats.health / withoutArmor.health).toBeCloseTo(1.32, 10);
        expect(calculateStunAegisShield(build, stats.health)?.amount).toBeCloseTo(stats.health * 0.1, 10);
    });

    it("does not become healing or affect output without the armor", () => {
        expect(calculateStunAegisShield({ ...fusionBuild(), armorId: null }, 10000)).toBeNull();
        expect(calculateStunAegisShield({ ...fusionBuild(), armorId: "nectar-heart" }, 10000)).toBeNull();
        const effects = calculateSkillAttributeEffects(fusionBuild(), "Common");
        expect(effects.maxHpRegenPerSecond).toBe(0);
        expect(effects.skillDamageMultiplier).toBe(1);
        for (const hp of [0, -1, NaN, Infinity]) expect(calculateStunAegisShield(fusionBuild(), hp)).toBeNull();
    });

    it("renders the shared shield card with its trigger, amount and icon, without inventing a duration", () => {
        const html = renderToStaticMarkup(createElement(GearShieldEffectCards, { build: fusionBuild(), maxHealth: 10000 }));
        expect(html).toContain("Stun Aegis");
        expect(html).toContain("When Stunned, gain a shield equal to 10% of your max Health.");
        expect(html).toContain("/icons/attribute-resistance.png");
        expect(html).toContain("shield");
        expect(html).not.toContain("2s");
        expect(renderToStaticMarkup(createElement(GearShieldEffectCards, { build: createDefaultBuild(), maxHealth: 10000 }))).toBe("");
    });
});
