import type { Build } from "../types/build";
import type { TeamCombatContext } from "./team-model";

export const DUNGEON_TEAM_LEVEL = 60;

/** Team Dungeon mirrors Calculator: temporarily lock each monster to Lv 60. */
export function withTeamDungeonLevel(build: Build, isDungeon: boolean): Build {
  if (!build.monsterId) return build;
  if (isDungeon) {
    return build.level === DUNGEON_TEAM_LEVEL && build.preDungeonLevel != null
      ? build
      : { ...build, preDungeonLevel: build.preDungeonLevel ?? build.level, level: DUNGEON_TEAM_LEVEL };
  }
  return build.preDungeonLevel == null ? build
    : { ...build, level: build.preDungeonLevel, preDungeonLevel: null };
}

export function teamForCombatContext(builds: Build[], context: TeamCombatContext): Build[] {
  return builds.map((build) => withTeamDungeonLevel(build, context === "dungeon"));
}
