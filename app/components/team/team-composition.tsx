"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { AccountMultipliers } from "../account-multipliers";
import { BUILD_RANK_VISUALS, EvolutionMultiplierEditor } from "../build-editor";
import { getMonsterStatData } from "../../data/monster-stats";
import { getSkill, getSkillDisplayName } from "../../data/skills";
import { getMonsterPortraitStyles } from "../monster-overview-card";
import { ARMORS, WEAPONS, EQUIPMENT } from "../../data/equipments";
import { getAvailableTraits } from "../../data/traits";
import { chooseUniqueGear, rankTeamCandidates } from "../../lib/team-optimizer";
import { withTeamDungeonLevel, teamForCombatContext, DUNGEON_TEAM_LEVEL } from "../../lib/team-dungeon-level";
import { TraitSelect } from "../trait-select";
import { TraitIcon } from "../trait-icon";
import { AttributeSelect } from "../attribute-select";
import { getAttributesForGear, getAttribute } from "../../data/attributes";
import { getAttributeSlotCount, getFixedAttributeIds } from "../../lib/calculations/attributes";
import { assetPath } from "../../lib/asset-path";
import { CURRENT_MAX_LEVEL } from "../../lib/level-config";
import { calculateSkillSummary } from "../../lib/calculations/skill-summary";
import { calculateStats } from "../../lib/calculations/stats";
import { formatStatNumber } from "../../lib/format-numbers";
import { databaseSkillEffectDetails, getDatabaseSkillEffects } from "../../lib/skill-display";
import { getPassiveDescription, getPassiveUiName } from "../../lib/passive-display";
import { useCompareAccount } from "../../lib/use-compare-account";
import { createDefaultBuild, type Build, type Rank } from "../../types/build";
import type { Monster } from "../../types/monster";

import { GENETIC_POTENTIAL_VALUES } from "../../lib/calculations/genetic-potential";
import { MIN_EVOLUTION_PERCENT, MAX_EVOLUTION_PERCENT } from "../../lib/calculations/evolution";
import {
  TEAM_STORAGE_KEY, INVENTORY_STORAGE_KEY, SAVED_TEAMS_STORAGE_KEY,
  ranks, mutationOptions, availableMonsters, monsterById,
  makeBuild, sanitizeBuild, defaultTeam, defaultInventory, copyMonsterId, nextCopyKey,
  monsterDps, getEffectiveTeamPassives, effectiveTeamHealth, buildSignature, getTeamRole, effectSummaryLabel, compactBuildLabel,
  buildForGoal, goalTitle, goalDescription, signedPercent, recommendTeams, teamSynergyForBuilds,
  type TeamGoal, type TeamCombatContext, type InventoryBuilds, type InventoryFilter, type InventorySort, type SavedTeams,
  loadTeamStorage, mergeIndexProgress,
} from "../../lib/team-model";

import styles from "./team-composition.module.css";

// Use the same icon aliases as Calculator Results for alternate skill variants.
const SKILL_ICON_ALIASES: Record<string, string> = {
  "ghost-impact-vulnerability": "ghost-impact",
  "soul-reap-chain-vulnerability": "soul-reap-chain",
  "soul-reap-chain-scareharvest": "soul-reap-chain-poison",
};

function TeamMonsterPortrait({ monster, className, alt = "" }: { monster: Monster; className: string; alt?: string }) {
  const { portraitStyle, portraitFrameStyle } = getMonsterPortraitStyles(monster);
  return (
    <div className={className} data-rarity={monster.rarity} style={portraitFrameStyle}>
      <div className={styles.portraitInner} style={portraitStyle}>
        <img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt={alt} />
      </div>
    </div>
  );
}

// Keep S rank consistent with the Calculator's rainbow rank label.
// BUILD_RANK_VISUALS is the shared source of truth for all rank colors.
function TeamRankText({ rank }: { rank: Rank | null | undefined }) {
  if (!rank) return <span>—</span>;
  const visual = BUILD_RANK_VISUALS[rank];
  return (
    <span
      style={visual.labelBackground
        ? {
            display: "inline-block",
            backgroundImage: visual.labelBackground,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 1px 0 #050608)",
          }
        : { color: visual.color }}
    >
      {rank}
    </span>
  );
}

type OverviewIconKind = "damage" | "health" | "dps" | "survivability" | "synergy";

