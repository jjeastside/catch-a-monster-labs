import { applyBreedingLimits } from "./breeding-limits";
import type { Build } from "../types/build";

/** A display/calculation projection; never overwrite the saved PvE settings. */
export function buildForCombatMode(build: Build, combatMode: "pve" | "pvp"): Build {
    build = applyBreedingLimits(build, build.monsterId);
    if (combatMode === "pve") return { ...build, combatMode };
    return { ...build, combatMode, combatContext: "standard", targetIsBoss: false,
        level: build.combatContext === "dungeon" ? build.preDungeonLevel ?? build.level : build.level };
}
