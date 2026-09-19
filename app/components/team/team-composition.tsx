"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AccountMultipliers } from "../account-multipliers";
import { BUILD_RANK_VISUALS, EvolutionMultiplierEditor } from "../build-editor";
import { getMonsterStatData } from "../../data/monster-stats";
import { getSkill } from "../../data/skills";
import { ARMORS, WEAPONS } from "../../data/equipments";
import { getAvailableTraits } from "../../data/traits";
import { TraitSelect } from "../trait-select";
import { TraitIcon } from "../trait-icon";
import { EquipmentSelect } from "../equipment-select";
import { AttributeSelect } from "../attribute-select";
import { getAttributesForGear, getAttribute } from "../../data/attributes";
import { getAttributeSlotCount, getFixedAttributeIds } from "../../lib/calculations/attributes";
import { assetPath } from "../../lib/asset-path";
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
  monsterDps, buildSignature, getTeamRole, effectSummaryLabel, compactBuildLabel,
  buildForGoal, goalTitle, goalDescription, signedPercent, recommendTeams,
  type TeamGoal, type InventoryBuilds, type InventoryFilter, type InventorySort, type SavedTeams,
  loadTeamStorage, mergeIndexProgress,
} from "../../lib/team-model";

import styles from "./team-composition.module.css";