function OverviewIcon({ kind }: { kind: OverviewIconKind }) {
  // Reuse the exact asset paths shown beside each monster in the Team Builder.
  const statIcons: Partial<Record<OverviewIconKind, string>> = {
    damage: "/account-icons/damage.png",
    health: "/account-icons/health.png",
    dps: "/icons/dps.png",
  };
  const statIcon = statIcons[kind];
  if (statIcon) return <img className={styles.overviewIcon} src={assetPath(statIcon)} alt="" aria-hidden="true" />;
  const paths: Record<OverviewIconKind, ReactNode> = {
    damage: <><path d="m13.5 2-8 11h6l-1 9 8-12h-6z" /></>,
    health: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></>,
    dps: <><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /><path d="m15 9 6-6" /></>,
    survivability: <><path d="M12 2 4 5v6c0 5 3.3 8.4 8 11 4.7-2.6 8-6 8-11V5z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
    synergy: <><circle cx="12" cy="4" r="2" /><circle cx="4" cy="18" r="2" /><circle cx="20" cy="18" r="2" /><path d="m10.5 5.7-5 10.6m8-10.6 5 10.6M6 18h12" /></>,
  };
  return <svg className={`${styles.overviewIcon} ${styles[`overviewIcon_${kind}`]}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

const INVENTORY_ELEMENTS = [...new Set(availableMonsters.map((monster) => monster.element))].sort();
const INVENTORY_RARITIES = [...new Set(availableMonsters.map((monster) => monster.rarity))].sort();

const combatContextLabel = (context: TeamCombatContext) => ({
  standard: "Standard", boss: "Boss", rift: "Rift", spire: "Tower / Spire", dungeon: "Dungeon",
})[context];

const HIDDEN_MONSTERS_STORAGE_KEY = "cam-lab-team-hidden-monsters-v1";
const OWNED_EQUIPMENT_KEY = "cam-lab-team-owned-equipment-v1";
// A one-time migration marker prevents deliberately unequipped gear from returning
// when an old build still has stale equipment IDs.
const EQUIPMENT_MIGRATION_KEY = "cam-lab-team-equipment-migrated-v2";
type OwnedEquipmentCopy = { id: string; equipmentId: string; attributeIds: string[]; equippedTo?: string };
const equipmentRarityColors: Record<string, string> = { Rare: "#69c7ff", Epic: "#de7cff", Legendary: "#ffb15f", Mythical: "#78dfac", Secret: "#ff725c" };
function validOwnedEquipment(value: unknown): OwnedEquipmentCopy[] {
  if (!Array.isArray(value)) return [];
  const used = new Set<string>();
  return value.flatMap((entry): OwnedEquipmentCopy[] => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Partial<OwnedEquipmentCopy>;
    if (typeof record.id !== "string" || !record.id || used.has(record.id) || !EQUIPMENT.some((gear) => gear.id === record.equipmentId)) return [];
    used.add(record.id);
    const gear = EQUIPMENT.find((item) => item.id === record.equipmentId)!;
    const choices = getAttributesForGear(gear.type);
    const usedAttributeIds = new Set<string>();
    const attributeIds = Array.from({ length: getAttributeSlotCount(gear.rarity) }, (_, slot) => {
      const id = Array.isArray(record.attributeIds) ? record.attributeIds[slot] : null;
      if (typeof id !== "string" || usedAttributeIds.has(id) || !choices.some((attr) => attr.id === id)) return "";
      usedAttributeIds.add(id);
      return id;
    });
    return [{ id: record.id, equipmentId: gear.id, attributeIds, equippedTo: typeof record.equippedTo === "string" ? record.equippedTo : undefined }];
  });
}
// Inventory monster IDs are stable across the team and inventory editors. Unowned
// team builds use a slot ID until they are saved to the inventory.
const inventoryOwner = (copyId: string) => `inventory:${copyId}`;
const teamOwner = (build: Build, index: number) => build.inventoryCopyId
  ? inventoryOwner(build.inventoryCopyId) : `team:${index}`;

function withOwnedGear(build: Build, owner: string, copies: OwnedEquipmentCopy[]): Build {
  // A saved build is not proof of ownership: only an assigned physical copy is.
  // Clearing both fields first prevents old build IDs from resurrecting unequipped gear.
  let next: Build = { ...build, weaponId: null, weaponAttributeIds: [], armorId: null, armorAttributeIds: [] };
  for (const copy of copies) {
    if (copy.equippedTo !== owner) continue;
    const gear = EQUIPMENT.find((item) => item.id === copy.equipmentId);
    if (!gear) continue;
    next = gear.type === "weapon"
      ? { ...next, weaponId: gear.id, weaponAttributeIds: [...copy.attributeIds] }
      : { ...next, armorId: gear.id, armorAttributeIds: [...copy.attributeIds] };
  }
  return next;
}

// Older releases stored gear on monster builds without an owned-copy record.
// Preserve those selections exactly once, rather than dropping them on hydration.
function migrateLegacyEquipment(
  copies: OwnedEquipmentCopy[], team: Build[], inventory: InventoryBuilds,
): OwnedEquipmentCopy[] {
  const result = copies.map((copy) => ({ ...copy, attributeIds: [...copy.attributeIds] }));
  const entries = [
    ...team.map((build, index) => [teamOwner(build, index), build] as const),
    ...Object.entries(inventory).map(([id, build]) => [inventoryOwner(id), build] as const),
  ];
  const processed = new Set<string>();
  for (const [owner, build] of entries) {
    if (!build.monsterId || processed.has(owner)) continue;
    processed.add(owner);
    for (const type of ["weapon", "armor"] as const) {
      const gearId = type === "weapon" ? build.weaponId : build.armorId;
      const attributes = type === "weapon" ? build.weaponAttributeIds : build.armorAttributeIds;
      if (!gearId || result.some((copy) => copy.equippedTo === owner && EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type === type)) continue;
      // Team and Inventory often have two legacy snapshots of the same monster.
      // Do not create two physical copies of the same item when the team already
      // references that monster's old inventory build.
      if (owner.startsWith("inventory:") && team.some((member) =>
        member.monsterId === build.monsterId && !member.inventoryCopyId &&
        (type === "weapon" ? member.weaponId : member.armorId) === gearId &&
        JSON.stringify(type === "weapon" ? member.weaponAttributeIds : member.armorAttributeIds) === JSON.stringify(attributes))) continue;
      const available = result.filter((copy) => copy.equipmentId === gearId && !copy.equippedTo);
      const matching = available.find((copy) => JSON.stringify(copy.attributeIds.filter(Boolean)) === JSON.stringify((attributes ?? []).filter(Boolean)));
      const candidate = matching ?? (available.length === 1 ? available[0] : undefined);
      if (candidate) candidate.equippedTo = owner;
      else if (EQUIPMENT.some((gear) => gear.id === gearId)) {
        // There may be no owned-equipment record at all in pre-inventory saves.
        // Create the missing physical copy instead of wiping the saved gear.
        result.push({ id: crypto.randomUUID(), equipmentId: gearId, attributeIds: [...(attributes ?? [])], equippedTo: owner });
      }
    }
  }
  return result;
}

// Old builds can change from a temporary team-slot identity to a permanent
// inventory-copy identity without transferring their previously assigned gear.
function normalizeEquipmentOwners(copies: OwnedEquipmentCopy[], team: Build[]): OwnedEquipmentCopy[] {
  const claimed = new Set<string>();
  return copies.map((copy) => {
    const slot = /^team:([0-2])$/.exec(copy.equippedTo ?? "");
    if (!slot) return copy;
    const build = team[Number(slot[1])];
    if (!build?.monsterId) return { ...copy, equippedTo: undefined };
    if (!build.inventoryCopyId) return copy;
    const owner = inventoryOwner(build.inventoryCopyId);
    const type = EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type;
    if (!type) return copy;
    const key = `${owner}:${type}`;
    const alreadyAssigned = copies.some((other) => other.equippedTo === owner && EQUIPMENT.find((gear) => gear.id === other.equipmentId)?.type === type);
    if (alreadyAssigned || claimed.has(key)) return { ...copy, equippedTo: undefined };
    claimed.add(key);
    return { ...copy, equippedTo: owner };
  });
}

function OwnedGearSelect({ label, type, owner, copies, onSelect }: {
  label: string; type: "weapon" | "armor"; owner: string;
  copies: OwnedEquipmentCopy[]; onSelect: (copyId: string | null) => void;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  const assigned = copies.find((copy) => copy.equippedTo === owner && EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type === type);
  const current = assigned ? EQUIPMENT.find((gear) => gear.id === assigned.equipmentId) : null;
  const choose = (copyId: string | null) => { onSelect(copyId); if (panel.current) panel.current.open = false; };
  return <details ref={panel} className={styles.ownedGearSelect}>
    <summary><span className={styles.ownedGearLabel}>{label}</span><span className={styles.ownedGearCurrent}>
      {current ? <img src={assetPath(`/gear/${current.id}.png`)} alt="" style={{ borderColor: equipmentRarityColors[current.rarity] }} /> : null}
      <span>{current?.name ?? `No ${label.toLowerCase()}`}
        <small>{current ? `+${current.percentage}% ${type === "weapon" ? "Damage" : "Health"}${getAttributeSlotCount(current.rarity) ? ` · ${assigned!.attributeIds.filter(Boolean).map((id) => getAttribute(id)?.name ?? id).join(", ") || "Attributes not selected"}` : ""}` : "Unequipped"}</small></span>
    </span></summary>
    <div className={styles.ownedGearOptions}>
      <button type="button" onClick={() => choose(null)}>Unequip {label}</button>
      {copies.filter((copy) => EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type === type).map((copy) => {
        const gear = EQUIPMENT.find((item) => item.id === copy.equipmentId)!;
        const unavailable = Boolean(copy.equippedTo && copy.equippedTo !== owner);
        return <button type="button" key={copy.id} disabled={unavailable} onClick={() => choose(copy.id)} className={copy.id === assigned?.id ? styles.ownedGearActive : ""}>
          <img src={assetPath(`/gear/${gear.id}.png`)} alt="" style={{ borderColor: equipmentRarityColors[gear.rarity] }} />
          <span><strong style={{ color: equipmentRarityColors[gear.rarity] }}>{gear.name} · +{gear.percentage}% {type === "weapon" ? "Damage" : "Health"}</strong>
          {getAttributeSlotCount(gear.rarity) ? <small>{copy.attributeIds.filter(Boolean).map((id) => getAttribute(id)?.name ?? id).join(", ") || "Attributes not selected"}</small> : null}
          {copy.equippedTo ? <small>{unavailable ? `Equipped to ${copy.equippedTo.startsWith("inventory:") ? copy.equippedTo.slice(10) : `team slot ${Number(copy.equippedTo.slice(5)) + 1}`}` : "Equipped here"}</small> : null}</span>
        </button>;
      })}
      {!copies.some((copy) => EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type === type) ? <small>Add {label.toLowerCase()} in the Equipment inventory first.</small> : null}
    </div>
  </details>;
}

const INVENTORY_FAVORITES_KEY = "cam-lab-team-inventory-favorites-v1";

const teamMutationFamilies = [
  { id: "huge", xId: "huge-x", label: "Huge", icon: "/icons/Huge.png", xIcon: "/icons/huge-x.png", accent: "#e954d8" },
  { id: "shiny", xId: "shiny-x", label: "Shiny", icon: "/icons/Shiny.png", xIcon: "/icons/shiny-x.png", accent: "#e9c83f" },
  { id: "bloodlit", xId: "bloodlit-x", label: "Bloodlit", icon: "/icons/Bloodlit.png", xIcon: "/icons/bloodlit-x.png", accent: "#ed4b60" },
  { id: "fairy", xId: "fairy-x", label: "Fairy", icon: "/icons/Fairy.png", xIcon: "/icons/fairy-x.png", accent: "#a867ff" },
] as const;

export function TeamComposition() {
  const [search, setSearch] = useState("");
  const blockedStorageKeys = useRef(new Set<string>());
  const editorRef = useRef<HTMLDialogElement>(null);
  const inventoryImportRef = useRef<HTMLInputElement>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [team, setTeam] = useState<Build[]>(defaultTeam);
  const [inventoryBuilds, setInventoryBuilds] = useState<InventoryBuilds>(defaultInventory);
  const [accountBuild, setAccountBuild] = useState<Build>(() => createDefaultBuild());
  const [goal, setGoal] = useState<TeamGoal>("balanced");
  const [combatContext, setCombatContext] = useState<TeamCombatContext>("standard");
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [inventorySort, setInventorySort] = useState<InventorySort>("name");
  const [inventoryFilterPanel, setInventoryFilterPanel] = useState<"sort" | "browse" | null>(null);
  const [inventoryElement, setInventoryElement] = useState("all");
  const [inventoryRarity, setInventoryRarity] = useState("all");
  const [ownedEquipment, setOwnedEquipment] = useState<OwnedEquipmentCopy[]>([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<"all" | "weapon" | "armor">("all");
  const [equipmentToAdd, setEquipmentToAdd] = useState("");
  const [addGearMenuOpen, setAddGearMenuOpen] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [inventoryTab, setInventoryTab] = useState<"monsters" | "equipment" | "items">("monsters");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteMonsterIds, setFavoriteMonsterIds] = useState<string[]>([]);
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null);
  const [savedTeams, setSavedTeams] = useState<SavedTeams>({});
  const [selectedTeamSlot, setSelectedTeamSlot] = useState("slot-1");
  const [teamPresetMessage, setTeamPresetMessage] = useState<string | null>(null);
  const [teamLibraryOpen, setTeamLibraryOpen] = useState(false);
  const [teamSaveName, setTeamSaveName] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [isSynergyExpanded, setIsSynergyExpanded] = useState(false);
  const [recommendationMode, setRecommendationMode] = useState<"team" | "improve">("team");
  const [improvementScope, setImprovementScope] = useState<"team" | "all">("team");
  const [editingTeamSlot, setEditingTeamSlot] = useState<number | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [replacingTeamSlot, setReplacingTeamSlot] = useState<number | null>(null);
  const [replacementSearch, setReplacementSearch] = useState("");
  const [hiddenMonsterIds, setHiddenMonsterIds] = useState<string[]>([]);
  const [showHiddenMonsters, setShowHiddenMonsters] = useState(false);

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(INVENTORY_FAVORITES_KEY) ?? "[]");
      if (Array.isArray(value)) setFavoriteMonsterIds(value.filter((id): id is string => typeof id === "string"));
    } catch { /* Ignore malformed optional UI preferences. */ }
  }, []);

  const toggleInventoryFavorite = (id: string) => setFavoriteMonsterIds((current) => {
    const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
    try { localStorage.setItem(INVENTORY_FAVORITES_KEY, JSON.stringify(next)); } catch { /* Browsing still works without storage. */ }
    return next;
  });

  useCompareAccount(accountBuild.accountMultipliers, setAccountBuild);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      // Access localStorage lazily so browsers which deny access are handled too.
      const restored = loadTeamStorage({ getItem: (key) => window.localStorage.getItem(key) });
      blockedStorageKeys.current = new Set(restored.blockedKeys);
      // Restore equipment before exposing the team: assigned copies are authoritative
      // and their individual attribute slots must survive a refresh.
      let restoredEquipment: OwnedEquipmentCopy[] = [];
      let legacyEquipmentFormat = false;
      try {
        const rawEquipment = window.localStorage.getItem(OWNED_EQUIPMENT_KEY);
        const parsedEquipment: unknown = rawEquipment === null ? [] : JSON.parse(rawEquipment);
        if (!Array.isArray(parsedEquipment)) throw new Error("Invalid owned equipment");
        restoredEquipment = validOwnedEquipment(parsedEquipment);
        // Do not replace an unrecognized inventory with an empty one.
        if (restoredEquipment.length !== parsedEquipment.length) throw new Error("Unrecognized owned equipment copies");
        legacyEquipmentFormat = !window.localStorage.getItem(EQUIPMENT_MIGRATION_KEY) && restoredEquipment.length === 0;
        // A backup of pre-migration records is useful if a player needs to recover
        // an old save. Never overwrite an existing backup.
        if (legacyEquipmentFormat) {
          if (rawEquipment !== null && !window.localStorage.getItem(`${OWNED_EQUIPMENT_KEY}-backup`)) {
            window.localStorage.setItem(`${OWNED_EQUIPMENT_KEY}-backup`, rawEquipment);
          }
        }
      } catch {
        blockedStorageKeys.current.add(OWNED_EQUIPMENT_KEY);
        setStorageError("Saved equipment could not be read. It has not been overwritten; repair or export your browser data before changing equipment.");
      }
      if (!blockedStorageKeys.current.has(OWNED_EQUIPMENT_KEY)) {
        if (legacyEquipmentFormat) restoredEquipment = migrateLegacyEquipment(restoredEquipment, restored.team, restored.inventory);
        restoredEquipment = normalizeEquipmentOwners(restoredEquipment, restored.team);
        if (legacyEquipmentFormat) {
          try {
            // Commit the migrated copies BEFORE marking migration complete. If
            // the page reloads before React effects flush, the gear survives.
            window.localStorage.setItem(OWNED_EQUIPMENT_KEY, JSON.stringify(restoredEquipment));
            window.localStorage.setItem(EQUIPMENT_MIGRATION_KEY, "1");
          } catch {
            blockedStorageKeys.current.add(OWNED_EQUIPMENT_KEY);
            setStorageError("Legacy equipment could not be migrated safely. Original browser data was not overwritten.");
          }
        }
      }
      setOwnedEquipment(restoredEquipment);
      setTeam(teamForCombatContext(restored.team.map((build, index) => build.monsterId && !blockedStorageKeys.current.has(OWNED_EQUIPMENT_KEY)
        ? withOwnedGear(build, teamOwner(build, index), restoredEquipment) : build), restored.combatContext));
      setGoal(restored.goal);
      setCombatContext(restored.combatContext ?? "standard");
      setInventoryBuilds(Object.fromEntries(Object.entries(restored.inventory).map(([copyId, build]) => [
        copyId, blockedStorageKeys.current.has(OWNED_EQUIPMENT_KEY) ? build : withOwnedGear(build, inventoryOwner(copyId), restoredEquipment),
      ])));
      setSavedTeams(restored.presets);
      try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(HIDDEN_MONSTERS_STORAGE_KEY) ?? "[]");
        if (Array.isArray(parsed)) setHiddenMonsterIds(parsed.filter((id): id is string => typeof id === "string" && monsterById.has(id)));
      } catch { /* Bad preference data does not affect saved inventory or teams. */ }
      if (restored.blockedKeys.length) {
        setStorageError("Some saved data could not be loaded. Those records are preserved, but changes to them will not save this session. Other saved records were loaded normally.");
      }
      setStorageReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!storageReady || blockedStorageKeys.current.has(TEAM_STORAGE_KEY)) return;
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify({ builds: team, goal, combatContext }));
    } catch {
      queueMicrotask(() => setStorageError("Browser storage is unavailable or full. Your latest changes have not been saved."));
    }
  }, [storageReady, team, goal, combatContext]);

  useEffect(() => {
    if (!storageReady || blockedStorageKeys.current.has(INVENTORY_STORAGE_KEY)) return;
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryBuilds));
    } catch {
      queueMicrotask(() => setStorageError("Browser storage is unavailable or full. Your latest changes have not been saved."));
    }
  }, [storageReady, inventoryBuilds]);

  useEffect(() => {
    if (!storageReady || blockedStorageKeys.current.has(OWNED_EQUIPMENT_KEY)) return;
    try {
      const snapshot = JSON.stringify(ownedEquipment);
      localStorage.setItem(OWNED_EQUIPMENT_KEY, snapshot);
      if (localStorage.getItem(OWNED_EQUIPMENT_KEY) !== snapshot) throw new Error("Equipment save was not retained");
    } catch { queueMicrotask(() => setStorageError("Equipment could not be saved to browser storage. Check browser storage permissions and available space.")); }
  }, [storageReady, ownedEquipment]);

  useEffect(() => {
    if (!storageReady || blockedStorageKeys.current.has(SAVED_TEAMS_STORAGE_KEY)) return;
    try {
      localStorage.setItem(SAVED_TEAMS_STORAGE_KEY, JSON.stringify(savedTeams));
    } catch {
      queueMicrotask(() => setStorageError("Browser storage is unavailable or full. Your latest changes have not been saved."));
    }
  }, [storageReady, savedTeams]);

  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem(HIDDEN_MONSTERS_STORAGE_KEY, JSON.stringify(hiddenMonsterIds)); }
    catch { /* Browsers may disable preference storage. */ }
  }, [storageReady, hiddenMonsterIds]);

  const toggleHiddenMonster = (monsterId: string) => {
    setHiddenMonsterIds((current) => current.includes(monsterId)
      ? current.filter((id) => id !== monsterId)
      : [...current, monsterId]);
  };

  useEffect(() => {
    if (!editingInventoryId || !editorRef.current) return;
    const dialog = editorRef.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [editingInventoryId]);

  // Inventory and saved-team confirmations should not remain on screen indefinitely.
  // The timeout is cancelled if a newer message replaces the previous one.
  useEffect(() => {
    if (!inventoryMessage) return;
    const timeout = window.setTimeout(() => setInventoryMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [inventoryMessage]);

  useEffect(() => {
    if (!teamPresetMessage) return;
    const timeout = window.setTimeout(() => setTeamPresetMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [teamPresetMessage]);

  const ownedIds = useMemo(() => Object.keys(inventoryBuilds), [inventoryBuilds]);
  const copiesFor = (monsterId: string) => ownedIds.filter((key) => copyMonsterId(key) === monsterId);
  const teamIds = useMemo(
    () => team.flatMap((build) => (build.monsterId ? [build.monsterId] : [])),
    [team],
  );

  const resolvedTeam = team.map((savedBuild, index) => {
    const monster = savedBuild.monsterId ? monsterById.get(savedBuild.monsterId) ?? null : null;
    if (!monster) return { monster: null, build: savedBuild, stats: null, dps: 0, skillPreviews: [], supportCount: 0 };

    const teammateIds = team
      .filter((_, teammateIndex) => teammateIndex !== index)
      .flatMap((candidate) => (candidate.monsterId ? [candidate.monsterId] : []));

    const build = buildForGoal({
      ...withOwnedGear(savedBuild, teamOwner(savedBuild, index), ownedEquipment),
      accountMultipliers: accountBuild.accountMultipliers,
      teammateMonsterIds: [teammateIds[0] ?? null, teammateIds[1] ?? null],
      evolutionPercent: monster.isEvolved ? savedBuild.evolutionPercent : 100,
    }, combatContext);
    const effectivePassives = getEffectiveTeamPassives(monster, build);
    const stats = calculateStats(getMonsterStatData(monster.id), build, effectivePassives);
    const skillPreviews = stats
      ? monster.skillIds.flatMap((skillId) => {
          const skill = getSkill(skillId);
          if (!skill) return [];
          const summary = calculateSkillSummary(monster, skill, stats, build, effectivePassives);
          const supportEffects = (skill.statusEffects ?? []).filter(
            (effect) => effect.target === "Team" || effect.type === "healing" || effect.type === "shield" || effect.type === "vulnerability" || effect.type === "damageDecrease" || effect.type === "damageReduction" || effect.type === "stun" || effect.type === "taunt",
          );
          return [{ skill, summary, supportEffects }];
        })
      : [];
    const dps = skillPreviews.reduce((sum, preview) => sum + (preview.summary.dps ?? 0), 0);
    const supportCount = skillPreviews.reduce((sum, preview) => sum + preview.supportEffects.length, 0);
    return { monster, build, stats, dps, skillPreviews, supportCount };
  });

  const maxTeamDps = Math.max(0, ...resolvedTeam.map((item) => item.dps));
  const maxTeamHealth = Math.max(0, ...resolvedTeam.map((item) => item.stats?.health ?? 0));

  const teamUtility = resolvedTeam.reduce<Record<string, number>>((result, item) => {
    for (const preview of item.skillPreviews ?? []) {
      for (const effect of preview.supportEffects) {
        const key = effectSummaryLabel(effect.type);
        result[key] = (result[key] ?? 0) + 1;
      }
    }
    return result;
  }, {});

  // A recommendation and the active Team Overview call the very same scorer.
  // Keep actual owned gear on the equipped team before scoring it.
  const teamSynergy = teamSynergyForBuilds(
    resolvedTeam.map((item) => item.build), accountBuild.accountMultipliers, combatContext);

  const totals = resolvedTeam.reduce(
    (result, item) => ({
      health: result.health + (item.stats?.health ?? 0),
      damage: result.damage + (item.stats?.damage ?? 0),
      dps: result.dps + item.dps,
      effectiveHealth: result.effectiveHealth + (item.monster && item.stats ? effectiveTeamHealth(item.monster, item.build, item.stats.health) : 0),
      monsters: result.monsters + (item.monster ? 1 : 0),
    }),
    { health: 0, damage: 0, dps: 0, effectiveHealth: 0, monsters: 0 },
  );

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rankIndex = (rank: Rank | null | undefined) => ranks.indexOf(rank ?? "E");
    const statCache = new Map<string, { dps: number; health: number }>();
    const getSavedStats = (monster: Monster) => {
      const cached = statCache.get(monster.id);
      if (cached) return cached;
      const saved = inventoryBuilds[monster.id] ?? makeBuild(monster.id);
      const build: Build = {
        ...saved,
        accountMultipliers: accountBuild.accountMultipliers,
        evolutionPercent: monster.isEvolved ? saved.evolutionPercent : 100,
      };
      const statData = getMonsterStatData(monster.id);
      const stats = statData ? calculateStats(statData, build, monster.passives ?? []) : null;
      const result = { dps: monsterDps(monster, build), health: stats?.health ?? 0 };
      statCache.set(monster.id, result);
      return result;
    };

    return availableMonsters
      .filter((monster) => {
        if (hiddenMonsterIds.includes(monster.id) && !showHiddenMonsters) return false;
        if (query && ![monster.name, monster.element, monster.rarity].some((value) => value.toLowerCase().includes(query))) return false;
        const owned = ownedIds.some((copyId) => copyMonsterId(copyId) === monster.id);
        if (inventoryFilter === "owned" && !owned) return false;
        if (inventoryFilter === "unowned" && owned) return false;
        if (inventoryFilter === "team" && !teamIds.includes(monster.id)) return false;
        if (inventoryElement !== "all" && monster.element !== inventoryElement) return false;
        if (inventoryRarity !== "all" && monster.rarity !== inventoryRarity) return false;
        if (favoritesOnly && !favoriteMonsterIds.includes(monster.id)) return false;
        return true;
      })
      .sort((a, b) => {
        if (inventorySort === "rank") return rankIndex(inventoryBuilds[b.id]?.rank) - rankIndex(inventoryBuilds[a.id]?.rank) || a.name.localeCompare(b.name);
        if (inventorySort === "level") return (inventoryBuilds[b.id]?.level ?? 0) - (inventoryBuilds[a.id]?.level ?? 0) || a.name.localeCompare(b.name);
        if (inventorySort === "dps") return getSavedStats(b).dps - getSavedStats(a).dps || a.name.localeCompare(b.name);
        if (inventorySort === "health") return getSavedStats(b).health - getSavedStats(a).health || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name);
      });
  }, [search, inventoryFilter, inventorySort, inventoryElement, inventoryRarity, favoritesOnly, favoriteMonsterIds, inventoryBuilds, accountBuild.accountMultipliers, teamIds, hiddenMonsterIds, showHiddenMonsters, ownedIds]);

  const activeInventoryFilters = Number(inventoryFilter !== "all") + Number(favoritesOnly)
    + Number(inventoryElement !== "all") + Number(inventoryRarity !== "all");
  const clearInventoryFilters = () => {
    setInventoryFilter("all");
    setFavoritesOnly(false);
    setInventoryElement("all");
    setInventoryRarity("all");
  };

  // Compare individual gear copies with their real saved attributes, using the
  // same contextual calculator as the build editor. Never treat a DB entry as owned.
  const equipmentPreview = useMemo(() => {
    const assess = (monster: Monster, saved: Build) => {
      const contextBuild = buildForGoal({ ...saved, accountMultipliers: accountBuild.accountMultipliers,
        teammateMonsterIds: [null, null], evolutionPercent: monster.isEvolved ? saved.evolutionPercent : 100 }, combatContext);
      const data = getMonsterStatData(monster.id);
      const stats = data ? calculateStats(data, contextBuild, monster.passives ?? []) : null;
      return { dps: monsterDps(monster, contextBuild), health: effectiveTeamHealth(monster, contextBuild, stats?.health ?? 0) };
    };
    const score = (dps: number, health: number) => goal === "damage" ? dps
      : goal === "survivability" ? health * 0.8 + dps * 0.2
      : goal === "support" ? dps * 0.45 + health * 0.55 : dps * 0.6 + health * 0.4;
    const withCopy = (build: Build, copy: OwnedEquipmentCopy) => {
      const gear = EQUIPMENT.find((item) => item.id === copy.equipmentId)!;
      return gear.type === "weapon" ? { ...build, weaponId: gear.id, weaponAttributeIds: [...copy.attributeIds] }
        : { ...build, armorId: gear.id, armorAttributeIds: [...copy.attributeIds] };
    };
    const baseline = (build: Build, type: "weapon" | "armor") => type === "weapon"
      ? { ...build, weaponId: null, weaponAttributeIds: [] }
      : { ...build, armorId: null, armorAttributeIds: [] };
    return { assess, score, withCopy, baseline };
  }, [accountBuild.accountMultipliers, combatContext, goal]);

  // The first pass allows each candidate to be evaluated with the best copy of
  // each gear type. The final three-member pass below resolves copy conflicts.
  const optimizedCandidates = useMemo(() => Object.fromEntries(Object.entries(inventoryBuilds)
    .filter(([copyId]) => !hiddenMonsterIds.includes(copyMonsterId(copyId)))
    .map(([copyId, saved]) => {
      const monster = monsterById.get(copyMonsterId(copyId));
      if (!monster) return [copyId, saved];
      let candidate = saved;
      for (const type of ["weapon", "armor"] as const) {
        const initial = equipmentPreview.baseline(candidate, type);
        let best = initial;
        const baseStats = equipmentPreview.assess(monster, initial);
        let highest = equipmentPreview.score(1, 1);
        for (const copy of ownedEquipment) {
          if (EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type !== type) continue;
          const trial = equipmentPreview.withCopy(initial, copy);
          const metrics = equipmentPreview.assess(monster, trial);
          const value = equipmentPreview.score(metrics.dps / Math.max(1, baseStats.dps), metrics.health / Math.max(1, baseStats.health));
          if (value > highest) { highest = value; best = trial; }
        }
        // Do not strip legacy gear from pre-existing saved builds when no owned
        // copy is available. This is an estimate, not an inventory migration.
        candidate = best === initial && !ownedEquipment.some((copy) => EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type === type)
          ? candidate : best;
      }
      return [copyId, candidate];
    })), [inventoryBuilds, hiddenMonsterIds, ownedEquipment, equipmentPreview]);

  const preliminaryRecommendation = useMemo(
    () => recommendTeams(optimizedCandidates, accountBuild.accountMultipliers, goal, combatContext),
    [optimizedCandidates, accountBuild.accountMultipliers, goal, combatContext],
  );

  // All finalist trios receive their own non-conflicting gear allocation FIRST.
  // Only THEN do we select the team. Otherwise a single armor can appear on
  // three shortlisted monsters and an unprotected support may incorrectly win.
  const rankedRecommendations = useMemo(() => {
    if (!preliminaryRecommendation) return null;
    const scored = preliminaryRecommendation.finalists.map((candidate) => {
      // A legacy build may still mention an unequipped item. Only a physical
      // owned copy assigned here may contribute to the recommendation: the
      // live Team Overview applies the same rule through withOwnedGear().
      const builds = candidate.members.map(({ build }) =>
        equipmentPreview.baseline(equipmentPreview.baseline({ ...build }, "weapon"), "armor"));
      const assignments: Array<{ memberIndex: number; copy: OwnedEquipmentCopy; gain: number; from?: string }> = [];
      const used = new Set<string>();
      for (const type of ["weapon", "armor"] as const) {
        const choices: Array<{ memberIndex: number; copy: OwnedEquipmentCopy; gain: number }> = [];
        candidate.members.forEach(({ monster }, memberIndex) => {
          const base = equipmentPreview.baseline(builds[memberIndex], type);
          const before = equipmentPreview.assess(monster, base);
          ownedEquipment.forEach((copy) => {
            if (EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type !== type) return;
            const after = equipmentPreview.assess(monster, equipmentPreview.withCopy(base, copy));
            const gain = equipmentPreview.score(after.dps / Math.max(1, before.dps), after.health / Math.max(1, before.health)) - equipmentPreview.score(1, 1);
            choices.push({ memberIndex, copy, gain });
          });
        });
        const optimal = chooseUniqueGear(choices.map((choice) => ({
          ...choice, copyId: choice.copy.id,
        })), candidate.members.length);
        for (const choice of optimal) {
          if (used.has(choice.copy.id)) continue;
          used.add(choice.copy.id);
          builds[choice.memberIndex] = equipmentPreview.withCopy(builds[choice.memberIndex], choice.copy);
          assignments.push({ ...choice, from: choice.copy.equippedTo });
        }
      }
      const members = candidate.members.map((member, index) => {
        const build = buildForGoal({ ...builds[index],
          teammateMonsterIds: candidate.members.filter((_, i) => i !== index)
            .map((other) => other.monster.id).slice(0, 2) as [string, string],
        }, combatContext);
        const data = getMonsterStatData(member.monster.id);
        const stats = data ? calculateStats(data, build, getEffectiveTeamPassives(member.monster, build)) : null;
        return { ...member, build, dps: monsterDps(member.monster, build), health: stats?.health ?? 0,
          effectiveHealth: effectiveTeamHealth(member.monster, build, stats?.health ?? 0), damage: stats?.damage ?? 0 };
      });
      const synergy = teamSynergyForBuilds(members.map((member) => member.build), accountBuild.accountMultipliers, combatContext);
      return { ...candidate, members, synergy, synergyScore: synergy.score,
        weakestEffectiveHp: members.length ? Math.min(...members.map((member) => member.effectiveHealth)) : 0, assignments,
        totalDps: members.reduce((sum, member) => sum + member.dps, 0),
        totalHealth: members.reduce((sum, member) => sum + member.health, 0),
        totalEffectiveHealth: members.reduce((sum, member) => sum + member.effectiveHealth, 0) };
    });
    const ordered = rankTeamCandidates(scored, goal);
    const best = ordered[0];
    if (!best) return null;
    const memberReasons = best.members.map((member) => {
      const reasons: string[] = [];
      if (member.dps / Math.max(1, best.totalDps) >= .5) reasons.push("Primary damage dealer");
      if (member.effectiveHealth > member.health * 1.001) reasons.push("Encounter damage resistance");
      const effects = Object.keys(member.utility.labels).slice(0, 2);
      if (effects.length) reasons.push(effects.join(" + "));
      if (!reasons.length) reasons.push("Contributes calculated DPS and effective HP");
      return { monsterId: member.monster.id, reasons };
    });
    const alternatives = ordered.slice(1, 3).map((alternative) => {
      const bestIds = new Set(best.members.map((member) => member.build.inventoryCopyId ?? member.monster.id));
      const altIds = new Set(alternative.members.map((member) => member.build.inventoryCopyId ?? member.monster.id));
      const removed = best.members.filter((member) => !altIds.has(member.build.inventoryCopyId ?? member.monster.id)).map((member) => member.monster.name);
      const added = alternative.members.filter((member) => !bestIds.has(member.build.inventoryCopyId ?? member.monster.id)).map((member) => member.monster.name);
      return { ...alternative, swapLabel: removed.length || added.length
        ? `${removed.length ? `Replace ${removed.join(" + ")}` : "Change team"}${added.length ? ` with ${added.join(" + ")}` : ""}`
        : "Different owned builds", dpsDelta: best.totalDps > 0 ? (alternative.totalDps - best.totalDps) / best.totalDps : 0,
        healthDelta: best.weakestEffectiveHp > 0 ? (alternative.weakestEffectiveHp - best.weakestEffectiveHp) / best.weakestEffectiveHp : 0,
        gainedUtility: Object.keys(alternative.utilityLabels).filter((label) => !best.utilityLabels[label]),
        lostUtility: Object.keys(best.utilityLabels).filter((label) => !alternative.utilityLabels[label]),
      };
    });
    return { ...best, memberReasons, alternatives };
  }, [preliminaryRecommendation, ownedEquipment, equipmentPreview, accountBuild.accountMultipliers, combatContext, goal]);

  const recommendation = rankedRecommendations;
  const gearRecommendation = recommendation ? { assignments: recommendation.assignments } : null;
  // Recommendation and Overview use the identical scoring calculation and
  // the exact gear-assigned builds; no second optimizer rating is displayed.
  const recommendedSynergy = recommendation?.synergy ?? null;

  // Improvement previews compare actual stats, not percentages relative to a
  // level-one baseline. Only assigned team members are shown by default; the
  // player can opt into the rest of their owned monster inventory.
  const improvementTargets = useMemo(() => {
    const selectedCopies = new Set(recommendation?.members.map((member) => member.build.inventoryCopyId ?? member.monster.id) ?? []);
    // Scale dissimilar stats against team totals so an HP point and a DPS
    // point do not receive the same arbitrary weight. The numerator is the
    // absolute improvement, never the percent growth of a tiny starter stat.
    const referenceDps = Math.max(1, recommendation?.totalDps ?? 0);
    const referenceHealth = Math.max(1, recommendation?.totalEffectiveHealth ?? 0);
    const referenceDamage = Math.max(1, recommendation?.members.reduce((sum, member) => sum + member.damage, 0) ?? 0);
    const candidates = Object.entries(inventoryBuilds).flatMap(([copyId, rawSaved]) => {
      const saved = withOwnedGear(rawSaved, inventoryOwner(copyId), ownedEquipment);
      const monster = monsterById.get(copyMonsterId(copyId));
      if (!monster || hiddenMonsterIds.includes(monster.id) ||
        (improvementScope === "team" && selectedCopies.size > 0 && !selectedCopies.has(copyId))) return [];
      const evaluate = (build: Build) => {
        const contextual = buildForGoal({ ...build, accountMultipliers: accountBuild.accountMultipliers, teammateMonsterIds: [null, null], evolutionPercent: monster.isEvolved ? build.evolutionPercent : 100 }, combatContext);
        const statData = getMonsterStatData(monster.id);
        const stats = statData ? calculateStats(statData, contextual, monster.passives ?? []) : null;
        return { dps: monsterDps(monster, contextual), damage: stats?.damage ?? 0, health: stats?.health ?? 0,
          effectiveHealth: effectiveTeamHealth(monster, contextual, stats?.health ?? 0) };
      };
      const before = evaluate(saved);
      type Upgrade = { label: string; category: string; build: Build; hypothetical?: boolean };
      const upgrades: Upgrade[] = [];
      if (saved.level < CURRENT_MAX_LEVEL) upgrades.push({ category: "Level", label: `Level ${saved.level} → ${CURRENT_MAX_LEVEL}`, build: { ...saved, level: CURRENT_MAX_LEVEL } });
      if (ranks.indexOf(saved.rank ?? "E") < ranks.indexOf("SS")) upgrades.push({ category: "Rank", label: `Rank ${saved.rank ?? "E"} → SS`, build: { ...saved, rank: "SS" } });
      if (saved.enhancement < 10) upgrades.push({ category: "Enhancement", label: `Enhancement +${saved.enhancement} → +10`, build: { ...saved, enhancement: 10 } });
      for (const family of teamMutationFamilies) {
        if (saved.mutations.includes(family.xId)) continue;
        const mutations = saved.mutations.filter((id) => id !== family.id && id !== family.xId);
        upgrades.push({ category: "Mutation", label: `${saved.mutations.includes(family.id) ? "Upgrade" : "Add"} ${family.label} X`, build: { ...saved, mutations: [...mutations, family.xId] } });
      }
      for (const copy of ownedEquipment) {
        const gear = EQUIPMENT.find((item) => item.id === copy.equipmentId);
        if (!gear) continue;
        const type = gear.type;
        const current = ownedEquipment.find((item) => item.equippedTo === inventoryOwner(copyId)
          && EQUIPMENT.find((entry) => entry.id === item.equipmentId)?.type === type);
        if (current?.id === copy.id) continue;
        upgrades.push({ category: type === "weapon" ? "Weapon" : "Armor",
          label: `${copy.equippedTo && copy.equippedTo !== inventoryOwner(copyId) ? "Reassign" : "Equip owned"} ${gear.name} · ${copy.id.slice(-6)}`,
          build: equipmentPreview.withCopy(saved, copy) });
      }
      for (const gear of EQUIPMENT) {
        if (ownedEquipment.some((copy) => copy.equipmentId === gear.id) ||
          (gear.type === "weapon" ? saved.weaponId : saved.armorId) === gear.id) continue;
        upgrades.push({ category: gear.type === "weapon" ? "Weapon to acquire" : "Armor to acquire",
          label: `Obtain ${gear.name}`, hypothetical: true,
          build: gear.type === "weapon" ? { ...saved, weaponId: gear.id, weaponAttributeIds: [] }
            : { ...saved, armorId: gear.id, armorAttributeIds: [] } });
      }
      const options = upgrades.flatMap(({ label, category, build, hypothetical }) => {
        const after = evaluate(build);
        const dpsGain = after.dps - before.dps;
        const damageGain = after.damage - before.damage;
        const healthGain = after.health - before.health;
        const dpsScore = dpsGain / referenceDps;
        const damageScore = damageGain / referenceDamage;
        const healthScore = (after.effectiveHealth - before.effectiveHealth) / referenceHealth;
        const weightedGain = goal === "damage" ? dpsScore * .9 + damageScore * .1
          : goal === "survivability" ? healthScore * .8 + dpsScore * .2
          : goal === "support" ? dpsScore * .45 + healthScore * .55
          : dpsScore * .6 + healthScore * .4;
        return weightedGain > 0.0000001
          ? [{ label, category, hypothetical, before, after, dpsGain, damageGain, healthGain, weightedGain }] : [];
      }).sort((a, b) => b.weightedGain - a.weightedGain);
      if (!options.length) return [];
      // Keep the strongest option for each type; don't show several mutually
      // exclusive weapons as though their gains can all be combined.
      const perCategory = options.filter((option, index) => options.findIndex((item) => item.category === option.category) === index);
      return [{ copyId, monster, saved, best: perCategory[0], options: perCategory, selected: selectedCopies.has(copyId) }];
    });
    return candidates.sort((a, b) => (Number(b.selected) - Number(a.selected)) || b.best.weightedGain - a.best.weightedGain || b.best.after.dps - a.best.after.dps).slice(0, 6);
  }, [inventoryBuilds, accountBuild.accountMultipliers, combatContext, goal, hiddenMonsterIds, recommendation, ownedEquipment, equipmentPreview, improvementScope]);

  const upgradeStatRows = (before: { dps: number; damage: number; health: number }, after: { dps: number; damage: number; health: number }) => (
    <div className={styles.improvementStatRows}>
      {([ ["Skill DPS", "dps"], ["Damage", "damage"], ["Health", "health"] ] as const).map(([label, stat]) => (
        <div className={styles.improvementStatRow} key={stat}>
          <span>{label}</span>
          <strong>{formatStatNumber(before[stat])} <span aria-label="to">→</span> {formatStatNumber(after[stat])}</strong>
          <small>{after[stat] >= before[stat] ? "+" : "−"}{formatStatNumber(Math.abs(after[stat] - before[stat]))}</small>
        </div>
      ))}
    </div>
  );

  const assignOwnedGear = (owner: string, type: "weapon" | "armor", copyId: string | null, onBuildChange: (changes: Partial<Build>) => void) => {
    if (blockedStorageKeys.current.has(OWNED_EQUIPMENT_KEY)) {
      setInventoryMessage("Equipment storage could not be read; assignments are locked to protect your saved copies.");
      return;
    }
    const candidate = ownedEquipment.find((copy) => copy.id === copyId);
    const gear = candidate && EQUIPMENT.find((item) => item.id === candidate.equipmentId);
    if (copyId && (!candidate || !gear || gear.type !== type || (candidate.equippedTo && candidate.equippedTo !== owner))) {
      setInventoryMessage("That equipment copy is already equipped by another monster.");
      return;
    }
    const cleared = ownedEquipment.map((copy) => {
      const item = EQUIPMENT.find((entry) => entry.id === copy.equipmentId);
      if (item?.type === type && copy.equippedTo === owner) return { ...copy, equippedTo: undefined };
      return copy;
    });
    setOwnedEquipment(cleared.map((copy) => copy.id === copyId ? { ...copy, equippedTo: owner } : copy));
    onBuildChange(type === "weapon"
      ? { weaponId: gear?.id ?? null, weaponAttributeIds: candidate ? [...candidate.attributeIds] : [] }
      : { armorId: gear?.id ?? null, armorAttributeIds: candidate ? [...candidate.attributeIds] : [] });
  };

  const removeOwnedEquipmentCopy = (copy: OwnedEquipmentCopy) => {
    const gear = EQUIPMENT.find((item) => item.id === copy.equipmentId);
    if (gear && copy.equippedTo) {
      const changes: Partial<Build> = gear.type === "weapon"
        ? { weaponId: null, weaponAttributeIds: [] }
        : { armorId: null, armorAttributeIds: [] };
      setTeam((current) => current.map((build, index) => teamOwner(build, index) === copy.equippedTo && build.monsterId
        ? sanitizeBuild({ ...build, ...changes }, build.monsterId) : build));
      if (copy.equippedTo.startsWith("inventory:")) {
        const copyId = copy.equippedTo.slice("inventory:".length);
        setInventoryBuilds((current) => {
          const build = current[copyId];
          return build?.monsterId ? { ...current, [copyId]: { ...sanitizeBuild({ ...build, ...changes }, build.monsterId), inventoryCopyId: copyId } } : current;
        });
      }
    }
    setOwnedEquipment((current) => current.filter((item) => item.id !== copy.id));
    if (editingEquipmentId === copy.id) setEditingEquipmentId(null);
  };

  const releaseTemporarySlot = (index: number) => {
    const old = team[index];
    if (!old?.monsterId || old.inventoryCopyId) return;
    setOwnedEquipment((copies) => copies.map((copy) => copy.equippedTo === `team:${index}`
      ? { ...copy, equippedTo: undefined } : copy));
  };

  const releaseReplacedTemporarySlots = (nextTeam: Build[]) => {
    setOwnedEquipment((copies) => copies.map((copy) => {
      const slot = /^team:([0-2])$/.exec(copy.equippedTo ?? "");
      if (!slot) return copy;
      const index = Number(slot[1]);
      const old = team[index];
      const next = nextTeam[index];
      return old?.monsterId && !old.inventoryCopyId && next?.monsterId === old.monsterId && !next.inventoryCopyId
        ? copy : { ...copy, equippedTo: undefined };
    }));
  };

  const updateTeamBuild = (index: number, changes: Partial<Build>) => {
    if (changes.monsterId === null) releaseTemporarySlot(index);
    setTeam((current) =>
      current.map((build, buildIndex) => (buildIndex === index ? (changes.monsterId === null ? makeBuild(null) : build.monsterId
        ? withTeamDungeonLevel(sanitizeBuild({ ...build, ...changes }, build.monsterId), combatContext === "dungeon") : build) : build)),
    );
  };

  // Each click cycles Off → Normal → X → Off. Keep the saved inventory build
  // in sync with the team card so returning to it never restores an older value.
  const setTeamMutation = (
    index: number,
    family: (typeof teamMutationFamilies)[number],
  ) => {
    const build = team[index];
    if (!build?.monsterId) return;
    const withoutFamily = build.mutations.filter((id) => id !== family.id && id !== family.xId);
    const nextId = build.mutations.includes(family.xId)
      ? null
      : build.mutations.includes(family.id) ? family.xId : family.id;
    const mutations = nextId ? [...withoutFamily, nextId] : withoutFamily;
    if (build.inventoryCopyId) updateInventoryBuild(build.inventoryCopyId, { mutations });
    else updateTeamBuild(index, { mutations });
  };

  const toggleOwned = (monster: Monster) => {
    setInventoryBuilds((current) => {
      if (current[monster.id]) {
        const next = { ...current };
        delete next[monster.id];
        return next;
      }
      return { ...current, [monster.id]: { ...makeBuild(monster.id), inventoryCopyId: monster.id } };
    });
  };

  const updateInventoryBuild = (copyId: string, changes: Partial<Build>) => {
    const monsterId = copyMonsterId(copyId);
    setInventoryBuilds((current) => {
      const existing = current[copyId] ?? makeBuild(monsterId);
      return { ...current, [copyId]: { ...sanitizeBuild({ ...existing, ...changes }, monsterId), inventoryCopyId: copyId } };
    });
    // An inventory copy already on the team is the SAME monster, not a separate
    // build. Changes (including traits) must update its visible team card too.
    setTeam((current) => current.map((item) => {
      if (!item.monsterId || !(item.inventoryCopyId === copyId || (!item.inventoryCopyId && item.monsterId === copyId))) return item;
      const revised = combatContext === "dungeon" && changes.level !== undefined
        ? { ...item, ...changes, level: DUNGEON_TEAM_LEVEL, preDungeonLevel: changes.level }
        : { ...item, ...changes };
      return { ...withTeamDungeonLevel(sanitizeBuild(revised, item.monsterId), combatContext === "dungeon"), inventoryCopyId: copyId };
    }));
  };

  const addOwnedCopy = (monsterId: string) => {
    setInventoryBuilds((current) => {
      const copyId = current[monsterId] ? nextCopyKey(current, monsterId) : monsterId;
      return { ...current, [copyId]: { ...makeBuild(monsterId), inventoryCopyId: copyId } };
    });
    setInventoryMessage("Added a separate copy with its own build.");
  };

  const removeOwnedCopy = (copyId: string) => {
    setInventoryBuilds((current) => {
      const next = { ...current };
      delete next[copyId];
      return next;
    });
    setInventoryMessage("Removed that copy from inventory; existing team builds were preserved.");
  };

  const importFromIndexTracker = () => {
    try {
      const raw = window.localStorage.getItem("cam-lab-index-tracker-v1");
      if (!raw) {
        setInventoryMessage("No Index Tracker data found yet.");
        return;
      }
      const result = mergeIndexProgress(inventoryBuilds, JSON.parse(raw));
      setInventoryBuilds(result.inventory);
      setInventoryFilter("owned");
      setInventoryMessage(`Imported ${result.imported} new monsters. Existing builds were preserved. Review imported ranks and mutations: Index progress may span multiple past monsters.`);
    } catch {
      setInventoryMessage("Could not read Index Tracker data.");
    }
  };

  const exportInventory = () => {
    const payload = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), inventory: inventoryBuilds, equipment: ownedEquipment }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cam-lab-team-inventory.json";
    link.click();
    URL.revokeObjectURL(url);
    setInventoryMessage("Inventory exported.");
  };

  const importInventory = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !("inventory" in parsed)) throw new Error("Invalid inventory file");
      const source = (parsed as { inventory: unknown }).inventory;
      if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Invalid inventory data");
      const next: InventoryBuilds = {};
      for (const [copyId, candidate] of Object.entries(source)) {
        const monsterId = copyMonsterId(copyId);
        if (!monsterById.has(monsterId) || !candidate || typeof candidate !== "object") continue;
        next[copyId] = { ...sanitizeBuild(candidate as Build, monsterId), inventoryCopyId: copyId };
      }
      const includesEquipment = "equipment" in parsed;
      const importedEquipment = includesEquipment ? validOwnedEquipment((parsed as { equipment: unknown }).equipment) : [];
      if (!Object.keys(next).length && !importedEquipment.length) throw new Error("No valid inventory entries found");
      setInventoryBuilds((current) => ({ ...current, ...next }));
      if (includesEquipment) setOwnedEquipment((current) => {
        const currentIds = new Set(current.map((item) => item.id));
        return [...current, ...importedEquipment.filter((item) => !currentIds.has(item.id))];
      });
      setInventoryFilter("owned");
      setInventoryMessage(`Imported ${Object.keys(next).length} monster builds and ${importedEquipment.length} equipment copies.`);
    } catch {
      setInventoryMessage("That file is not a valid Cam Lab inventory export.");
    } finally {
      if (inventoryImportRef.current) inventoryImportRef.current.value = "";
    }
  };

  const addMonster = (monster: Monster, copyId = monster.id) => {
    if (team.some((build) => build.inventoryCopyId === copyId && copyId in inventoryBuilds)) {
      setInventoryMessage("That copy is already in your team. Add another owned copy to use this monster twice.");
      return;
    }
    const emptyIndex = team.findIndex((build) => !build.monsterId);
    if (emptyIndex < 0) {
      setInventoryMessage("Your team is full. Remove a monster before loading another one.");
      return;
    }
    const savedBuild = inventoryBuilds[copyId] ?? makeBuild(monster.id);
    setTeam((current) =>
      current.map((build, index) => (index === emptyIndex ? { ...withTeamDungeonLevel(sanitizeBuild(savedBuild, monster.id), combatContext === "dungeon"), inventoryCopyId: copyId } : build)),
    );
    setInventoryBuilds((current) =>
      current[copyId] ? current : { ...current, [copyId]: { ...makeBuild(monster.id), inventoryCopyId: copyId } },
    );
  };

  // Replace a slot directly, including with a separate owned copy of the same monster.
  const openMonsterPicker = (index: number) => {
    setReplacementSearch("");
    setReplacingTeamSlot(index);
  };

  const replaceTeamMonster = (index: number, monster: Monster, copyId: string) => {
    if (team.some((build, slot) => slot !== index && build.inventoryCopyId === copyId)) {
      setInventoryMessage("That owned copy is already on your team. Select another copy.");
      return;
    }
    const saved = inventoryBuilds[copyId] ?? makeBuild(monster.id);
    releaseTemporarySlot(index);
    setTeam((current) => current.map((build, slot) => slot === index
      ? { ...withTeamDungeonLevel(sanitizeBuild(saved, monster.id), combatContext === "dungeon"), inventoryCopyId: copyId }
      : build));
    setInventoryBuilds((current) => current[copyId] ? current : {
      ...current, [copyId]: { ...makeBuild(monster.id), inventoryCopyId: copyId },
    });
    setReplacingTeamSlot(null);
    setReplacementSearch("");
  };

  const saveTeamBuildToInventory = (index: number) => {
    const build = team[index];
    if (!build?.monsterId) return;
    const copyId = build.inventoryCopyId ?? build.monsterId;
    const previousOwner = `team:${index}`;
    const permanentOwner = inventoryOwner(copyId);
    // Promoting a temporary build must move its actual owned copies with it.
    // Merely saving weaponId/armorId would leave the gear on team:0, and loading
    // the permanent inventory copy later would make both items disappear.
    if (!build.inventoryCopyId) {
      setOwnedEquipment((current) => {
        const moving = current.filter((copy) => copy.equippedTo === previousOwner);
        const types = new Set(moving.map((copy) => EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type));
        return current.map((copy) => {
          if (copy.equippedTo === previousOwner) return { ...copy, equippedTo: permanentOwner };
          if (copy.equippedTo === permanentOwner && types.has(EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type)) {
            return { ...copy, equippedTo: undefined };
          }
          return copy;
        });
      });
      setTeam((current) => current.map((item, slot) => slot === index ? { ...item, inventoryCopyId: copyId } : item));
    }
    setInventoryBuilds((current) => ({ ...current, [copyId]: {
      // Dungeon's 60 is a temporary encounter level; retain the original
      // inventory level when the monster editor commits its other changes.
      ...sanitizeBuild(combatContext === "dungeon" ? { ...build, level: build.preDungeonLevel ?? build.level, preDungeonLevel: null } : build, build.monsterId!), inventoryCopyId: copyId,
    } }));
  };

  const closeTeamEditor = () => {
    if (editingTeamSlot === null) return;
    saveTeamBuildToInventory(editingTeamSlot);
    setEditingTeamSlot(null);
  };

  useEffect(() => {
    if (editingTeamSlot === null) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        saveTeamBuildToInventory(editingTeamSlot);
        setEditingTeamSlot(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  // saveTeamBuildToInventory reads the current team state on close.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTeamSlot, team]);

  const useRecommendation = (choice: Pick<NonNullable<typeof recommendation>, "members" | "assignments"> | null = recommendation) => {
    if (!choice) return;
    const selected = choice.assignments;
    const newOwners = new Map(selected.map(({ copy, memberIndex }) => [copy.id,
      teamOwner(choice.members[memberIndex].build, memberIndex)]));
    const selectedOwners = new Set(choice.members.map((member, index) => teamOwner(member.build, index)));
    const affectedOwners = new Set<string>([...selectedOwners, "team:0", "team:1", "team:2"]);
    for (const { copy } of selected) if (copy.equippedTo) affectedOwners.add(copy.equippedTo);
    // All changes are applied in one transaction: remove previous ownership,
    // then assign distinct physical copies to the recommended builds.
    setOwnedEquipment((previous) => previous.map((copy) => ({ ...copy,
      equippedTo: newOwners.get(copy.id) ?? (affectedOwners.has(copy.equippedTo ?? "") ? undefined : copy.equippedTo),
    })));
    setInventoryBuilds((previous) => {
      const next = { ...previous };
      for (const copy of ownedEquipment) {
        if (!copy.equippedTo?.startsWith("inventory:")) continue;
        if (!newOwners.has(copy.id) && !affectedOwners.has(copy.equippedTo)) continue;
        if (newOwners.get(copy.id) === copy.equippedTo) continue;
        const copyId = copy.equippedTo.slice("inventory:".length);
        const old = next[copyId];
        const type = EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type;
        if (!old || !type) continue;
        next[copyId] = type === "weapon"
          ? { ...old, weaponId: null, weaponAttributeIds: [] }
          : { ...old, armorId: null, armorAttributeIds: [] };
      }
      choice.members.forEach((member, index) => {
        const copyId = member.build.inventoryCopyId;
        if (!copyId || !next[copyId]) return;
        let updated: Build = { ...member.build };
        for (const { copy, memberIndex } of selected) {
          if (memberIndex === index) updated = equipmentPreview.withCopy(updated, copy);
        }
        next[copyId] = { ...sanitizeBuild(updated, member.monster.id), inventoryCopyId: copyId };
      });
      return next;
    });
    setTeam(teamForCombatContext(Array.from({ length: 3 }, (_, index) => {
      const member = choice.members[index];
      if (!member) return makeBuild(null);
      let build = { ...member.build };
      for (const type of ["weapon", "armor"] as const) {
        const choice = selected.find(({ memberIndex, copy }) => memberIndex === index &&
          EQUIPMENT.find((gear) => gear.id === copy.equipmentId)?.type === type);
        if (choice) build = equipmentPreview.withCopy(build, choice.copy);
      }
      return sanitizeBuild(build, member.monster.id);
    }), combatContext));
  };

  const saveTeamPreset = () => {
    setSavedTeams((current) => ({
      ...current,
      [selectedTeamSlot]: {
        builds: team.map((build) => (build.monsterId ? sanitizeBuild(build, build.monsterId) : makeBuild(null))),
        goal,
        combatContext,
        name: teamSaveName.trim() || `Team ${selectedTeamSlot.replace("slot-", "")}`,
        updatedAt: Date.now(),
      },
    }));
    setTeamPresetMessage(`Saved ${selectedTeamSlot.replace("slot-", "Team ")}.`);
    setTeamLibraryOpen(false);
  };

  const loadTeamPreset = () => {
    const saved = savedTeams[selectedTeamSlot];
    if (!saved) {
      setTeamPresetMessage("That team slot is empty.");
      return;
    }
    const nextTeam = saved.builds.map((build) => (build.monsterId ? sanitizeBuild(build, build.monsterId) : makeBuild(null)));
    releaseReplacedTemporarySlots(nextTeam);
    setTeam(teamForCombatContext(nextTeam, saved.combatContext));
    setGoal(saved.goal);
    setCombatContext(saved.combatContext);
    setTeamPresetMessage(`Loaded ${selectedTeamSlot.replace("slot-", "Team ")}.`);
  };

  const clearTeamPreset = () => {
    setSavedTeams((current) => {
      const next = { ...current };
      delete next[selectedTeamSlot];
      return next;
    });
    setTeamPresetMessage(`Cleared ${selectedTeamSlot.replace("slot-", "Team ")}.`);
  };

  const changeCombatContext = (nextContext: TeamCombatContext) => {
    // Unlike the inventory, team levels are encounter-specific. Switching out
    // of Dungeon restores each monster's own level, including after a reload.
    setTeam((current) => teamForCombatContext(current, nextContext));
    setCombatContext(nextContext);
  };

  return (
    <main className={`${styles.root} text-[#f6f8fc]`}>
      {replacingTeamSlot !== null ? (
        <div className={styles.monsterPickerOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setReplacingTeamSlot(null); }}>
          <section role="dialog" aria-modal="true" aria-label={`Select monster for slot ${replacingTeamSlot + 1}`} className={styles.monsterPicker}>
            <div className={styles.monsterPickerHeader}>
              <div><strong>Choose Monster · Slot {replacingTeamSlot + 1}</strong><p>Choose an owned copy or add a new monster to your inventory.</p></div>
              <button type="button" onClick={() => setReplacingTeamSlot(null)} aria-label="Close monster selection">×</button>
            </div>
            <input autoFocus className={styles.search} type="search" placeholder="Search all monsters…" aria-label="Search selectable monsters" value={replacementSearch} onChange={(event) => setReplacementSearch(event.target.value)} />
            <div className={styles.pickerPreferences}>
              <span>{hiddenMonsterIds.length} hidden · Hidden monsters stay in your inventory and any existing teams.</span>
              <button type="button" className={styles.smallButton} onClick={() => setShowHiddenMonsters((current) => !current)}>
                {showHiddenMonsters ? "Hide hidden monsters" : "Show hidden monsters"}
              </button>
            </div>
            <div className={styles.monsterPickerList}>
              {availableMonsters.filter((monster) => (showHiddenMonsters || !hiddenMonsterIds.includes(monster.id)) && [monster.name, monster.element, monster.rarity].some((value) => value.toLowerCase().includes(replacementSearch.trim().toLowerCase()))).map((monster) => {
                const copies = Object.keys(inventoryBuilds).filter((id) => copyMonsterId(id) === monster.id).sort();
                const options = copies.length ? copies : [monster.id];
                return <div key={monster.id} className={styles.monsterPickerRow}>
                  <img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt="" />
                  <div className={styles.monsterPickerName}><strong>{monster.name}</strong><span>{monster.element} · {monster.rarity}</span></div>
                  <div className={styles.monsterPickerCopies}>{options.map((copyId, copyIndex) => {
                    const assigned = team.some((build, slot) => slot !== replacingTeamSlot && build.inventoryCopyId === copyId);
                    const choiceLabel = copies.length > 1 ? `Build ${copyIndex + 1}` : "Select";
                    return <button key={copyId} type="button" disabled={assigned} title={assigned ? "This monster is already in another team slot" : undefined} onClick={() => replaceTeamMonster(replacingTeamSlot, monster, copyId)}>{copies.length ? (assigned ? `${choiceLabel} · In team` : choiceLabel) : "+ Add & select"}</button>;
                  })}<button type="button" className={styles.hideMonsterButton} onClick={() => toggleHiddenMonster(monster.id)} aria-label={`${hiddenMonsterIds.includes(monster.id) ? "Unhide" : "Hide"} ${monster.name}`} title="Hide or unhide this monster from the picker and recommendations">{hiddenMonsterIds.includes(monster.id) ? "Unhide" : "Hide"}</button></div>
                </div>;
              })}
              {!availableMonsters.some((monster) => (showHiddenMonsters || !hiddenMonsterIds.includes(monster.id)) && [monster.name, monster.element, monster.rarity].some((value) => value.toLowerCase().includes(replacementSearch.trim().toLowerCase()))) ? <p className={styles.pickerEmpty}>No matching monsters. Try another search or show hidden monsters.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
      {editingTeamSlot !== null ? <button type="button" className={styles.teamEditorBackdrop} onClick={closeTeamEditor} aria-label="Save build and close editor" tabIndex={-1} /> : null}
      <div className="mx-auto w-full max-w-[2000px] space-y-3 px-3 py-3 sm:px-4 xl:px-5">
        {storageError ? <p role="alert" className={styles.inventoryMessage}>{storageError}</p> : null}
        <header className={styles.banner}>
          <div className={styles.bannerIcon}>
            <img src={assetPath("/team-builder.png")} alt="" />
          </div>
          <div>
            <h1>Team Composition</h1>
            <p>Build your team, manage your monsters, and find the best combinations.</p>
          </div>
          <div className={styles.heroMonsters} aria-hidden="true">
            <img src={assetPath("/monster-artwork/dummee.png")} alt="" />
            <img src={assetPath("/monster-artwork/leafet.png")} alt="" />
            <img src={assetPath("/monster-artwork/wattoad.png")} alt="" />
          </div>
          <div className={styles.bannerAside}>
            Create powerful teams for dungeons, bosses, PvP, and more.<br />
            Use your inventory or the full database, then compare the results with your account multipliers.
          </div>
        </header>

        <section className={styles.panel}>
          <AccountMultipliers build={accountBuild} onBuildChangeAction={setAccountBuild} />
        </section>

        <div className={`${styles.layout} ${showRecommendations ? "" : styles.layoutFocus}`}>
          <section className={styles.panel} aria-label="Monster inventory">
            <div className={`${styles.panelHeader} ${styles.inventoryPanelHeader}`}>
              <div className={styles.inventoryHeaderTitle}>
                <p className={styles.kicker}>Collection</p>
                <h2>My Inventory</h2>
              </div>
              <span className={styles.inventoryOwnedCount}>{ownedIds.length} owned</span>
              <div className={styles.inventoryPortability}>
                <button type="button" onClick={() => inventoryImportRef.current?.click()}>Import</button>
                <button type="button" onClick={exportInventory}>Export</button>
                <input ref={inventoryImportRef} type="file" accept="application/json,.json" onChange={(event) => void importInventory(event.target.files?.[0])} />
              </div>
            </div>
            <div className={styles.inventoryTabs} role="tablist" aria-label="Inventory categories">
              {([ ["monsters", "Monsters", ownedIds.length], ["equipment", "Equipment", ownedEquipment.length], ["items", "Items", 0] ] as const).map(([id, label, count]) => (
                <button key={id} type="button" role="tab" aria-selected={inventoryTab === id} className={`${styles.inventoryTab} ${inventoryTab === id ? styles.inventoryTabActive : ""}`} onClick={() => setInventoryTab(id)}>{label} <span>({count})</span></button>
              ))}
            </div>
            {inventoryTab === "monsters" ? <div className={styles.inventoryBody}>
              <div className={styles.inventorySearchRow}>
                <label className={styles.inventorySearchBox}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    type="search"
                    placeholder="Search monsters"
                    aria-label="Search inventory monsters"
                  />
                </label>
                <button type="button" className={`${styles.inventoryFilterTrigger} ${inventoryFilterPanel === "sort" ? styles.inventoryFilterTriggerActive : ""}`} aria-label="Sort inventory monsters" aria-expanded={inventoryFilterPanel === "sort"} aria-controls="inventory-sort-panel" title="Sort inventory" onClick={() => setInventoryFilterPanel((current) => current === "sort" ? null : "sort")}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                </button>
                <button type="button" className={`${styles.inventoryFilterTrigger} ${inventoryFilterPanel === "browse" || activeInventoryFilters ? styles.inventoryFilterTriggerActive : ""}`} aria-label="Filter inventory monsters" aria-expanded={inventoryFilterPanel === "browse"} aria-controls="inventory-browse-panel" title="Filter inventory" onClick={() => setInventoryFilterPanel((current) => current === "browse" ? null : "browse")}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6.5 7.2V18l-3 1.5v-7.3L4 5Z" /></svg>
                  {activeInventoryFilters > 0 ? <span className={styles.inventoryFilterBadge}>{activeInventoryFilters}</span> : null}
                </button>
              </div>
              {inventoryFilterPanel === "sort" ? <div id="inventory-sort-panel" className={styles.inventoryFilterPanel}>
                <div className={styles.inventoryFilterPanelHeading}><strong>Sort by</strong><button type="button" onClick={() => setInventoryFilterPanel(null)} aria-label="Close sort options">×</button></div>
                <div className={styles.inventorySortOptions}>
                  {([ ["name", "Name"], ["rank", "Rank"], ["level", "Level"], ["dps", "Skill DPS"], ["health", "Health"] ] as const).map(([value, label]) => (
                    <button key={value} type="button" className={`${styles.filterChip} ${inventorySort === value ? styles.filterChipActive : ""}`} aria-pressed={inventorySort === value} onClick={() => { setInventorySort(value); setInventoryFilterPanel(null); }}>{label}</button>
                  ))}
                </div>
              </div> : null}
              {inventoryFilterPanel === "browse" ? <div id="inventory-browse-panel" className={styles.inventoryFilterPanel}>
                <div className={styles.inventoryFilterPanelHeading}><strong>Browse filters</strong><button type="button" onClick={clearInventoryFilters} disabled={!activeInventoryFilters}>Clear all</button></div>
                <span className={styles.inventoryFilterLabel}>Collection</span>
                <div className={styles.inventoryFilterChoices}>
                  {([ ["all", "All"], ["owned", "Owned"], ["unowned", "Missing"], ["team", "In team"] ] as const).map(([value, label]) => (
                    <button key={value} type="button" className={`${styles.filterChip} ${inventoryFilter === value ? styles.filterChipActive : ""}`} aria-pressed={inventoryFilter === value} onClick={() => setInventoryFilter(value)}>{label}</button>
                  ))}
                </div>
                <button type="button" className={`${styles.inventoryFavoriteFilter} ${favoritesOnly ? styles.filterChipActive : ""}`} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}>{favoritesOnly ? "★" : "☆"} Favorites only</button>
                <div className={styles.inventoryFilterSelects}>
                  <label>Element<select value={inventoryElement} onChange={(event) => setInventoryElement(event.target.value)}><option value="all">All elements</option>{INVENTORY_ELEMENTS.map((element) => <option key={element} value={element}>{element}</option>)}</select></label>
                  <label>Rarity<select value={inventoryRarity} onChange={(event) => setInventoryRarity(event.target.value)}><option value="all">All rarities</option>{INVENTORY_RARITIES.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}</select></label>
                </div>
              </div> : null}
              <p className={styles.inventoryResultCount}>{filteredInventory.length} of {availableMonsters.length} monsters{activeInventoryFilters ? ` · ${activeInventoryFilters} active ${activeInventoryFilters === 1 ? "filter" : "filters"}` : ""}</p>
              <details className={styles.inventoryExtras}>
                <summary>Inventory tools{hiddenMonsterIds.length ? ` · ${hiddenMonsterIds.length} hidden` : ""}</summary>
                <div className={styles.pickerPreferences}>
                  <span>Hidden monsters are excluded from recommendations.</span>
                  <button type="button" className={styles.smallButton} onClick={() => setShowHiddenMonsters((current) => !current)}>{showHiddenMonsters ? "Hide hidden" : "Show hidden"}</button>
                </div>
                <button type="button" className={styles.indexImportButton} onClick={importFromIndexTracker}>
                  Import Missing Monsters from Index Tracker
                </button>
              </details>
              {inventoryMessage ? <p role="status" className={styles.inventoryMessage}>{inventoryMessage}</p> : null}
              <div className={styles.inventoryList}>
                {filteredInventory.map((monster) => {
                  const copies = copiesFor(monster.id);
                  const savedBuild = inventoryBuilds[monster.id] ?? (copies[0] ? inventoryBuilds[copies[0]] : undefined);
                  const owned = copies.length > 0;
                  const inTeam = teamIds.includes(monster.id);
                  return (
                    <article key={monster.id} className={`${styles.inventoryRow} ${owned ? styles.inventoryRowOwned : ""}`}>
                      <TeamMonsterPortrait monster={monster} className={styles.inventoryPortrait} />
                      <div className="min-w-0">
                        <div className={styles.inventoryName}>{monster.name}</div>
                        <div className={styles.inventoryMeta}>{monster.element} · {monster.rarity}{copies.length > 1 ? ` · ${copies.length} builds` : ""}</div>
                      </div>
                      <div className={styles.rowActions}>
                        {savedBuild ? <div className={styles.inventoryBadges}><span>Lv{savedBuild.level} · <b><TeamRankText rank={savedBuild.rank ?? "E"} /></b></span></div> : null}
                        <button type="button" className={`${styles.favoriteButton} ${favoriteMonsterIds.includes(monster.id) ? styles.favoriteButtonActive : ""}`} onClick={() => toggleInventoryFavorite(monster.id)} aria-pressed={favoriteMonsterIds.includes(monster.id)} aria-label={`${favoriteMonsterIds.includes(monster.id) ? "Remove" : "Add"} ${monster.name} ${favoriteMonsterIds.includes(monster.id) ? "from" : "to"} favorites`} title="Toggle favorite">{favoriteMonsterIds.includes(monster.id) ? "★" : "☆"}</button>
                        {savedBuild && copies[0] ? <button type="button" className={styles.inventoryActionButton} onClick={() => setEditingInventoryId(copies[0])} title={`Edit ${monster.name}`} aria-label={`Edit ${monster.name}`}>✎</button> : null}
                        <button
                          type="button"
                          className={`${styles.smallButton} ${styles.inventoryActionButton} ${owned ? styles.ownedButton : ""}`}
                          onClick={() => owned ? addOwnedCopy(monster.id) : toggleOwned(monster)}
                          title={owned ? "Add another independently editable monster build" : "Add to inventory"}
                        >
                          {owned ? "+" : "+ Own"}
                        </button>
                        {!owned ? <button type="button" className={styles.smallButton} onClick={() => addMonster(monster)}>+ Team</button> : null}
                        <button type="button" className={styles.smallButton} onClick={() => toggleHiddenMonster(monster.id)} aria-label={`${hiddenMonsterIds.includes(monster.id) ? "Unhide" : "Hide"} ${monster.name}`} title="Hide this species from browsing and recommendations">{hiddenMonsterIds.includes(monster.id) ? "Unhide" : "Hide"}</button>
                      </div>
                      {copies.length > 0 ? <details className={styles.copyList}>
                        <summary aria-label={`Saved build options for ${monster.name}`} title={`Edit, load or remove ${monster.name} saved builds`}>⋯</summary>
                        {copies.map((copyId, copyIndex) => {
                          const copy = inventoryBuilds[copyId];
                          const assigned = team.some((build) => build.inventoryCopyId === copyId);
                          return <div key={copyId} className={styles.copyRow}>
                            <span className={styles.copyLabel}>{copies.length > 1 ? `Build ${copyIndex + 1} · ` : ""}{compactBuildLabel(copy)}</span>
                            <button type="button" className={styles.smallButton} onClick={() => setEditingInventoryId(copyId)}>Edit</button>
                            <button type="button" className={styles.smallButton} disabled={assigned} onClick={() => addMonster(monster, copyId)}>{assigned ? "In team" : "Load"}</button>
                            <button type="button" className={styles.smallButton} aria-label={`Remove ${monster.name} saved build ${copyIndex + 1}`} title="Remove saved build" onClick={() => removeOwnedCopy(copyId)}>×</button>
                          </div>;
                        })}
                      </details> : null}
                    </article>
                  );
                })}
                {filteredInventory.length === 0 ? <p className={styles.pickerEmpty}>No monsters match. Try clearing filters or changing your search.</p> : null}
              </div>
            </div> : inventoryTab === "equipment" ? <div className={styles.inventoryBody} role="tabpanel">
              <div className={styles.equipmentAddControl} onKeyDown={(event) => {
                if (event.key === "Escape") setAddGearMenuOpen(false);
              }}>
                <div className={styles.equipmentAddRow}>
                  <div className={styles.equipmentAddPicker}>
                    <span className={styles.equipmentAddLabel}>Gear to add</span>
                    <button
                      type="button"
                      className={styles.equipmentAddTrigger}
                      aria-label="Choose gear to add"
                      aria-haspopup="listbox"
                      aria-expanded={addGearMenuOpen}
                      aria-controls="team-equipment-add-options"
                      onClick={() => setAddGearMenuOpen((open) => !open)}
                    >
                      {EQUIPMENT.filter((gear) => gear.id === equipmentToAdd).map((gear) => (
                        <span key={gear.id} className={styles.equipmentAddSelected}>
                          <img src={assetPath(`/gear/${gear.id}.png`)} alt="" style={{ borderColor: equipmentRarityColors[gear.rarity] }} />
                          <span><strong>{gear.name}</strong><small style={{ color: equipmentRarityColors[gear.rarity] }}>+{gear.percentage}% {gear.type === "weapon" ? "Damage" : "Health"}</small></span>
                        </span>
                      ))}
                      {!equipmentToAdd ? <span className={styles.equipmentAddPlaceholder}>Select gear to add…</span> : null}
                      <span className={styles.equipmentAddCaret} aria-hidden="true">{addGearMenuOpen ? "▲" : "▼"}</span>
                    </button>
                  </div>
                  <button type="button" className={styles.primaryButton} disabled={!equipmentToAdd} onClick={() => {
                    if (!EQUIPMENT.some((gear) => gear.id === equipmentToAdd)) return;
                    setOwnedEquipment((current) => [...current, { id: crypto.randomUUID(), equipmentId: equipmentToAdd, attributeIds: [] }]);
                    setInventoryMessage("Equipment added.");
                  }}>+ Add</button>
                </div>
                {addGearMenuOpen ? <div id="team-equipment-add-options" className={styles.equipmentAddMenu} role="listbox" aria-label="Gear to add">
                  <button type="button" role="option" aria-selected={!equipmentToAdd} className={styles.equipmentAddOption} onClick={() => { setEquipmentToAdd(""); setAddGearMenuOpen(false); }}>None</button>
                  {EQUIPMENT.map((gear) => <button
                    key={gear.id}
                    type="button"
                    role="option"
                    aria-selected={equipmentToAdd === gear.id}
                    className={`${styles.equipmentAddOption} ${equipmentToAdd === gear.id ? styles.equipmentAddOptionActive : ""}`}
                    onClick={() => { setEquipmentToAdd(gear.id); setAddGearMenuOpen(false); }}
                  >
                    <img src={assetPath(`/gear/${gear.id}.png`)} alt="" loading="lazy" style={{ borderColor: equipmentRarityColors[gear.rarity] }} />
                    <span><strong>{gear.name}</strong><small style={{ color: equipmentRarityColors[gear.rarity] }}>{gear.rarity} · +{gear.percentage}% {gear.type === "weapon" ? "Damage" : "Health"}</small></span>
                    {equipmentToAdd === gear.id ? <span className={styles.equipmentAddCheck} aria-hidden="true">✓</span> : null}
                  </button>)}
                </div> : null}
              </div>
              <input className={styles.search} value={equipmentSearch} onChange={(event) => setEquipmentSearch(event.target.value)} placeholder="Search owned equipment…" aria-label="Search owned equipment" />
              <div className={styles.inventoryQuickFilters}>
                {([ ["all", "All"], ["weapon", "Weapons"], ["armor", "Armor"] ] as const).map(([id, label]) => <button key={id} type="button" className={`${styles.filterChip} ${equipmentFilter === id ? styles.filterChipActive : ""}`} onClick={() => setEquipmentFilter(id)}>{label}</button>)}
              </div>
              {inventoryMessage ? <p role="status" className={styles.inventoryMessage}>{inventoryMessage}</p> : null}
              <div className={styles.inventoryList}>
                {EQUIPMENT.filter((gear) => (equipmentFilter === "all" || gear.type === equipmentFilter) && gear.name.toLowerCase().includes(equipmentSearch.trim().toLowerCase()) && ownedEquipment.some((copy) => copy.equipmentId === gear.id)).map((gear) => {
                  const copies = ownedEquipment.filter((copy) => copy.equipmentId === gear.id);
                  return <article key={gear.id} className={styles.equipmentInventoryGroup}>
                    <div className={styles.equipmentInventoryHeader}>
                      <img src={assetPath(`/gear/${gear.id}.png`)} alt="" className={styles.equipmentInventoryIcon} style={{ borderColor: equipmentRarityColors[gear.rarity] }} />
                      <div className={styles.equipmentInventoryName}><strong>{gear.name}</strong><small style={{ color: equipmentRarityColors[gear.rarity] }}>+{gear.percentage}% {gear.type === "weapon" ? "Damage" : "Health"} · {gear.rarity}</small></div>
                      <span className={styles.equipmentInventoryQuantity}>×{copies.length}</span>
                    </div>
                    {copies.map((copy, index) => <div key={copy.id} className={styles.equipmentCopyRow}>
                      <span>{copies.length > 1 ? `Item ${index + 1} · ` : ""}{copy.equippedTo ? `Equipped to ${copy.equippedTo.startsWith("inventory:") ? monsterById.get(copyMonsterId(copy.equippedTo.slice(10)))?.name ?? copy.equippedTo.slice(10) : `team slot ${Number(copy.equippedTo.slice(5)) + 1}`}` : "Unequipped"}{getAttributeSlotCount(gear.rarity) ? ` · ${copy.attributeIds.some(Boolean) ? copy.attributeIds.filter(Boolean).map((id) => getAttribute(id)?.name ?? id).join(", ") : "Attributes not selected"}` : ""}</span>
                      {getAttributeSlotCount(gear.rarity) > 0 ? <button type="button" className={styles.smallButton} aria-expanded={editingEquipmentId === copy.id} onClick={() => setEditingEquipmentId((id) => id === copy.id ? null : copy.id)}>{editingEquipmentId === copy.id ? "Close" : "Attributes"}</button> : null}
                      <button type="button" className={styles.smallButton} aria-label={`Remove ${gear.name}${copies.length > 1 ? ` item ${index + 1}` : ""}`} onClick={() => removeOwnedEquipmentCopy(copy)}>×</button>
                      {getAttributeSlotCount(gear.rarity) > 0 && editingEquipmentId === copy.id ? <div className={styles.equipmentCopyEditor}>
                        <div className={styles.equipmentAttributeHeading}><strong>{gear.type === "weapon" ? "Weapon" : "Armor"} Attributes</strong><small>Saved individually{copies.length > 1 ? ` · Item ${index + 1}` : ""}</small></div>
                        <div className={styles.equipmentAttributeGrid}>
                          {getFixedAttributeIds(gear.id).map((id) => <div key={`fixed-${id}`} className={styles.equipmentFixedAttribute} title={getAttribute(id)?.name ?? id}>
                            <img src={assetPath(`/attributes/${id}.png`)} alt={getAttribute(id)?.name ?? id} />
                            <span>FIXED</span>
                          </div>)}
                          {Array.from({ length: getAttributeSlotCount(gear.rarity) }, (_, slot) => <AttributeSelect
                            key={`${copy.id}-${slot}`}
                            label={`SLOT ${slot + 1}`}
                            options={getAttributesForGear(gear.type)}
                            value={copy.attributeIds[slot] || null}
                            usedIds={copy.attributeIds.filter(Boolean)}
                            onChangeAction={(value) => setOwnedEquipment((current) => current.map((item) => {
                              if (item.id !== copy.id) return item;
                              const next = Array.from({ length: getAttributeSlotCount(gear.rarity) }, (_, position) => item.attributeIds[position] ?? "");
                              next[slot] = value ?? "";
                              return { ...item, attributeIds: next };
                            }))}
                          />)}
                        </div>
                        <span className={styles.helper}>Fixed attributes are automatically included. Selectable slots use the Calculator’s attribute artwork and definitions.</span>
                      </div> : null}
                    </div>)}
                  </article>;
                })}
                {!ownedEquipment.some((copy) => { const gear = EQUIPMENT.find((item) => item.id === copy.equipmentId); return gear && (equipmentFilter === "all" || gear.type === equipmentFilter) && gear.name.toLowerCase().includes(equipmentSearch.trim().toLowerCase()); }) ? <p className={styles.helper}>No owned equipment matches. Select a weapon or armor above and choose Add.</p> : null}
              </div>
            </div> : <div className={styles.inventoryEmptyTab} role="tabpanel">
              <span className={styles.inventoryEmptyIcon}>◇</span>
              <strong>Items inventory</strong>
              <p>Item tracking will appear here in a future inventory update.</p>
            </div>}
          </section>

          <div className={styles.center}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.kicker}>Build</p>
                  <h2>Team Builder</h2>
                </div>
                <div className={styles.teamPresetControls}>
                  <span className={styles.teamCount}>{Object.keys(savedTeams).length}/20 teams</span>
                  <button type="button" className={styles.ghostButton} aria-expanded={showRecommendations} onClick={() => setShowRecommendations((visible) => !visible)}>{showRecommendations ? "Hide recommendations" : "Find a team →"}</button>
                  <button type="button" className={styles.primaryButton} onClick={() => { setTeamLibraryOpen(true); setTeamSaveName(""); }}>Save / Load Team</button>
                  <button type="button" className={styles.ghostButton} onClick={() => { releaseReplacedTemporarySlots([makeBuild(null), makeBuild(null), makeBuild(null)]); setTeam([makeBuild(null), makeBuild(null), makeBuild(null)]); }}>Reset</button>
                </div>
              </div>

              {teamPresetMessage ? <div className={styles.teamPresetMessage}>{teamPresetMessage}</div> : null}
              <div className={styles.teamSlots}>
                {resolvedTeam.map((item, index) =>
                  item.monster ? (
                    <article key={`${index}-${item.monster.id}`} className={styles.slot}>
                      <button
                        type="button"
                        className={styles.removeButton}
                        aria-label={`Remove ${item.monster.name}`}
                        onClick={() => updateTeamBuild(index, makeBuild(null))}
                      >
                        ×
                      </button>
                      <button type="button" className={`${styles.slotTop} ${styles.slotMonsterPickerTrigger}`} onClick={() => openMonsterPicker(index)} aria-label={`Replace ${item.monster.name} in team slot ${index + 1}`} title="Choose a different monster">
                        <TeamMonsterPortrait monster={item.monster} className={styles.slotPortrait} alt={item.monster.name} />
                        <div className={styles.slotTitle}>
                    <span>Slot {index + 1} · {index === 0 ? "Main DPS" : index === 1 ? "Support" : "Utility"}</span>
                          <strong>{item.monster.name}</strong>
                          <span>{item.monster.element} · {item.monster.rarity}</span>
                        </div>
                      </button>

                      <div className={styles.compareQuickStats} aria-label="Current monster build; select any value to edit">
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} level`}><span>Lv</span><b>{item.build.level}</b></button>
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} rank`}><span>Rank</span><b><TeamRankText rank={item.build.rank} /></b></button>
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} enhancement`}><span>Enh</span><b className={styles.quickEnhancement}>+{item.build.enhancement}</b></button>
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} genetic potential: attack ${item.build.damageGeneticPotential}%, health ${item.build.healthGeneticPotential}%`} title={`Genetic Potential · Attack ${item.build.damageGeneticPotential}% · Health ${item.build.healthGeneticPotential}%`} className={styles.quickGp}>
                          <img src={assetPath("/icons/breed-attack.png")} alt="Attack genetic potential" />
                          <b>{item.build.damageGeneticPotential}%</b>
                          <img src={assetPath("/icons/breed-health.png")} alt="Health genetic potential" />
                          <b>{item.build.healthGeneticPotential}%</b>
                        </button>
                        {(() => {
                          const trait = getAvailableTraits().find((entry) => entry.id === item.build.traitId);
                          const rarityColor = { rare: "#69c7ff", epic: "#e88bff", legendary: "#ffb15f", mythical: "#78dfac" }[trait?.rarity ?? "rare"];
                          return <button type="button" className={styles.quickTrait} onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} trait: ${trait?.name ?? "None"}`} title={`Trait: ${trait?.name ?? "None"}`}>
                            <span className={styles.quickTraitLabel}>Trait</span>
                            <span className={styles.quickTraitIcon}>{trait ? <TraitIcon trait={trait} size="combat" /> : <span className={styles.quickTraitEmptyIcon}>◇</span>}</span>
                            <b className={styles.quickTraitName} style={trait ? { color: rarityColor } : undefined}>{trait?.name ?? "None"}</b>
                          </button>;
                        })()}
                      </div>
                      <div className={styles.mutationSummary}>
                        <span>Mutations</span><small>Click: Off → Normal → X → Off</small>
                      </div>
                      <div className={styles.compareMutationLine} role="group" aria-label={`${item.monster.name} mutations. Click to cycle Off, Normal, X`}>
                        {teamMutationFamilies.map((mutation) => {
                          const isX = item.build.mutations.includes(mutation.xId);
                          const active = isX || item.build.mutations.includes(mutation.id);
                          return <button
                            type="button"
                            key={mutation.id}
                            onClick={() => setTeamMutation(index, mutation)}
                            className={`${active ? styles.compareMutationActive : ""} ${isX ? styles.compareMutationX : ""}`}
                            aria-pressed={active}
                            aria-label={`${item.monster.name} ${mutation.label}: ${isX ? "X mutation" : active ? "Normal mutation" : "Off"}. Click to cycle Off, Normal, X`}
                            title={`${mutation.label}: ${isX ? "X" : active ? "Normal" : "Off"} · Click to cycle Off → Normal → X → Off`}
                          >
                            <img src={assetPath(isX ? mutation.xIcon : mutation.icon)} alt="" />
                            {isX ? <span className={styles.mutationXBadge} aria-hidden="true">X</span> : null}
                          </button>;
                        })}
                      </div>
                      <div className={styles.compareGearLine}>
                        {([
                          { label: "Weapon", id: item.build.weaponId, name: WEAPONS.find((gear) => gear.id === item.build.weaponId)?.name ?? "None" },
                          { label: "Armor", id: item.build.armorId, name: ARMORS.find((gear) => gear.id === item.build.armorId)?.name ?? "None" },
                        ]).map((gear) => <button type="button" key={gear.label} onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} ${gear.label}: ${gear.name}`} title={`${gear.label}: ${gear.name}`}>
                          {gear.id ? <img src={assetPath(`/gear/${gear.id}.png`)} alt="" /> : <span className={styles.emptyGearIcon}>◇</span>}
                          <span>{gear.label} <b>{gear.name}</b></span>
                        </button>)}
                      </div>
                      <div className={styles.monsterCoreStats} aria-label={`${item.monster.name} current stats`}>
                        <div><span><img src={assetPath("/account-icons/damage.png")} alt="" />Damage</span><strong>{formatStatNumber(item.stats?.damage ?? 0)}</strong></div>
                        <div><span><img src={assetPath("/account-icons/health.png")} alt="" />Health</span><strong>{formatStatNumber(item.stats?.health ?? 0)}</strong></div>
                        <div><span><img src={assetPath("/icons/dps.png")} alt="" />Skill DPS</span><strong>{formatStatNumber(item.dps)}</strong></div>
                      </div>
                      <details className={styles.compareEditor} open={editingTeamSlot === index} onToggle={(event) => { if (!event.currentTarget.open && editingTeamSlot === index) closeTeamEditor(); }}>
                        {editingTeamSlot === index ? <summary onClick={(event) => { event.preventDefault(); closeTeamEditor(); }}><span>Slot {index + 1} · {item.monster.name} · Build settings</span><span>✕ Close</span></summary> : null}
                        <div className={styles.compareEditorBody}>
                      <section className={styles.buildGroup}>
                        <div className={styles.buildGroupTitle}>
                          <span>Pet</span>
                        </div>
                        <div className={styles.levelControl}>
                        <div className={styles.control}>
                          <label>Level</label>
                          <input
                            type="number"
                            min={1}
                            max={combatContext === "dungeon" ? DUNGEON_TEAM_LEVEL : CURRENT_MAX_LEVEL}
                            value={item.build.level}
                            disabled={combatContext === "dungeon"}
                            title={combatContext === "dungeon" ? "Dungeon mode forces Level 60. Your previous level returns outside Dungeon." : undefined}
                            onChange={(event) =>
                              updateTeamBuild(index, {
                                level: Math.max(1, Math.min(CURRENT_MAX_LEVEL, Number(event.target.value) || 1)),
                              })
                            }
                          />
                        </div>
                        </div>
                        <div className={styles.compactFieldLabel}>Rank</div>
                        <div className={styles.rankStrip}>
                          {ranks.map((rank, rankIndex) => {
                            const selected = item.build.rank === rank;
                            const visual = BUILD_RANK_VISUALS[rank];
                            return <button key={rank} type="button" aria-pressed={selected} onClick={() => updateTeamBuild(index, { rank: rank as Rank })} className={rankIndex ? styles.rankDivider : undefined} style={{ background: selected ? visual.activeBackground : undefined, boxShadow: selected ? `inset 0 0 0 1px ${visual.color}99, inset 0 1px 0 rgba(255,255,255,0.08)` : undefined }}><span style={visual.labelBackground ? { backgroundImage: visual.labelBackground, backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 1px 0 #050608)" } : { color: visual.color, textShadow: "-0.5px 0 #050608, 0.5px 0 #050608, 0 1px #050608" }}>{rank}</span></button>;
                          })}
                        </div>
                        <div className={styles.compactFieldHeader}><span>Enhancement</span><span>+10 max</span></div>
                        <div className={styles.enhancementStepper}>
                          <button type="button" aria-label="Decrease enhancement" disabled={item.build.enhancement <= 0} onClick={() => updateTeamBuild(index, { enhancement: Math.max(0, item.build.enhancement - 1) })}>−</button>
                          <strong className={item.build.enhancement ? styles.enhancementActive : undefined}>+{item.build.enhancement}</strong>
                          <button type="button" aria-label="Increase enhancement" disabled={item.build.enhancement >= 10} onClick={() => updateTeamBuild(index, { enhancement: Math.min(10, item.build.enhancement + 1) })}>+</button>
                        </div>
                        {item.monster.isEvolved ? <div className={styles.evolutionControl}><EvolutionMultiplierEditor compact value={item.build.evolutionPercent} onChange={(evolutionPercent) => updateTeamBuild(index, { evolutionPercent })} /></div> : null}
                        <details className={styles.compactDisclosure}>
                          <summary>
                            <span className={styles.disclosureLabel}>
                              <img src={assetPath("/icons/genetic-potential.png")} alt="" />
                              Genetic Potential
                            </span>
                            <span className={styles.disclosureValue}>{item.build.damageGeneticPotential}% / {item.build.healthGeneticPotential}%</span>
                          </summary>
                          <div className={styles.gpControls}>
                            <div className={styles.control}>
                              <label>Attack</label>
                              <select aria-label="GP Damage" value={item.build.damageGeneticPotential} onChange={(event) => updateTeamBuild(index, { damageGeneticPotential: Number(event.target.value) })}>{GENETIC_POTENTIAL_VALUES.map((value) => <option key={value} value={value}>{value}%</option>)}</select>
                            </div>
                            <div className={styles.control}>
                              <label>Health</label>
                              <select aria-label="GP Health" value={item.build.healthGeneticPotential} onChange={(event) => updateTeamBuild(index, { healthGeneticPotential: Number(event.target.value) })}>{GENETIC_POTENTIAL_VALUES.map((value) => <option key={value} value={value}>{value}%</option>)}</select>
                            </div>
                          </div>
                        </details>
                      </section>

                      <section className={styles.buildGroup}>
                        <div className={styles.buildGroupTitle}>
                          <span>Mutations</span>
                          <b>{item.build.mutations.length} / 4</b>
                        </div>
                        <p className={styles.cycleHint}>Click to cycle Off → Normal → X → Off</p>
                        <div className={styles.mutationGrid}>
                          {teamMutationFamilies.map((mutation) => {
                            const isX = item.build.mutations.includes(mutation.xId);
                            const isSelected = isX || item.build.mutations.includes(mutation.id);
                            return (
                              <button
                                key={mutation.id}
                                type="button"
                                aria-pressed={isSelected}
                                aria-label={`${mutation.label}. ${isX ? "X Mutation" : isSelected ? "Selected" : "Not selected"}. Click to cycle Off, Normal, X.`}
                                className={`${styles.mutationTile} ${isSelected ? styles.mutationActive : ""}`}
                                style={isSelected ? { borderColor: mutation.accent, backgroundColor: `${mutation.accent}12` } : undefined}
                                onClick={() => setTeamMutation(index, mutation)}
                              >
                                <img src={assetPath(isX ? mutation.xIcon : mutation.icon)} alt="" />
                                <span><strong>{mutation.label}</strong><small style={{ color: isSelected ? mutation.accent : undefined }}>{isX ? "X Mutation" : isSelected ? "Selected" : "Not selected"}</small></span>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      <section className={styles.buildGroup}>
                        <div className={styles.buildGroupTitle}><span>Trait & Equipment</span></div>
                        <div className={styles.traitControl}>
                          <strong className={styles.traitEditorLabel}>Trait</strong>
                          <TraitSelect value={item.build.traitId} onChangeAction={(value) => updateTeamBuild(index, { traitId: value })} />
                        </div>
                        <div className={styles.equipmentGrid}>
                          <OwnedGearSelect label="Weapon" type="weapon" owner={teamOwner(team[index], index)} copies={ownedEquipment} onSelect={(id) => assignOwnedGear(teamOwner(team[index], index), "weapon", id, (changes) => { updateTeamBuild(index, changes); if (team[index].inventoryCopyId) updateInventoryBuild(team[index].inventoryCopyId, changes); })} />
                          <OwnedGearSelect label="Armor" type="armor" owner={teamOwner(team[index], index)} copies={ownedEquipment} onSelect={(id) => assignOwnedGear(teamOwner(team[index], index), "armor", id, (changes) => { updateTeamBuild(index, changes); if (team[index].inventoryCopyId) updateInventoryBuild(team[index].inventoryCopyId, changes); })} />
                        </div>
                        <small className={styles.helper}>Edit attributes on individual items in Equipment inventory. Equipped stats update automatically.</small>
                      </section>

                        </div>
                      </details>

                      <div className={styles.compactStats}>
                        <div className={styles.slotStat}><span><img src={assetPath("/account-icons/damage.png")} alt="" />Damage</span><strong>{formatStatNumber(item.stats?.damage ?? 0)}</strong></div>
                        <div className={styles.slotStat}><span><img src={assetPath("/account-icons/health.png")} alt="" />Health</span><strong>{formatStatNumber(item.stats?.health ?? 0)}</strong></div>
                        <div className={styles.slotStat}><span><img src={assetPath("/icons/dps.png")} alt="" />Total Skill DPS</span><strong>{formatStatNumber(item.dps)}</strong></div>
                        <div className={styles.slotStat}><span><img src={assetPath("/account-icons/critical-chance.png")} alt="" />Crit Chance</span><strong>{item.stats ? `${Number(item.stats.critChance.toFixed(2))}%` : "—"}</strong></div>
                        <div className={styles.slotStat}><span><img src={assetPath("/account-icons/critical-damage.png")} alt="" />Crit Multiplier</span><strong>{item.stats ? `${Number(item.stats.critMultiplier.toFixed(2))}×` : "—"}</strong></div>
                      </div>

                      <div className={styles.slotFooter}>
                        {(() => {
                          const inventoryBuild = inventoryBuilds[item.build.inventoryCopyId ?? item.monster.id];
                          const saved = Boolean(inventoryBuild && buildSignature(inventoryBuild) === buildSignature(item.build));
                          return (
                            <>
                              <span className={`${styles.saveState} ${saved ? styles.saveStateSaved : ""}`}>
                                {saved ? "Saved to inventory" : inventoryBuild ? "Unsaved build changes" : "Not saved to inventory"}
                              </span>
                              <button type="button" className={styles.saveButton} onClick={() => saveTeamBuildToInventory(index)}>
                                {saved ? "Saved" : "Save Build"}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </article>
                  ) : (
                    <button key={index} type="button" className={styles.emptySlot} onClick={() => openMonsterPicker(index)} aria-label={`Choose monster for team slot ${index + 1}`}>
                      <span className={styles.emptySlotContent}>
                        <span className={styles.emptySlotPlus} aria-hidden="true">+</span>
                        <strong>Add Monster</strong>
                        <small>Choose from inventory</small>
                      </span>
                    </button>
                  ),
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.kicker}>Combined</p>
                  <h2>Team Overview</h2>
                </div>
                <span className="text-xs text-[#8da0b7]">{totals.monsters} / 3 · {combatContextLabel(combatContext)}</span>
              </div>
              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}><span className={styles.overviewLabel}><OverviewIcon kind="damage" />Total Damage</span><strong>{formatStatNumber(totals.damage)}</strong></div>
                <div className={styles.overviewCard}><span className={styles.overviewLabel}><OverviewIcon kind="health" />Total Health</span><strong>{formatStatNumber(totals.health)}</strong></div>
                <div className={styles.overviewCard} title="Sum of calculated skill DPS; skill rotations, casting and buff uptime are not simulated"><span className={styles.overviewLabel}><OverviewIcon kind="dps" />Team Skill DPS</span><strong>{formatStatNumber(totals.dps)}</strong></div>
                <div className={styles.overviewCard} title="Combined effective HP after modeled damage resistance and encounter guard passives; healing and shields are not included"><span className={styles.overviewLabel}><OverviewIcon kind="survivability" />Effective HP</span><strong className={styles.overviewAccent}>{totals.monsters ? formatStatNumber(totals.effectiveHealth) : "—"}</strong><small className={styles.overviewWeakest}>Weakest: {totals.monsters ? formatStatNumber(Math.min(...resolvedTeam.filter((item) => item.monster).map((item) => effectiveTeamHealth(item.monster!, item.build, item.stats?.health ?? 0)))) : "—"}</small></div>
                <button
                  type="button"
                  className={`${styles.overviewCard} ${styles.synergyMetric} ${styles.synergyTrigger}`}
                  aria-expanded={isSynergyExpanded}
                  aria-controls="team-synergy-explanation"
                  onClick={() => setIsSynergyExpanded((expanded) => !expanded)}
                  title="Open the breakdown of passives, support effects, control, and team combos"
                >
                  <span className={styles.overviewLabel}><OverviewIcon kind="synergy" />Synergy Score</span>
                  <strong>{teamSynergy.score} / 100</strong>
                  <small>Team composition · estimated</small>
                  <span className={styles.synergyCue}>
                    {isSynergyExpanded ? "Hide why this score" : "Why this score?"}
                    <span aria-hidden="true">{isSynergyExpanded ? "▴" : "▾"}</span>
                  </span>
                </button>
              </div>

              <section
                id="team-synergy-explanation"
                className={styles.synergyBreakdown}
                aria-label="Synergy score explanation"
                hidden={!isSynergyExpanded}
              >
                <div className={styles.synergyExplanationHeading}>
                  <div>
                    <h3>Why this synergy score?</h3>
                    <p>Points reflect teammate benefits, reliable utility, encounter-fit passives and complementary coverage—not raw damage or a win-rate prediction.</p>
                  </div>
                  <button type="button" onClick={() => setIsSynergyExpanded(false)} aria-label="Collapse synergy score explanation">Hide <span aria-hidden="true">▴</span></button>
                </div>
                <div className={styles.synergyCategories}>
                  {teamSynergy.categories.map((category) => (
                    <div className={styles.synergyCategory} key={category.key}>
                      <div className={styles.synergyCategoryHeading}><strong>{category.label}</strong><span>{category.score.toFixed(1)} / {category.max}</span></div>
                      <div className={styles.synergyBar} role="meter" aria-label={category.label} aria-valuemin={0} aria-valuemax={category.max} aria-valuenow={category.score}><i style={{ width: `${category.score / category.max * 100}%` }} /></div>
                      {category.details.length ? <ul>{category.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : <p>No qualifying effect or interaction detected.</p>}
                    </div>
                  ))}
                </div>
                <p className={styles.synergyNote}>{teamSynergy.summary} The score does not measure absolute monster power.</p>
              </section>

              <div className={styles.teamAnalysis}>
                <div className={styles.analysisBlock}>
                  <div className={styles.analysisHeading}>
                    <div>
                      <p className={styles.kicker}>Roles</p>
                      <h3>Team Jobs</h3>
                    </div>
                    <span>Based on current build stats + utility</span>
                  </div>
                  <div className={styles.roleGrid}>
                    {resolvedTeam.filter((item) => item.monster).map((item) => {
                      const role = getTeamRole(item.dps, item.stats?.health ?? 0, item.supportCount ?? 0, maxTeamDps, maxTeamHealth);
                      return (
                        <article className={styles.roleCard} key={`role-${item.monster!.id}`}>
                          <img src={assetPath(item.monster!.image ?? "/icons/monster-database.png")} alt="" />
                          <div>
                            <strong>{item.monster!.name}</strong>
                            <span className={styles.rolePill}>{role}</span>
                            <small>{formatStatNumber(item.dps)} DPS · {formatStatNumber(item.stats?.health ?? 0)} HP</small>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.analysisBlock}>
                  <div className={styles.analysisHeading}>
                    <div>
                      <p className={styles.kicker}>Utility</p>
                      <h3>Team Effects</h3>
                    </div>
                    <span>Effects found across equipped skills</span>
                  </div>
                  {Object.keys(teamUtility).length ? (
                    <div className={styles.utilityBadges}>
                      {Object.entries(teamUtility).map(([label, count]) => (
                        <span key={label}>{label}{Number(count) > 1 ? ` ×${count}` : ""}</span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyAnalysis}>No support or control effects detected in the current team.</p>
                  )}
                </div>
              </div>

              <div className={styles.skillsSectionHeader}>
                <div><p className={styles.kicker}>Skills</p><h3>Team Skills Preview</h3><span>Quick view of team damage, cooldowns, and key effects.</span></div>
              </div>
              <div className={styles.monsterBreakdowns}>
                {resolvedTeam.filter((item) => item.monster).map((item) => (
                  <article className={styles.monsterBreakdown} key={`breakdown-${item.monster!.id}`}>
                    <div className={styles.breakdownHeader}>
                      <div className={styles.breakdownMonster}>
                        <img src={assetPath(item.monster!.image ?? "/icons/monster-database.png")} alt="" />
                        <div>
                          <span>{getTeamRole(item.dps, item.stats?.health ?? 0, item.supportCount ?? 0, maxTeamDps, maxTeamHealth)}</span>
                          <strong>{item.monster!.name}</strong>
                        </div>
                      </div>
                      <strong>{formatStatNumber(item.dps)} DPS</strong>
                    </div>

                    <div className={styles.skillList}>
                      {(item.skillPreviews ?? []).map(({ skill, summary }) => {
                        const effects = getDatabaseSkillEffects(skill);
                        return (
                          <div className={styles.skillRow} key={skill.id}>
                            <div className={styles.skillIcon}>
                              <img src={assetPath(`/skill-icons/${SKILL_ICON_ALIASES[skill.id] ?? skill.id}.png`)} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assetPath(`/element-icons/${skill.element.toLowerCase()}.png`); }} />
                            </div>
                            <div className={styles.skillMain}>
                              <strong>{getSkillDisplayName(skill.name)}</strong>
                              <div className={styles.skillEffects}>
                                {effects.map((effect) => (
                                  <span key={effect} title={databaseSkillEffectDetails[effect].label}>{databaseSkillEffectDetails[effect].label}</span>
                                ))}
                              </div>
                            </div>
                            <div className={styles.skillNumbers}>
                              <span>{summary.normalDamage !== null ? `${formatStatNumber(summary.normalDamage)} dmg` : "Utility"}</span>
                              <strong>{summary.dps !== null ? `${formatStatNumber(summary.dps)} DPS` : "—"}</strong>
                              <small>{summary.cooldown !== null ? `${summary.cooldown.toFixed(1)}s CD` : "No CD"}</small>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(item.monster!.passives ?? []).length > 0 ? (
                      <div className={styles.passiveList}>
                        {(item.monster!.passives ?? []).map((passive, passiveIndex) => (
                          <div className={styles.passiveRow} key={`${passive.id}-${passiveIndex}`}>
                            <strong>{getPassiveUiName(passive)}</strong>
                            <span>{getPassiveDescription(passive)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>

          {editingInventoryId && inventoryBuilds[editingInventoryId] && monsterById.get(copyMonsterId(editingInventoryId)) ? (() => {
            const monster = monsterById.get(copyMonsterId(editingInventoryId))!;
            const build = inventoryBuilds[editingInventoryId];
            return (
                <dialog ref={editorRef} className={styles.inventoryEditor} aria-label={`Edit ${monster.name} inventory build`} onCancel={() => setEditingInventoryId(null)} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setEditingInventoryId(null); } }}>
                  <div className={styles.inventoryEditorHeader}>
                    <div className={styles.editorMonsterTitle}>
                      <img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt="" />
                      <div><span>Inventory Build</span><strong>{monster.name}</strong><small>{monster.element} · {monster.rarity}</small></div>
                    </div>
                    <button type="button" className={styles.removeButton} onClick={() => setEditingInventoryId(null)} aria-label="Close inventory editor">×</button>
                  </div>
                  <div className={styles.inventoryEditorGrid}>
                    <label>Level<input type="number" min={1} max={CURRENT_MAX_LEVEL} value={build.level} onChange={(event) => updateInventoryBuild(editingInventoryId, { level: Math.max(1, Math.min(CURRENT_MAX_LEVEL, Number(event.target.value) || 1)) })} /></label>
                    <label>Rank<select value={build.rank ?? "E"} onChange={(event) => updateInventoryBuild(editingInventoryId, { rank: event.target.value as Rank })}>{ranks.map((rank) => <option key={rank}>{rank}</option>)}</select></label>
                    <label>Enhancement<select value={build.enhancement} onChange={(event) => updateInventoryBuild(editingInventoryId, { enhancement: Number(event.target.value) })}>{Array.from({ length: 11 }, (_, value) => <option key={value} value={value}>+{value}</option>)}</select></label>
                    <label>GP Damage<select aria-label="GP Damage" value={build.damageGeneticPotential} onChange={(event) => updateInventoryBuild(editingInventoryId, { damageGeneticPotential: Number(event.target.value) })}>{GENETIC_POTENTIAL_VALUES.map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
                    <label>GP Health<select aria-label="GP Health" value={build.healthGeneticPotential} onChange={(event) => updateInventoryBuild(editingInventoryId, { healthGeneticPotential: Number(event.target.value) })}>{GENETIC_POTENTIAL_VALUES.map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
                    <div className={styles.attributeGroup}><strong>Trait</strong><TraitSelect value={build.traitId} onChangeAction={(value)=>updateInventoryBuild(editingInventoryId,{traitId:value})}/></div>
                    <OwnedGearSelect label="Weapon" type="weapon" owner={inventoryOwner(editingInventoryId)} copies={ownedEquipment} onSelect={(id) => assignOwnedGear(inventoryOwner(editingInventoryId), "weapon", id, (changes) => { updateInventoryBuild(editingInventoryId, changes); setTeam((current) => current.map((item) => item.inventoryCopyId === editingInventoryId && item.monsterId ? withTeamDungeonLevel(sanitizeBuild({ ...item, ...changes }, item.monsterId), combatContext === "dungeon") : item)); })} />
                    <OwnedGearSelect label="Armor" type="armor" owner={inventoryOwner(editingInventoryId)} copies={ownedEquipment} onSelect={(id) => assignOwnedGear(inventoryOwner(editingInventoryId), "armor", id, (changes) => { updateInventoryBuild(editingInventoryId, changes); setTeam((current) => current.map((item) => item.inventoryCopyId === editingInventoryId && item.monsterId ? withTeamDungeonLevel(sanitizeBuild({ ...item, ...changes }, item.monsterId), combatContext === "dungeon") : item)); })} />
                  </div>
                  <small className={styles.helper}>Equipment attributes are managed per item in the Equipment inventory.</small>
                  {monster.isEvolved ? <label className={styles.control}>Evolution %
                    <input aria-label="Evolution %" type="number" min={MIN_EVOLUTION_PERCENT} max={MAX_EVOLUTION_PERCENT} step={0.01} value={build.evolutionPercent} onChange={(event) => updateInventoryBuild(editingInventoryId, { evolutionPercent: Number(event.target.value) })} />
                  </label> : null}
                  <div className={styles.editorMutationRow}>
                    {mutationOptions.map((mutation) => {
                      const active = build.mutations.includes(mutation.id);
                      return <button key={mutation.id} type="button" aria-pressed={active} className={`${styles.mutationButton} ${active ? styles.mutationActive : ""}`} onClick={() => updateInventoryBuild(editingInventoryId, { mutations: active ? build.mutations.filter((id) => id !== mutation.id) : [...build.mutations.filter((id) => !id.startsWith(mutation.id.split("-")[0])), mutation.id] })}>{mutation.label}</button>;
                    })}
                  </div>
                  <div className={styles.inventoryEditorFooter}>
                    <span>Changes save automatically to your local inventory.</span>
                    <button type="button" className={styles.primaryButton} onClick={() => setEditingInventoryId(null)}>Done</button>
                  </div>
                </dialog>
            );
          })() : null}

          {showRecommendations ? <section className={`${styles.panel} ${styles.recommendations}`} aria-label="Team recommendations">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Analyze</p>
                <h2>Team Recommendations</h2>
              </div>
            </div>
            <div className={styles.recommendBody}>
              <div className={styles.goalContextGrid}>
                <div className={styles.goalPicker}>
                  <label htmlFor="team-goal">Team Goal</label>
                  <select id="team-goal" value={goal} onChange={(event) => setGoal(event.target.value as TeamGoal)}>
                    <option value="balanced">Balanced</option>
                    <option value="damage">Damage Focus</option>
                    <option value="survivability">Survivability</option>
                    <option value="support">Support / Utility</option>
                  </select>
                </div>
                <div className={styles.goalPicker}>
                  <label htmlFor="team-combat-context">Combat Context</label>
                  <select id="team-combat-context" value={combatContext} onChange={(event) => changeCombatContext(event.target.value as TeamCombatContext)}>
                    <option value="standard">Standard</option>
                    <option value="boss">Boss</option>
                    <option value="rift">Rift</option>
                    <option value="spire">Tower / Spire</option>
                    <option value="dungeon">Dungeon</option>
                  </select>
                </div>
              </div>
              <div className={styles.recommendModeTabs} role="group" aria-label="Recommendation mode">
                <button type="button" aria-pressed={recommendationMode === "team"} onClick={() => setRecommendationMode("team")}>Find a Team</button>
                <button type="button" aria-pressed={recommendationMode === "improve"} onClick={() => setRecommendationMode("improve")}>Improve My Monsters</button>
              </div>
              {recommendationMode === "improve" ? (
                <article className={`${styles.recommendCard} ${styles.improvementPanel}`}>
                  <h3>Who should I improve?</h3>
                  <p className={styles.helper}>Compare your saved Damage, Health, and Skill DPS against one upgrade at a time. These are individual monster gains, not team totals.</p>
                  <div className={styles.improvementScope} role="group" aria-label="Improvement candidates">
                    <button type="button" aria-pressed={improvementScope === "team"} onClick={() => setImprovementScope("team")}>Suggested team</button>
                    <button type="button" aria-pressed={improvementScope === "all"} onClick={() => setImprovementScope("all")}>All owned</button>
                  </div>
                  {improvementTargets.length ? <div className={styles.improvementList}>
                    {improvementTargets.map(({ copyId, monster, saved, best, options, selected }) => (
                      <div className={styles.improvementCard} key={copyId}>
                        <div className={styles.improvementHeader}>
                          <TeamMonsterPortrait monster={monster} className={styles.improvementPortrait} />
                          <div className={styles.improvementIdentity}>
                            <strong>{monster.name}{copyId.includes("::copy-") ? ` · Build ${copyId.split("::copy-")[1]}` : ""}</strong>
                            <small>{compactBuildLabel(saved)}</small>
                          </div>
                          {selected ? <span className={styles.improvementBadge}>In suggested team</span> : null}
                        </div>
                        <div className={styles.improvementNext}>
                          <span>{best.category}{best.hypothetical ? " · Not owned" : ""}</span>
                          <strong>{best.label}</strong>
                        </div>
                        {upgradeStatRows(best.before, best.after)}
                        {improvementScope === "all" && !selected ? <p className={styles.improvementReason}>Shown because this owned monster has an upgrade preview. It is not on your currently suggested team.</p> : null}
                        {options.length > 1 ? <details className={styles.improvementOther}>
                          <summary>Other upgrade paths ({options.length - 1})</summary>
                          <div className={styles.improvementOtherList}>
                            {options.slice(1).map((option) => <div className={styles.improvementOtherItem} key={option.category}>
                              <strong>{option.category}{option.hypothetical ? " · Not owned" : ""}</strong>
                              <span>{option.label}</span>
                              {upgradeStatRows(option.before, option.after)}
                            </div>)}
                          </div>
                        </details> : null}
                        <button type="button" className={styles.ghostButton} onClick={() => setEditingInventoryId(copyId)}>Edit in Inventory →</button>
                      </div>
                    ))}
                  </div> : <p className={styles.helper}>No upgrades found for this view. Try All owned, or add monsters to your inventory.</p>}
                  <p className={styles.helper}>Previews change one category at a time; gains cannot be added together. Upgrade costs, mutation availability, and skill rotations are not modeled. Level previews stop at {CURRENT_MAX_LEVEL}, rank previews stop at SS. Gear you do not own is clearly marked.</p>
                </article>
              ) : <>
              <p className={styles.helper}>Recommendations recalculate automatically when you change your team goal, inventory, gear, or encounter.</p>
              <article className={`${styles.recommendCard} ${styles.optimizerNotes}`}>
                <div className={styles.recommendTitleRow}>
                  <div>
                    <h3>{goalTitle(goal)} · {combatContextLabel(combatContext)}</h3>
                    <p className={`${styles.helper} mt-1`}>{goalDescription(goal)}</p>
                  </div>
                  {recommendation ? <span className={styles.compositionScore} title="Equipment is allocated separately for each shortlisted team">Unique gear checked</span> : null}
                </div>
                {recommendation ? (
                  <>
                    <div className={styles.recommendMetrics}>
                      <div><span>Team DPS</span><strong>{formatStatNumber(recommendation.totalDps)}</strong></div>
                      <div><span>Weakest member eHP</span><strong>{formatStatNumber(recommendation.weakestEffectiveHp)}</strong></div>
                      <div><span>Synergy Score</span><strong>{recommendedSynergy?.score ?? "—"} / 100</strong></div>
                    </div>

                    <p className={styles.helper}>This {recommendedSynergy?.score ?? "—"}/100 Synergy Score uses the same formula and equipped builds as Team Overview. It measures team interactions, not survival or raw monster power. Damage and weakest-member eHP are shown separately above; no minimum HP is required.</p>

                    <div className={styles.recommendList}>
                      {recommendation.members.map(({ monster, build, dps, health, effectiveHealth }, memberIndex) => {
                        const explanation = recommendation.memberReasons.find((reason) => reason.monsterId === monster.id);
                        return (
                          <div className={styles.recommendRow} key={monster.id}>
                            <div className={styles.recommendMonster} title={monster.name}>
                              <img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt={monster.name} />
                            </div>
                            <div className={styles.recommendDetails}>
                              <strong>{monster.name}</strong>
                              <span>{compactBuildLabel(build)}</span>
                              <span>DPS {formatStatNumber(dps)} · HP {formatStatNumber(health)} · eHP {formatStatNumber(effectiveHealth)}</span>
                              {gearRecommendation?.assignments.filter((assignment) => assignment.memberIndex === memberIndex).map(({ copy, from }) => {
                                const gear = EQUIPMENT.find((item) => item.id === copy.equipmentId);
                                return gear ? <small key={copy.id} className={styles.helper}>{gear.type === "weapon" ? "⚔" : "⬡"} {gear.name} · owned #{copy.id.slice(-6)}{from && from !== inventoryOwner(build.inventoryCopyId ?? "") ? " · reassign" : ""}</small> : null;
                              })}
                              {explanation ? <em>{explanation.reasons.join(" · ")}</em> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(recommendation.utilityLabels).length > 0 ? (
                      <div className={styles.recommendReasons}>
                        <span className={styles.reasonLabel}>Composition utility</span>
                        <div className={styles.utilityBadges}>
                          {Object.entries(recommendation.utilityLabels).slice(0, 7).map(([label, count]) => (
                            <span key={label}>{label}{Number(count) > 1 ? ` ×${count}` : ""}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <button type="button" className={styles.primaryButton} onClick={() => useRecommendation()}>
                      Use This Team
                    </button>
                  </>
                ) : (
                  <p className={`${styles.helper} mt-3`}>Mark at least one monster as Owned to generate a recommendation.</p>
                )}
              </article>

              <article className={styles.recommendCard}>
                <h3>How the optimizer chose it</h3>
                <p className={`${styles.helper} mt-2`}>
                  The optimizer shortlists your owned builds, assigns each physical gear copy to at most one monster in each candidate team, then recalculates every finalist with teammate passives. Your selected goal weighs calculated DPS, weakest-member eHP and the same Synergy Score shown in Team Overview, without a minimum HP requirement. Skill DPS does not simulate casting or the uptime of buffs, healing or shields; no score predicts combat outcomes.
                </p>
                {recommendation?.alternatives.length ? (
                  <div className={styles.alternativeList}>
                    <span className={styles.reasonLabel}>Close alternatives & tradeoffs · unique gear included</span>
                    {recommendation.alternatives.map((alternative, index) => (
                      <div className={styles.alternativeCard} key={`alternative-${index}`}>
                        <div className={styles.alternativeHeader}>
                          <div>
                            <strong>{alternative.swapLabel}</strong>
                            <span>{alternative.members.map((member) => member.monster.name).join(" · ")}</span>
                          </div>
                          <b title="Recalculated with unique owned gear and teammate passives">{alternative.synergy.score} synergy</b>
                        </div>
                        <div className={styles.tradeoffRow}>
                          <span className={alternative.dpsDelta >= 0 ? styles.positiveDelta : styles.negativeDelta}>
                            {signedPercent(alternative.dpsDelta)} DPS
                          </span>
                          <span className={alternative.healthDelta >= 0 ? styles.positiveDelta : styles.negativeDelta}>
                            {signedPercent(alternative.healthDelta)} weakest eHP
                          </span>
                        </div>
                        <div className={styles.alternativeMembers}>
                          {alternative.members.map((member) => <img key={member.monster.id} src={assetPath(member.monster.image ?? "/icons/monster-database.png")} alt={member.monster.name} title={member.monster.name} />)}
                        </div>
                        {alternative.gainedUtility.length || alternative.lostUtility.length ? (
                          <div className={styles.tradeoffUtility}>
                            {alternative.gainedUtility.length ? <span>Gains {alternative.gainedUtility.join(", ")}</span> : null}
                            {alternative.lostUtility.length ? <span>Loses {alternative.lostUtility.join(", ")}</span> : null}
                          </div>
                        ) : null}
                        <button type="button" className={styles.alternativeUseButton} onClick={() => useRecommendation(alternative)}>Use This Team</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
              </>}
            </div>
          </section> : null}
        </div>
        <section className={styles.useCases} aria-label="Team use cases">
          <div><strong>Combat Context</strong><span>Apply content-specific modifiers independently of your team goal.</span></div>
          <nav aria-label="Choose team use case">
            {(["standard", "boss", "dungeon", "rift", "spire"] as TeamCombatContext[]).map((value) => <button key={value} type="button" className={combatContext === value ? styles.useCaseActive : ""} onClick={() => changeCombatContext(value)}>{value === "standard" ? "General" : value === "boss" ? "Bosses" : value === "dungeon" ? "Dungeons" : value === "spire" ? "Tower" : "Rifts"}</button>)}
          </nav>
        </section>
      </div>
      {teamLibraryOpen && <div className={styles.libraryBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setTeamLibraryOpen(false); }}>
        <section className={styles.libraryDialog} role="dialog" aria-modal="true" aria-label="Team library">
          <div className={styles.libraryHeader}><div><span className={styles.kicker}>TEAM LIBRARY · {Object.keys(savedTeams).length}/20</span><h2>Save current team</h2><p>Save three monster builds, equipment, attributes, mutations and your team goal and combat context.</p></div><button type="button" className={styles.ghostButton} onClick={() => setTeamLibraryOpen(false)}>✕</button></div>
          <div className={styles.libraryActions}><input aria-label="Team name" placeholder="Team name" value={teamSaveName} onChange={(event) => setTeamSaveName(event.target.value)} /><button type="button" className={styles.primaryButton} disabled={Object.keys(savedTeams).length >= 20} onClick={() => { const id = Array.from({length:20},(_,i)=>`slot-${i+1}`).find((candidate)=>!savedTeams[candidate]); if(id){setSelectedTeamSlot(id); setSavedTeams((current)=>({...current,[id]:{builds:team.map((build)=>build.monsterId?sanitizeBuild(build,build.monsterId):makeBuild(null)),goal,combatContext,name:teamSaveName.trim()||`Team ${id.replace('slot-','')}`,updatedAt:Date.now()}})); setTeamPresetMessage('Team saved.');setTeamLibraryOpen(false);} }}>Save New Team</button></div>
          <div className={styles.libraryPreview}><span className={styles.kicker}>CURRENT TEAM PREVIEW</span><div className={styles.libraryMembers}>{team.map((build,index)=>{const monster=build.monsterId?monsterById.get(build.monsterId):null;return <div key={index} className={styles.libraryMember}>{monster?<img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt=""/>:null}<strong>{monster?.name??'Empty slot'}</strong><small>Lv {build.level} · <TeamRankText rank={build.rank} /> · +{build.enhancement}</small></div>})}</div></div>
          <input className={styles.librarySearch} aria-label="Search saved teams" placeholder="Search saved teams..." value={teamSearch} onChange={(event)=>setTeamSearch(event.target.value)}/>
          <div className={styles.libraryGrid}>{Object.entries(savedTeams).filter(([id,saved])=>(saved.name??`Team ${id.replace('slot-','')}`).toLowerCase().includes(teamSearch.toLowerCase())||saved.builds.some((build)=>monsterById.get(build.monsterId??'')?.name.toLowerCase().includes(teamSearch.toLowerCase()))).sort((a,b)=>b[1].updatedAt-a[1].updatedAt).map(([id,saved])=><article key={id} className={styles.libraryCard}><div className={styles.libraryCardHeader}><strong>{saved.name??`Team ${id.replace('slot-','')}`}</strong><small>Slot {id.replace('slot-','')} · {new Date(saved.updatedAt).toLocaleDateString()}</small></div><div className={styles.libraryMembers}>{saved.builds.map((build,index)=>{const monster=build.monsterId?monsterById.get(build.monsterId):null;return <div key={index} className={styles.libraryMember}>{monster?<img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt=""/>:null}<strong>{monster?.name??'Empty slot'}</strong><small>Lv {build.level} · <TeamRankText rank={build.rank} /> · +{build.enhancement}</small></div>})}</div><div className={styles.libraryCardActions}><button type="button" className={styles.primaryButton} onClick={()=>{setTeam(teamForCombatContext(saved.builds.map((build)=>build.monsterId?sanitizeBuild(build,build.monsterId):makeBuild(null)),saved.combatContext));setGoal(saved.goal);setCombatContext(saved.combatContext);setTeamLibraryOpen(false);setTeamPresetMessage('Team loaded.')}}>Load Team</button><button type="button" className={styles.ghostButton} onClick={()=>{setSelectedTeamSlot(id);setSavedTeams((current)=>({...current,[id]:{builds:team.map((build)=>build.monsterId?sanitizeBuild(build,build.monsterId):makeBuild(null)),goal,combatContext,name:saved.name||`Team ${id.replace('slot-','')}`,updatedAt:Date.now()}}));setTeamPresetMessage('Team overwritten.')}}>Overwrite</button><button type="button" className={styles.ghostButton} onClick={()=>{const name=window.prompt('Rename team',saved.name??'');if(name?.trim())setSavedTeams((current)=>({...current,[id]:{...saved,name:name.trim()}}))}}>Rename</button><button type="button" className={styles.ghostButton} onClick={()=>{if(window.confirm('Delete this saved team?'))setSavedTeams((current)=>{const next={...current};delete next[id];return next})}}>Delete</button></div></article>)}</div>
        </section>
      </div>}
    </main>
  );
}
