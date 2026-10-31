// Temporary discovery group for the latest monster update. Replace this list
// with the next update's roster; it does not change actual obtainment sources.
export const NEW_MONSTER_IDS = ["gloombat", "emberkit", "grimveil", "palejack", "capejack"] as const;
export const NEW_MONSTERS_DATABASE_HREF = "/monster-database/?source=new";

export function isNewMonster(id: string): boolean {
    return NEW_MONSTER_IDS.some(candidate => candidate === id);
}

/** Read the actual URL after hydration, including on static GitHub Pages exports. */
export function getDatabaseSourceFilter(search: string): "New" | "All" {
    return new URLSearchParams(search).get("source")?.toLowerCase() === "new" ? "New" : "All";
}