const HIDDEN_MONSTERS_STORAGE_KEY = "cam-lab-team-hidden-monsters-v1";

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
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [team, setTeam] = useState<Build[]>(defaultTeam);
  const [inventoryBuilds, setInventoryBuilds] = useState<InventoryBuilds>(defaultInventory);
  const [accountBuild, setAccountBuild] = useState<Build>(() => createDefaultBuild());
  const [goal, setGoal] = useState<TeamGoal>("balanced");
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [inventorySort, setInventorySort] = useState<InventorySort>("name");
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null);
  const [savedTeams, setSavedTeams] = useState<SavedTeams>({});
  const [selectedTeamSlot, setSelectedTeamSlot] = useState("slot-1");
  const [teamPresetMessage, setTeamPresetMessage] = useState<string | null>(null);
  const [teamLibraryOpen, setTeamLibraryOpen] = useState(false);
  const [teamSaveName, setTeamSaveName] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [editingTeamSlot, setEditingTeamSlot] = useState<number | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [replacingTeamSlot, setReplacingTeamSlot] = useState<number | null>(null);
  const [replacementSearch, setReplacementSearch] = useState("");
  const [hiddenMonsterIds, setHiddenMonsterIds] = useState<string[]>([]);
  const [showHiddenMonsters, setShowHiddenMonsters] = useState(false);

  useCompareAccount(accountBuild.accountMultipliers, setAccountBuild);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      // Access localStorage lazily so browsers which deny access are handled too.
      const restored = loadTeamStorage({ getItem: (key) => window.localStorage.getItem(key) });
      blockedStorageKeys.current = new Set(restored.blockedKeys);
      setTeam(restored.team);
      setGoal(restored.goal);
      setInventoryBuilds(restored.inventory);
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
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify({ builds: team, goal }));
    } catch {
      queueMicrotask(() => setStorageError("Browser storage is unavailable or full. Your latest changes have not been saved."));
    }
  }, [storageReady, team, goal]);

  useEffect(() => {
    if (!storageReady || blockedStorageKeys.current.has(INVENTORY_STORAGE_KEY)) return;
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryBuilds));
    } catch {
      queueMicrotask(() => setStorageError("Browser storage is unavailable or full. Your latest changes have not been saved."));
    }
  }, [storageReady, inventoryBuilds]);

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
      ...savedBuild,
      accountMultipliers: accountBuild.accountMultipliers,
      teammateMonsterIds: [teammateIds[0] ?? null, teammateIds[1] ?? null],
      evolutionPercent: monster.isEvolved ? savedBuild.evolutionPercent : 100,
    }, goal);
    const stats = calculateStats(getMonsterStatData(monster.id), build, monster.passives ?? []);
    const skillPreviews = stats
      ? monster.skillIds.flatMap((skillId) => {
          const skill = getSkill(skillId);
          if (!skill) return [];
          const summary = calculateSkillSummary(monster, skill, stats, build, monster.passives ?? []);
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

  const totals = resolvedTeam.reduce(
    (result, item) => ({
      health: result.health + (item.stats?.health ?? 0),
      damage: result.damage + (item.stats?.damage ?? 0),
      dps: result.dps + item.dps,
      monsters: result.monsters + (item.monster ? 1 : 0),
    }),
    { health: 0, damage: 0, dps: 0, monsters: 0 },
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
        return true;
      })
      .sort((a, b) => {
        if (inventorySort === "rank") return rankIndex(inventoryBuilds[b.id]?.rank) - rankIndex(inventoryBuilds[a.id]?.rank) || a.name.localeCompare(b.name);
        if (inventorySort === "level") return (inventoryBuilds[b.id]?.level ?? 0) - (inventoryBuilds[a.id]?.level ?? 0) || a.name.localeCompare(b.name);
        if (inventorySort === "dps") return getSavedStats(b).dps - getSavedStats(a).dps || a.name.localeCompare(b.name);
        if (inventorySort === "health") return getSavedStats(b).health - getSavedStats(a).health || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name);
      });
  }, [search, inventoryFilter, inventorySort, inventoryBuilds, accountBuild.accountMultipliers, teamIds, hiddenMonsterIds, showHiddenMonsters, ownedIds]);

  const recommendation = useMemo(
    () => recommendTeams(Object.fromEntries(Object.entries(inventoryBuilds)
      .filter(([copyId]) => !hiddenMonsterIds.includes(copyMonsterId(copyId)))), accountBuild.accountMultipliers, goal),
    [inventoryBuilds, accountBuild.accountMultipliers, goal, hiddenMonsterIds],
  );

  const updateTeamBuild = (index: number, changes: Partial<Build>) => {
    setTeam((current) =>
      current.map((build, buildIndex) => (buildIndex === index ? (changes.monsterId === null ? makeBuild(null) : build.monsterId ? sanitizeBuild({ ...build, ...changes }, build.monsterId) : build) : build)),
    );
  };

  // Quick mutation icons and the detailed editor share the same Normal → X → Off cycle.
  // Derive the next state from the latest build so rapid clicks don't lose updates.
  const cycleTeamMutation = (index: number, family: (typeof teamMutationFamilies)[number]) => {
    setTeam((current) => current.map((build, buildIndex) => {
      if (buildIndex !== index || !build.monsterId) return build;
      const isX = build.mutations.includes(family.xId);
      const isNormal = build.mutations.includes(family.id);
      const withoutFamily = build.mutations.filter((id) => id !== family.id && id !== family.xId);
      const mutations = isX ? withoutFamily : [...withoutFamily, isNormal ? family.xId : family.id];
      return sanitizeBuild({ ...build, mutations }, build.monsterId);
    }));
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
      current.map((build, index) => (index === emptyIndex ? { ...sanitizeBuild(savedBuild, monster.id), inventoryCopyId: copyId } : build)),
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
    setTeam((current) => current.map((build, slot) => slot === index
      ? { ...sanitizeBuild(saved, monster.id), inventoryCopyId: copyId }
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
    setInventoryBuilds((current) => {
      const copyId = build.inventoryCopyId ?? build.monsterId!;
      return { ...current, [copyId]: { ...sanitizeBuild(build, build.monsterId!), inventoryCopyId: copyId } };
    });
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

  const useRecommendation = () => {
    if (!recommendation) return;
    setTeam(
      Array.from({ length: 3 }, (_, index) => {
        const item = recommendation.members[index];
        return item ? sanitizeBuild(item.build, item.monster.id) : makeBuild(null);
      }),
    );
  };

  const saveTeamPreset = () => {
    setSavedTeams((current) => ({
      ...current,
      [selectedTeamSlot]: {
        builds: team.map((build) => (build.monsterId ? sanitizeBuild(build, build.monsterId) : makeBuild(null))),
        goal,
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
    setTeam(saved.builds.map((build) => (build.monsterId ? sanitizeBuild(build, build.monsterId) : makeBuild(null))));
    setGoal(saved.goal);
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
                    return <button key={copyId} type="button" disabled={assigned} title={assigned ? "This copy is already in another team slot" : undefined} onClick={() => replaceTeamMonster(replacingTeamSlot, monster, copyId)}>{copies.length ? `Copy ${copyIndex + 1}${assigned ? " · In team" : ""}` : "+ Add & select"}</button>;
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
          <div className={styles.bannerIcon} aria-hidden="true">III</div>
          <div>
            <p className={styles.kicker}>Monster Tools</p>
            <h1>Team Composition</h1>
            <p className="mt-1 text-sm text-[#a8bad0]">
              Build a three-monster team, save the monsters you actually own, and compare combined performance.
            </p>
          </div>
          <aside className={styles.bannerAside}>
            Inventory stores each monster&apos;s real build. Recommendations now explain why each monster was selected, show the goal weighting, and compare the tradeoffs of close alternatives.
          </aside>
        </header>

        <section className={styles.panel}>
          <AccountMultipliers build={accountBuild} onBuildChangeAction={setAccountBuild} />
        </section>

        <div className={`${styles.layout} ${showRecommendations ? "" : styles.layoutFocus}`}>
          <section className={styles.panel} aria-label="Monster inventory">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Inventory</p>
                <h2>My Monsters</h2>
              </div>
              <span className="text-xs text-[#8da0b7]">{ownedIds.length} owned</span>
            </div>
            <div className={styles.inventoryBody}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={styles.search}
                placeholder="Search monsters..."
                aria-label="Search inventory monsters"
              />
              <div className={styles.inventoryToolbar}>
                <div className={styles.inventoryFilters}>
                  {([
                    ["all", "All"],
                    ["owned", `Owned (${ownedIds.length})`],
                    ["unowned", "Unowned"],
                    ["team", "In Team"],
                  ] as const).map(([value, label]) => (
                    <button key={value} type="button" className={`${styles.filterChip} ${inventoryFilter === value ? styles.filterChipActive : ""}`} onClick={() => setInventoryFilter(value)}>
                      {label}
                    </button>
                  ))}
                </div>
                <select className={styles.inventorySort} value={inventorySort} onChange={(event) => setInventorySort(event.target.value as InventorySort)} aria-label="Sort inventory">
                  <option value="name">Name</option>
                  <option value="rank">Rank</option>
                  <option value="level">Level</option>
                  <option value="dps">DPS</option>
                  <option value="health">Health</option>
                </select>
              </div>
              <div className={styles.pickerPreferences}>
                <span>{hiddenMonsterIds.length} hidden from browsing and recommendations</span>
                <button type="button" className={styles.smallButton} onClick={() => setShowHiddenMonsters((current) => !current)}>{showHiddenMonsters ? "Hide hidden" : "Show hidden"}</button>
              </div>
              <button type="button" className={styles.indexImportButton} onClick={importFromIndexTracker}>
                Import Missing Monsters from Index Tracker
              </button>
              {inventoryMessage ? <p role="status" className={styles.inventoryMessage}>{inventoryMessage}</p> : null}
              <p className="mt-2 text-[10px] text-[#70839c]">
                Owned monsters keep a saved build. Edit a saved build directly here or load it into the team.
              </p>
              <div className={styles.inventoryList}>
                {filteredInventory.map((monster) => {
                  const copies = copiesFor(monster.id);
                  const savedBuild = inventoryBuilds[monster.id] ?? (copies[0] ? inventoryBuilds[copies[0]] : undefined);
                  const owned = copies.length > 0;
                  const inTeam = teamIds.includes(monster.id);
                  return (
                    <article key={monster.id} className={`${styles.inventoryRow} ${owned ? styles.inventoryRowOwned : ""}`}>
                      <div className={styles.inventoryPortrait}>
                        <img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt="" />
                      </div>
                      <div className="min-w-0">
                        <div className={styles.inventoryName}>{monster.name}</div>
                        <div className={styles.inventoryMeta}>{monster.element} · {monster.rarity}</div>
                        {savedBuild ? <div className={styles.inventoryBuildMeta}>{copies.length} owned · {compactBuildLabel(savedBuild)}</div> : null}
                      </div>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={`${styles.smallButton} ${owned ? styles.ownedButton : ""}`}
                          onClick={() => owned ? addOwnedCopy(monster.id) : toggleOwned(monster)}
                          title={owned ? "Add another independently editable copy" : "Add to inventory"}
                        >
                          {owned ? `+ Copy (${copies.length})` : "+ Own"}
                        </button>
                        {!owned ? <button type="button" className={styles.smallButton} onClick={() => addMonster(monster)}>+ Team</button> : null}
                        <button type="button" className={styles.smallButton} onClick={() => toggleHiddenMonster(monster.id)} aria-label={`${hiddenMonsterIds.includes(monster.id) ? "Unhide" : "Hide"} ${monster.name}`} title="Hide this species from browsing and recommendations">{hiddenMonsterIds.includes(monster.id) ? "Unhide" : "Hide"}</button>
                      </div>
                      {copies.length > 0 ? <div className={styles.copyList}>
                        {copies.map((copyId, copyIndex) => {
                          const copy = inventoryBuilds[copyId];
                          const assigned = team.some((build) => build.inventoryCopyId === copyId);
                          return <div key={copyId} className={styles.copyRow}>
                            <span className={styles.copyLabel}>#{copyIndex + 1} · {compactBuildLabel(copy)}</span>
                            <button type="button" className={styles.smallButton} onClick={() => setEditingInventoryId(copyId)}>Edit</button>
                            <button type="button" className={styles.smallButton} disabled={assigned} onClick={() => addMonster(monster, copyId)}>{assigned ? "In team" : "Load"}</button>
                            <button type="button" className={styles.smallButton} aria-label={`Remove ${monster.name} copy ${copyIndex + 1}`} title="Remove copy" onClick={() => removeOwnedCopy(copyId)}>×</button>
                          </div>;
                        })}
                      </div> : null}
                    </article>
                  );
                })}
              </div>
            </div>
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
                  <button type="button" className={styles.ghostButton} onClick={() => setTeam([makeBuild(null), makeBuild(null), makeBuild(null)])}>Reset</button>
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
                      <button type="button" className={styles.changeMonsterButton} onClick={() => { openMonsterPicker(index); }} aria-label={`Change monster in slot ${index + 1}`} title="Change monster">✎</button>
                      <div className={styles.slotTop}>
                        <div className={styles.slotPortrait}>
                          <img src={assetPath(item.monster.image ?? "/icons/monster-database.png")} alt={item.monster.name} />
                        </div>
                        <div className={styles.slotTitle}>
                          <span>Slot {index + 1}</span>
                          <strong>{item.monster.name}</strong>
                          <span>{item.monster.element} · {item.monster.rarity}</span>
                        </div>
                      </div>

                      <div className={styles.compareQuickStats} aria-label="Current monster build; select any value to edit">
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} level`}><span>Lv</span><b>{item.build.level}</b></button>
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} rank`}><span>Rank</span><b style={{ color: item.build.rank ? BUILD_RANK_VISUALS[item.build.rank].color : undefined }}>{item.build.rank ?? "—"}</b></button>
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} enhancement`}><span>Enh</span><b className={styles.quickEnhancement}>+{item.build.enhancement}</b></button>
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} genetic potential`} className={styles.quickGp}>
                          <img src={assetPath("/icons/genetic-potential.png")} alt="" />
                          <b>{item.build.damageGeneticPotential}% / {item.build.healthGeneticPotential}%</b>
                          
                        </button>
                      </div>
                      <div className={styles.compareMutationLine} aria-label="Mutations; click an icon to cycle Normal, X, then Off">
                        {teamMutationFamilies.map((mutation) => {
                          const isX = item.build.mutations.includes(mutation.xId);
                          const active = isX || item.build.mutations.includes(mutation.id);
                          return <button type="button" key={mutation.id} onClick={() => cycleTeamMutation(index, mutation)} className={active ? styles.compareMutationActive : ""} aria-pressed={active} aria-label={`${item.monster.name} ${mutation.label}: ${isX ? "X mutation" : active ? "Normal mutation" : "Off"}. Click to ${isX ? "turn off" : active ? "switch to X" : "enable Normal"}`} title={`${mutation.label}: ${isX ? "X" : active ? "Normal" : "Off"} — click to cycle Normal → X → Off`}>
                            <img src={assetPath(isX ? mutation.xIcon : mutation.icon)} alt="" />
                          </button>;
                        })}
                      </div>
                      <div className={styles.compareGearLine}>
                        <button type="button" onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} trait`}>
                          {(() => { const trait = getAvailableTraits().find((entry) => entry.id === item.build.traitId); return trait ? <TraitIcon trait={trait} size="combat" /> : <span className={styles.emptyGearIcon}>◇</span>; })()}
                          <span>Trait <b>{getAvailableTraits().find((trait) => trait.id === item.build.traitId)?.name ?? "None"}</b></span>
                        </button>
                        {([
                          { label: "Weapon", id: item.build.weaponId, name: WEAPONS.find((gear) => gear.id === item.build.weaponId)?.name ?? "None" },
                          { label: "Armor", id: item.build.armorId, name: ARMORS.find((gear) => gear.id === item.build.armorId)?.name ?? "None" },
                        ]).map((gear) => <button type="button" key={gear.label} onClick={() => setEditingTeamSlot(index)} aria-label={`Edit ${item.monster.name} ${gear.label}: ${gear.name}`} title={`${gear.label}: ${gear.name}`}>
                          {gear.id ? <img src={assetPath(`/gear/${gear.id}.png`)} alt="" /> : <span className={styles.emptyGearIcon}>◇</span>}
                          <span>{gear.label} <b>{gear.name}</b></span>
                        </button>)}
                      </div>
                      <details className={styles.compareEditor} open={editingTeamSlot === index} onToggle={(event) => { if (!event.currentTarget.open && editingTeamSlot === index) closeTeamEditor(); }}>
                        <summary onClick={(event) => { event.preventDefault(); if (editingTeamSlot === index) closeTeamEditor(); else setEditingTeamSlot(index); }}><span>{editingTeamSlot === index ? `Close · Slot ${index + 1} · ${item.monster.name}` : "Edit build"}</span></summary>
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
                            max={115}
                            value={item.build.level}
                            onChange={(event) =>
                              updateTeamBuild(index, {
                                level: Math.max(1, Math.min(115, Number(event.target.value) || 1)),
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
                        <p className={styles.cycleHint}>Click to cycle: Normal → X → Off</p>
                        <div className={styles.mutationGrid}>
                          {teamMutationFamilies.map((mutation) => {
                            const isX = item.build.mutations.includes(mutation.xId);
                            const isSelected = isX || item.build.mutations.includes(mutation.id);
                            return (
                              <button
                                key={mutation.id}
                                type="button"
                                aria-pressed={isSelected}
                                aria-label={`${mutation.label}. ${isX ? "X Mutation" : isSelected ? "Selected" : "Not selected"}. Click to ${isX ? "remove" : isSelected ? `upgrade to ${mutation.label} X` : "select"}.`}
                                className={`${styles.mutationTile} ${isSelected ? styles.mutationActive : ""}`}
                                style={isSelected ? { borderColor: mutation.accent, backgroundColor: `${mutation.accent}12` } : undefined}
                                onClick={() => cycleTeamMutation(index, mutation)}
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
                          <TraitSelect value={item.build.traitId} onChangeAction={(value) => updateTeamBuild(index, { traitId: value })} />
                        </div>
                        <div className={styles.equipmentGrid}>
                          <EquipmentSelect label="Weapon" items={WEAPONS} value={item.build.weaponId} onChangeAction={(value) => updateTeamBuild(index, { weaponId: value, weaponAttributeIds: [] })} />
                          <EquipmentSelect label="Armor" items={ARMORS} value={item.build.armorId} onChangeAction={(value) => updateTeamBuild(index, { armorId: value, armorAttributeIds: [] })} />
                        </div>
                        <div className={styles.equipmentGrid}>
                          {(["weapon", "armor"] as const).map((type) => {
                            const gear = (type === "weapon" ? WEAPONS : ARMORS).find((piece) => piece.id === item.build[type === "weapon" ? "weaponId" : "armorId"]);
                            const key = type === "weapon" ? "weaponAttributeIds" : "armorAttributeIds";
                            const selectedIds = item.build[key];
                            const slots = getAttributeSlotCount(gear?.rarity);
                            const fixedIds = getFixedAttributeIds(gear?.id ?? null);
                            return <div key={type} className={styles.attributeGroup}>
                              <strong>{type === "weapon" ? "Weapon" : "Armor"} Attributes</strong>
                              <div className={styles.attributeSlots}>
                                {fixedIds.map((id) => <div key={id} className={styles.fixedAttribute}><img src={assetPath(`/attributes/${id}.png`)} alt={getAttribute(id)?.name ?? id} /><span>FIXED</span></div>)}
                                {Array.from({ length: slots }, (_, slot) => <AttributeSelect key={slot} label={`Slot ${slot + 1}`} options={getAttributesForGear(type)} value={selectedIds[slot] ?? null} usedIds={selectedIds} onChangeAction={(value) => {
                                  const next = [...selectedIds];
                                  if (value) next[slot] = value;
                                  else next.splice(slot, 1);
                                  updateTeamBuild(index, { [key]: next });
                                }} />)}
                              </div>
                              {!gear ? <small>Select gear first.</small> : slots === 0 && fixedIds.length === 0 ? <small>Attributes require Legendary gear or higher.</small> : null}
                            </div>;
                          })}
                        </div>
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
                <span className="text-xs text-[#8da0b7]">{totals.monsters} / 3 · {goal === "boss" ? "Boss" : goal === "rift" ? "Rift" : goal === "dungeon" ? "Dungeon" : "Standard"}</span>
              </div>
              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}><span>Total Damage</span><strong>{formatStatNumber(totals.damage)}</strong></div>
                <div className={styles.overviewCard}><span>Total Health</span><strong>{formatStatNumber(totals.health)}</strong></div>
                <div className={styles.overviewCard}><span>Total Skill DPS</span><strong>{formatStatNumber(totals.dps)}</strong></div>
                <div className={styles.overviewCard}><span>Team Slots</span><strong>{totals.monsters}/3</strong></div>
              </div>

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
                              <img src={assetPath(`/skill-icons/${skill.id}.png`)} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assetPath(`/element-icons/${skill.element.toLowerCase()}.png`); }} />
                            </div>
                            <div className={styles.skillMain}>
                              <strong>{skill.name}</strong>
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
                    <label>Level<input type="number" min={1} max={115} value={build.level} onChange={(event) => updateInventoryBuild(editingInventoryId, { level: Math.max(1, Math.min(115, Number(event.target.value) || 1)) })} /></label>
                    <label>Rank<select value={build.rank ?? "E"} onChange={(event) => updateInventoryBuild(editingInventoryId, { rank: event.target.value as Rank })}>{ranks.map((rank) => <option key={rank}>{rank}</option>)}</select></label>
                    <label>Enhancement<select value={build.enhancement} onChange={(event) => updateInventoryBuild(editingInventoryId, { enhancement: Number(event.target.value) })}>{Array.from({ length: 11 }, (_, value) => <option key={value} value={value}>+{value}</option>)}</select></label>
                    <label>GP Damage<select aria-label="GP Damage" value={build.damageGeneticPotential} onChange={(event) => updateInventoryBuild(editingInventoryId, { damageGeneticPotential: Number(event.target.value) })}>{GENETIC_POTENTIAL_VALUES.map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
                    <label>GP Health<select aria-label="GP Health" value={build.healthGeneticPotential} onChange={(event) => updateInventoryBuild(editingInventoryId, { healthGeneticPotential: Number(event.target.value) })}>{GENETIC_POTENTIAL_VALUES.map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
                    <div className={styles.attributeGroup}><strong>Trait</strong><TraitSelect value={build.traitId} onChangeAction={(value)=>updateInventoryBuild(editingInventoryId,{traitId:value})}/></div>
                    <EquipmentSelect label="Weapon" items={WEAPONS} value={build.weaponId} onChangeAction={(value)=>updateInventoryBuild(editingInventoryId,{weaponId:value,weaponAttributeIds:[]})}/>
                    <EquipmentSelect label="Armor" items={ARMORS} value={build.armorId} onChangeAction={(value)=>updateInventoryBuild(editingInventoryId,{armorId:value,armorAttributeIds:[]})}/>
                  </div>
                  <div className={styles.equipmentGrid}>
                    {(["weapon","armor"] as const).map((type)=>{
                      const gear=(type==="weapon"?WEAPONS:ARMORS).find((piece)=>piece.id===build[type==="weapon"?"weaponId":"armorId"]);
                      const key=type==="weapon"?"weaponAttributeIds":"armorAttributeIds";
                      const selectedIds=build[key];
                      return <div key={type} className={styles.attributeGroup}><strong>{type==="weapon"?"Weapon":"Armor"} Attributes</strong><div className={styles.attributeSlots}>
                        {getFixedAttributeIds(gear?.id??null).map((id)=><div key={id} className={styles.fixedAttribute}><img src={assetPath(`/attributes/${id}.png`)} alt={getAttribute(id)?.name??id}/><span>FIXED</span></div>)}
                        {Array.from({length:getAttributeSlotCount(gear?.rarity)},(_,slot)=><AttributeSelect key={slot} label={`Slot ${slot+1}`} options={getAttributesForGear(type)} value={selectedIds[slot]??null} usedIds={selectedIds} onChangeAction={(value)=>{const next=[...selectedIds];if(value)next[slot]=value;else next.splice(slot,1);updateInventoryBuild(editingInventoryId,{[key]:next})}}/>)}
                      </div>{!gear?<small>Select gear first.</small>:null}</div>;
                    })}
                  </div>
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
                <h2>Recommendations</h2>
              </div>
            </div>
            <div className={styles.recommendBody}>
              <div className={styles.goalPicker}>
                <label htmlFor="team-goal">Goal / Combat Context</label>
                <select id="team-goal" value={goal} onChange={(event) => setGoal(event.target.value as TeamGoal)}>
                  <option value="balanced">Balanced</option>
                  <option value="damage">Highest DPS</option>
                  <option value="survivability">Survivability</option>
                  <option value="support">Support / Utility</option>
                  <option value="boss">Boss</option>
                  <option value="rift">Rift</option>
                  <option value="dungeon">Dungeon</option>
                </select>
              </div>
              <article className={styles.recommendCard}>
                <div className={styles.recommendTitleRow}>
                  <div>
                    <h3>{goalTitle(goal)}</h3>
                    <p className={`${styles.helper} mt-1`}>{goalDescription(goal)}</p>
                  </div>
                  {recommendation ? <span className={styles.compositionScore}>{recommendation.scorePercent}</span> : null}
                </div>
                {recommendation ? (
                  <>
                    <div className={styles.recommendMetrics}>
                      <div><span>Team DPS</span><strong>{formatStatNumber(recommendation.totalDps)}</strong></div>
                      <div><span>Team HP</span><strong>{formatStatNumber(recommendation.totalHealth)}</strong></div>
                    </div>

                    <div className={styles.scoreBreakdown}>
                      <span className={styles.reasonLabel}>Score breakdown</span>
                      {([
                        ["DPS", recommendation.normalized.dps, recommendation.weights.dps],
                        ["Health", recommendation.normalized.health, recommendation.weights.health],
                        ["Utility", recommendation.normalized.utility, recommendation.weights.utility],
                        ["Offense", recommendation.normalized.offense, recommendation.weights.offense],
                        ["Defense", recommendation.normalized.defense, recommendation.weights.defense],
                      ] as const)
                        .filter(([, , weight]) => weight > 0)
                        .map(([label, value, weight]) => (
                          <div className={styles.scoreRow} key={label}>
                            <div>
                              <span>{label}</span>
                              <small>{Math.round(weight * 100)}% weight</small>
                            </div>
                            <div className={styles.scoreTrack}>
                              <span style={{ width: `${Math.max(3, Math.round(value * 100))}%` }} />
                            </div>
                            <strong>{Math.round(value * 100)}</strong>
                          </div>
                        ))}
                    </div>

                    <div className={styles.recommendList}>
                      {recommendation.members.map(({ monster, build, dps, health }) => {
                        const explanation = recommendation.memberReasons.find((reason) => reason.monsterId === monster.id);
                        return (
                          <div className={styles.recommendRow} key={monster.id}>
                            <div className={styles.recommendMonster} title={monster.name}>
                              <img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt={monster.name} />
                            </div>
                            <div className={styles.recommendDetails}>
                              <strong>{monster.name}</strong>
                              <span>{compactBuildLabel(build)}</span>
                              <span>DPS {formatStatNumber(dps)} · HP {formatStatNumber(health)}</span>
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
                    <button type="button" className={styles.primaryButton} onClick={useRecommendation}>
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
                  Recommendations are estimates from a shortlist of up to 26 owned builds, not a guaranteed best team. Skill DPS sums damage per cooldown; it does not simulate cast timing, buff uptime, healing, or shields. Utility scores reward effect coverage. Boss, Rift, and Dungeon apply to both recommendations and Team Overview.
                </p>
                {recommendation?.alternatives.length ? (
                  <div className={styles.alternativeList}>
                    <span className={styles.reasonLabel}>Close alternatives & tradeoffs</span>
                    {recommendation.alternatives.map((alternative, index) => (
                      <div className={styles.alternativeCard} key={`alternative-${index}`}>
                        <div className={styles.alternativeHeader}>
                          <div>
                            <strong>{alternative.swapLabel}</strong>
                            <span>{alternative.members.map((member) => member.monster.name).join(" · ")}</span>
                          </div>
                          <b>{Math.round(alternative.score * 100)}</b>
                        </div>
                        <div className={styles.tradeoffRow}>
                          <span className={alternative.dpsDelta >= 0 ? styles.positiveDelta : styles.negativeDelta}>
                            {signedPercent(alternative.dpsDelta)} DPS
                          </span>
                          <span className={alternative.healthDelta >= 0 ? styles.positiveDelta : styles.negativeDelta}>
                            {signedPercent(alternative.healthDelta)} HP
                          </span>
                        </div>
                        {alternative.gainedUtility.length || alternative.lostUtility.length ? (
                          <div className={styles.tradeoffUtility}>
                            {alternative.gainedUtility.length ? <span>Gains {alternative.gainedUtility.join(", ")}</span> : null}
                            {alternative.lostUtility.length ? <span>Loses {alternative.lostUtility.join(", ")}</span> : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            </div>
          </section> : null}
        </div>
      </div>
      {teamLibraryOpen && <div className={styles.libraryBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setTeamLibraryOpen(false); }}>
        <section className={styles.libraryDialog} role="dialog" aria-modal="true" aria-label="Team library">
          <div className={styles.libraryHeader}><div><span className={styles.kicker}>TEAM LIBRARY · {Object.keys(savedTeams).length}/20</span><h2>Save current team</h2><p>Save three monster builds, equipment, attributes, mutations and your team goal.</p></div><button type="button" className={styles.ghostButton} onClick={() => setTeamLibraryOpen(false)}>✕</button></div>
          <div className={styles.libraryActions}><input aria-label="Team name" placeholder="Team name" value={teamSaveName} onChange={(event) => setTeamSaveName(event.target.value)} /><button type="button" className={styles.primaryButton} disabled={Object.keys(savedTeams).length >= 20} onClick={() => { const id = Array.from({length:20},(_,i)=>`slot-${i+1}`).find((candidate)=>!savedTeams[candidate]); if(id){setSelectedTeamSlot(id); setSavedTeams((current)=>({...current,[id]:{builds:team.map((build)=>build.monsterId?sanitizeBuild(build,build.monsterId):makeBuild(null)),goal,name:teamSaveName.trim()||`Team ${id.replace('slot-','')}`,updatedAt:Date.now()}})); setTeamPresetMessage('Team saved.');setTeamLibraryOpen(false);} }}>Save New Team</button></div>
          <div className={styles.libraryPreview}><span className={styles.kicker}>CURRENT TEAM PREVIEW</span><div className={styles.libraryMembers}>{team.map((build,index)=>{const monster=build.monsterId?monsterById.get(build.monsterId):null;return <div key={index} className={styles.libraryMember}>{monster?<img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt=""/>:null}<strong>{monster?.name??'Empty slot'}</strong><small>Lv {build.level} · {build.rank} · +{build.enhancement}</small></div>})}</div></div>
          <input className={styles.librarySearch} aria-label="Search saved teams" placeholder="Search saved teams..." value={teamSearch} onChange={(event)=>setTeamSearch(event.target.value)}/>
          <div className={styles.libraryGrid}>{Object.entries(savedTeams).filter(([id,saved])=>(saved.name??`Team ${id.replace('slot-','')}`).toLowerCase().includes(teamSearch.toLowerCase())||saved.builds.some((build)=>monsterById.get(build.monsterId??'')?.name.toLowerCase().includes(teamSearch.toLowerCase()))).sort((a,b)=>b[1].updatedAt-a[1].updatedAt).map(([id,saved])=><article key={id} className={styles.libraryCard}><div className={styles.libraryCardHeader}><strong>{saved.name??`Team ${id.replace('slot-','')}`}</strong><small>Slot {id.replace('slot-','')} · {new Date(saved.updatedAt).toLocaleDateString()}</small></div><div className={styles.libraryMembers}>{saved.builds.map((build,index)=>{const monster=build.monsterId?monsterById.get(build.monsterId):null;return <div key={index} className={styles.libraryMember}>{monster?<img src={assetPath(monster.image ?? "/icons/monster-database.png")} alt=""/>:null}<strong>{monster?.name??'Empty slot'}</strong><small>Lv {build.level} · {build.rank} · +{build.enhancement}</small></div>})}</div><div className={styles.libraryCardActions}><button type="button" className={styles.primaryButton} onClick={()=>{setTeam(saved.builds.map((build)=>build.monsterId?sanitizeBuild(build,build.monsterId):makeBuild(null)));setGoal(saved.goal);setTeamLibraryOpen(false);setTeamPresetMessage('Team loaded.')}}>Load Team</button><button type="button" className={styles.ghostButton} onClick={()=>{setSelectedTeamSlot(id);setSavedTeams((current)=>({...current,[id]:{builds:team.map((build)=>build.monsterId?sanitizeBuild(build,build.monsterId):makeBuild(null)),goal,name:saved.name||`Team ${id.replace('slot-','')}`,updatedAt:Date.now()}}));setTeamPresetMessage('Team overwritten.')}}>Overwrite</button><button type="button" className={styles.ghostButton} onClick={()=>{const name=window.prompt('Rename team',saved.name??'');if(name?.trim())setSavedTeams((current)=>({...current,[id]:{...saved,name:name.trim()}}))}}>Rename</button><button type="button" className={styles.ghostButton} onClick={()=>{if(window.confirm('Delete this saved team?'))setSavedTeams((current)=>{const next={...current};delete next[id];return next})}}>Delete</button></div></article>)}</div>
        </section>
      </div>}
    </main>
  );
}
