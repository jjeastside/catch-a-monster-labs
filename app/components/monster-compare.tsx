"use client";

import { useEffect, useRef, useState } from "react";
import { monsters } from "../data/monsters";
import { getMonsterStatData } from "../data/monster-stats";
import { getSkill, getSkillDisplayName } from "../data/skills";
import { WEAPONS, ARMORS } from "../data/equipments";
import { calculateStats } from "../lib/calculations/stats";
import { calculateSkillSummary } from "../lib/calculations/skill-summary";
import { GENETIC_POTENTIAL_VALUES } from "../lib/calculations/genetic-potential";
import {
  clampEvolutionPercent,
  getEvolutionBarFill,
  MAX_EVOLUTION_PERCENT,
  MIN_EVOLUTION_PERCENT,
  EVOLUTION_STEP,
} from "../lib/calculations/evolution";
import { CURRENT_MAX_LEVEL, MIN_LEVEL } from "../lib/level-config";
import { formatNumber, formatStatNumber } from "../lib/format-numbers";
import { isBestValue } from "../lib/compare-values";
import { assetPath } from "../lib/asset-path";
import { createDefaultBuild, type Build, type Rank } from "../types/build";
import { AccountMultipliers } from "./account-multipliers";
import { useCompareAccount } from "../lib/use-compare-account";
import { PASSIVE_DEFINITIONS, getPassiveImagePath } from "../data/passives";
import { MonsterBrowser } from "./monster-browser";
import { EquipmentSelect } from "./equipment-select";
import styles from "./monster-compare.module.css";
import { CombatRank, rankColors } from "./calculator-results";
import {
  rarityBadgeClasses,
  rarityImageClasses,
  getMonsterPortraitStyles,
} from "./monster-overview-card";

const availableMonsters = monsters.filter((monster) =>
  getMonsterStatData(monster.id),
);
const defaults = () => ({ ...createDefaultBuild(), rank: "E" as Rank });
const card = "rounded-xl border border-[#344050] bg-[#151e2b]";
const control =
  "w-full min-w-0 rounded-md border border-[#344050] bg-[#0f1620] h-7 px-1 py-1 text-xs text-[#f6f8fc]";
const eyebrow =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-[#8796ff]";
const iconAliases: Record<string, string> = {
  "ghost-impact-vulnerability": "ghost-impact",
  "soul-reap-chain-vulnerability": "soul-reap-chain",
  "soul-reap-chain-scareharvest": "soul-reap-chain-poison",
};
const compareStorageKey = "cam-lab-monster-compare-v1";

type SavedCompareState = {
  ids: string[];
  mode: "shared" | "custom";
  build: Build;
  customBuilds: Build[];
};

function normalizeSavedBuild(value: unknown): Build {
  if (!value || typeof value !== "object") return defaults();
  const saved = value as Partial<Build>;
  return {
    ...defaults(),
    ...saved,
    monsterId: null,
    accountMultipliers:
      saved.accountMultipliers &&
      Array.isArray(saved.accountMultipliers.completedAchievementIds)
        ? saved.accountMultipliers
        : { completedAchievementIds: [] },
  };
}

function Crown() {
  return (
    <svg
      aria-label="Unique winner"
      role="img"
      viewBox="0 0 20 16"
      className="size-3 shrink-0 text-[#edc96d]"
      fill="currentColor"
    >
      <path d="M2 12 0 3l5 3L10 0l5 6 5-3-2 9H2Zm0 2h16v2H2Z" />
    </svg>
  );
}
function winnerClass(
  best: boolean,
  unique: boolean,
  tone: "gold" | "green" = "gold",
) {
  if (!best) return "border-[#344050] bg-[#0f1620]";
  if (tone === "green") {
    return unique
      ? "border-[#52d67d]/80 bg-[#0f221a]"
      : "border-[#52d67d]/55 bg-[#0d1d18]";
  }
  return unique
    ? "border-[#f1cf62]/85 bg-[#251f0c]"
    : "border-[#f1cf62]/60 bg-[#1d180b]";
}
function Value({
  label,
  value,
  best,
  peers,
  suffix = "",
  icon,
  inline = false,
  tone = "gold",
}: {
  label: string;
  value: number | null;
  best: boolean;
  peers: (number | null)[];
  suffix?: string;
  icon?: string;
  inline?: boolean;
  tone?: "gold" | "green";
}) {
  const unique = best && peers.filter((item) => item === value).length === 1;
  return (
    <div
      data-best={best}
      data-unique={unique}
      data-tone={tone}
      className={`relative min-w-0 rounded-md border px-1.5 py-1.5 ${inline ? "flex items-center justify-between gap-2 px-2 py-2" : ""} ${winnerClass(best, unique, tone)}`}
      title={
        unique ? "Unique best value" : best ? "Tied best value" : undefined
      }
    >
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-[#a9b7cd]">
        {icon && (
          <img
            src={assetPath(icon)}
            alt=""
            className="size-4 shrink-0 object-contain"
          />
        )}
        <span>{label}</span>
        {unique && !inline && (
          <span className="absolute -right-0.5 -top-1">
            <Crown />
          </span>
        )}
      </div>
      <div
        className={`flex items-center gap-1.5 font-bold tabular-nums leading-tight ${inline ? "text-[22px]" : "mt-1 text-[18px] tracking-tight"} ${best ? tone === "green" ? unique ? "text-[#a4f0bf]" : "text-[#caf7d8]" : unique ? "text-[#fff2c4]" : "text-[#f6f8fc]" : "text-[#f6f8fc]"}`}
      >
        {unique && inline && <Crown />}
        {value === null
          ? "—"
          : `${suffix === "%" || suffix === "×" ? formatNumber(value) : formatStatNumber(value)}${suffix}`}
      </div>
      {best && (
        <span className="sr-only">
          {unique ? "Unique best value" : "Tied best value"}
        </span>
      )}
    </div>
  );
}
function Cooldown({
  value,
  peers,
}: {
  value: number | null;
  peers: (number | null)[];
}) {
  const best = isBestValue(value, peers, true);
  const unique = best && peers.filter((item) => item === value).length === 1;
  return (
    <span
      data-best={best}
      data-unique={unique}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${winnerClass(best, unique, "gold")} ${best ? "text-[#f3e6bb]" : "text-[#a9b7cd]"}`}
      title={
        unique ? "Lowest cooldown" : best ? "Tied lowest cooldown" : "Cooldown"
      }
    >
      {unique && <Crown />}
      {value === null ? "Triggered / unknown" : `${formatNumber(value)}s CD`}
    </span>
  );
}


type CompareSelectOption = {
  value: number | string;
  label: string;
};

function CompareSelect({
  label,
  value,
  onChange,
  options,
  ariaLabel,
  icon,
  compact = false,
  accent = "default",
}: {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  options: CompareSelectOption[];
  ariaLabel: string;
  icon?: string;
  compact?: boolean;
  accent?: "default" | "blue";
}) {
  return (
    <label className="text-xs text-[#a9b7cd]">
      {label}
      <span
        className={`${styles.selectShell} ${compact ? styles.selectShellCompact : ""} ${icon ? styles.selectShellWithIcon : ""}`.trim()}
      >
        {icon && (
          <img
            src={assetPath(icon)}
            alt=""
            aria-hidden="true"
            className={`${styles.selectIcon} ${accent === "blue" ? styles.selectIconBlue : ""}`.trim()}
          />
        )}
        <select
          className={`${control} mt-1 ${styles.compareSelect} ${icon ? styles.compareSelectWithIcon : ""} ${accent === "blue" ? styles.compareSelectBlue : ""}`.trim()}
          aria-label={ariaLabel}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function SharedEvolutionMultiplier({
  value,
  onChange,
  shared = true,
}: {
  value: number;
  onChange: (value: number) => void;
  shared?: boolean;
}) {
  const [inputDraft, setInputDraft] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<number | null>(null);
  const [precisionRange, setPrecisionRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [precisionOverlay, setPrecisionOverlay] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const dragState = useRef<{
    pointerId: number;
    left: number;
    top: number;
    width: number;
    overlayLeft: number;
    overlayWidth: number;
    startY: number;
    preview: number;
    precisionRange: { min: number; max: number } | null;
    precisionStartX: number | null;
    precisionStartValue: number | null;
  } | null>(null);

  const displayedValue = dragPreview ?? value;
  const maxBonus = MAX_EVOLUTION_PERCENT - MIN_EVOLUTION_PERCENT;
  const inputValue = inputDraft ?? displayedValue.toFixed(2);
  const parsedValue = Number(inputValue);
  const isNumeric = inputValue.trim() !== "" && Number.isFinite(parsedValue);
  const isOutOfRange =
    isNumeric &&
    (parsedValue < MIN_EVOLUTION_PERCENT || parsedValue > MAX_EVOLUTION_PERCENT);
  const fill = getEvolutionBarFill(displayedValue);
  const precisionFill = precisionRange
    ? ((displayedValue - precisionRange.min) /
        Math.max(EVOLUTION_STEP, precisionRange.max - precisionRange.min)) *
      100
    : 0;

  const formatEvolutionValue = (internalValue: number) =>
    `${internalValue.toFixed(2)}%`;

  const commitInputValue = () => {
    const next = isNumeric ? clampEvolutionPercent(parsedValue) : value;
    onChange(next);
    setInputDraft(null);
  };

  const getCoarseValue = (clientX: number, left: number, width: number) => {
    // The left half is the visual base area. The center is EM +0%, then the
    // right half covers the usable +0% -> +120% evolution range.
    const progress = Math.min(
      1,
      Math.max(0, (clientX - (left + width / 2)) / (width / 2)),
    );
    return clampEvolutionPercent(
      MIN_EVOLUTION_PERCENT +
        progress * (MAX_EVOLUTION_PERCENT - MIN_EVOLUTION_PERCENT),
    );
  };

  return (
    <div className={styles.sharedEvolution}>
      <div className={styles.sharedEvolutionHeader}>
        <div>
          <span className={styles.sharedEvolutionLabel}>EM</span>
          <span className={styles.sharedEvolutionHint}>
            {shared
              ? "Shared across evolved monsters · drag upward for 0.01% precision"
              : "This monster only · drag upward for 0.01% precision"}
          </span>
        </div>
        <label className={styles.sharedEvolutionInput}>
          <input
            aria-label={shared ? "Shared Evolution Multiplier percentage" : "Evolution Multiplier percentage"}
            type="number"
            min={MIN_EVOLUTION_PERCENT}
            max={MAX_EVOLUTION_PERCENT}
            step={EVOLUTION_STEP}
            value={inputValue}
            onChange={(event) => {
              const nextInput = event.target.value;
              const nextValue = Number(nextInput);
              setInputDraft(nextInput);
              if (
                nextInput.trim() !== "" &&
                Number.isFinite(nextValue) &&
                nextValue >= MIN_EVOLUTION_PERCENT &&
                nextValue <= MAX_EVOLUTION_PERCENT
              ) {
                onChange(clampEvolutionPercent(nextValue));
              }
            }}
            onBlur={commitInputValue}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitInputValue();
                event.currentTarget.blur();
              }
            }}
            aria-invalid={!isNumeric || isOutOfRange}
          />
          <span>%</span>
        </label>
      </div>

      <div className={styles.sharedEvolutionTrackWrap}>
        {precisionRange && (
          <div
            className={styles.sharedEvolutionPrecision}
            style={{
              left: precisionOverlay?.left ?? 0,
              top: precisionOverlay?.top ?? 0,
              width: precisionOverlay?.width,
            }}
          >
            <div className={styles.sharedEvolutionPrecisionTitle}>
              Precision · 0.01%
            </div>
            <div className={styles.sharedEvolutionPrecisionValues}>
              <span>{formatEvolutionValue(precisionRange.min)}</span>
              <strong>{formatEvolutionValue(displayedValue)}</strong>
              <span>{formatEvolutionValue(precisionRange.max)}</span>
            </div>
            <div className={styles.sharedEvolutionPrecisionTrack}>
              <div style={{ width: `${precisionFill}%` }} />
              <span style={{ left: `${precisionFill}%` }} />
            </div>
          </div>
        )}

        <div className={styles.sharedEvolutionTrack}>
          <div
            className={styles.sharedEvolutionFill}
            style={{ width: `${fill}%` }}
          />
          <span className={styles.sharedEvolutionMidpoint} aria-hidden="true" />
          <span className={styles.sharedEvolutionValue}>
            EM: {formatEvolutionValue(displayedValue)}
          </span>
          <input
            aria-label={shared ? "Shared Evolution Multiplier" : "Evolution Multiplier"}
            type="range"
            min={MIN_EVOLUTION_PERCENT}
            max={MAX_EVOLUTION_PERCENT}
            step={EVOLUTION_STEP}
            value={value}
            onPointerDown={(event) => {
              event.preventDefault();
              const track =
                event.currentTarget.parentElement?.getBoundingClientRect();
              if (!track) return;

              const preview = getCoarseValue(
                event.clientX,
                track.left,
                track.width,
              );
              const desiredWidth = Math.max(
                track.width + 128,
                track.width * 1.28,
              );
              const overlayWidth = Math.min(
                desiredWidth,
                window.innerWidth - 16,
              );

              dragState.current = {
                pointerId: event.pointerId,
                left: track.left,
                top: track.top,
                width: track.width,
                overlayLeft: track.left + track.width / 2,
                overlayWidth,
                startY: event.clientY,
                preview,
                precisionRange: null,
                precisionStartX: null,
                precisionStartValue: null,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
              setPrecisionRange(null);
              setPrecisionOverlay(null);
              setDragPreview(preview);
            }}
            onPointerMove={(event) => {
              const drag = dragState.current;
              if (!drag || drag.pointerId !== event.pointerId) return;

              if (!drag.precisionRange && drag.startY - event.clientY >= 24) {
                const desiredWidth = Math.max(
                  drag.width + 128,
                  drag.width * 1.28,
                );
                const availableHalfWidth = Math.max(
                  0,
                  Math.min(
                    event.clientX - 8,
                    window.innerWidth - event.clientX - 8,
                  ),
                );

                drag.overlayLeft = event.clientX;
                drag.overlayWidth = Math.min(
                  desiredWidth,
                  availableHalfWidth * 2,
                );
                drag.precisionRange = {
                  min: Math.max(
                    MIN_EVOLUTION_PERCENT,
                    drag.preview - 1,
                  ),
                  max: Math.min(
                    MAX_EVOLUTION_PERCENT,
                    drag.preview + 1,
                  ),
                };
                drag.precisionStartX = event.clientX;
                drag.precisionStartValue = drag.preview;
                setPrecisionRange(drag.precisionRange);
                setPrecisionOverlay({
                  left: drag.overlayLeft,
                  top: drag.top - 12,
                  width: drag.overlayWidth,
                });
                setDragPreview(drag.preview);
                return;
              }

              if (
                drag.precisionRange &&
                drag.precisionStartX !== null &&
                drag.precisionStartValue !== null
              ) {
                const precisionSpan =
                  drag.precisionRange.max - drag.precisionRange.min;
                drag.preview = clampEvolutionPercent(
                  Math.min(
                    drag.precisionRange.max,
                    Math.max(
                      drag.precisionRange.min,
                      drag.precisionStartValue +
                        ((event.clientX - drag.precisionStartX) /
                          drag.overlayWidth) *
                          precisionSpan,
                    ),
                  ),
                );
              } else {
                drag.preview = getCoarseValue(
                  event.clientX,
                  drag.left,
                  drag.width,
                );
              }

              setDragPreview(drag.preview);
            }}
            onPointerUp={(event) => {
              const drag = dragState.current;
              if (!drag || drag.pointerId !== event.pointerId) return;

              onChange(drag.preview);
              setInputDraft(null);
              setDragPreview(null);
              setPrecisionRange(null);
              setPrecisionOverlay(null);
              dragState.current = null;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              dragState.current = null;
              setDragPreview(null);
              setPrecisionRange(null);
              setPrecisionOverlay(null);
            }}
            onChange={(event) => {
              if (dragState.current) return;
              onChange(clampEvolutionPercent(Number(event.target.value)));
              setInputDraft(null);
            }}
            aria-valuemin={MIN_EVOLUTION_PERCENT}
            aria-valuemax={MAX_EVOLUTION_PERCENT}
            aria-valuenow={displayedValue}
            title="Drag upward while adjusting to open the 0.01% precision slider."
            className={styles.sharedEvolutionRange}
          />
        </div>

        <div className={styles.sharedEvolutionScale} aria-hidden="true">
          <span>0%</span>
          <span>+{maxBonus.toFixed(0)}%</span>
        </div>
      </div>

      {(!isNumeric || isOutOfRange) && (
        <p className={styles.sharedEvolutionError}>
          {!isNumeric
            ? "Enter a valid Evolution Multiplier."
            : `Evolution Multiplier must be between ${MIN_EVOLUTION_PERCENT.toFixed(2)}% and ${MAX_EVOLUTION_PERCENT.toFixed(2)}%.`}
        </p>
      )}
    </div>
  );
}

function CompareBuildControls({
  build,
  onChange,
  compact = false,
}: {
  build: Build;
  onChange: (build: Build) => void;
  compact?: boolean;
}) {
  function update<K extends keyof Build>(key: K, value: Build[K]) {
    onChange({ ...build, [key]: value });
  }
  return (
    <div
      className={
        compact
          ? ""
          : "grid grid-cols-2 items-end gap-2 sm:grid-cols-4 xl:grid-cols-7"
      }
    >
      <div
        className={compact ? "grid grid-cols-5 items-end gap-1" : "contents"}
      >
        <label className="text-xs text-[#a9b7cd]">
          Level
          <input
            aria-label="Level"
            type="number"
            min={MIN_LEVEL}
            max={CURRENT_MAX_LEVEL}
            value={build.level}
            onChange={(event) =>
              update(
                "level",
                Math.max(
                  MIN_LEVEL,
                  Math.min(
                    CURRENT_MAX_LEVEL,
                    Math.trunc(Number(event.target.value)) || MIN_LEVEL,
                  ),
                ),
              )
            }
            className={`${control} mt-1`}
          />
        </label>
        <label className="text-xs text-[#a9b7cd]">
          Rank
          <span className={styles.rankControl}>
          <select
            className={`${control} mt-1`}
            aria-label="Rank"
            value={build.rank!}
            onChange={(event) => update("rank", event.target.value as Rank)}
          >
            {["E", "D", "C", "B", "A", "S", "SS"].map((rank) => (
              <option key={rank} style={{ color: rankColors[rank as Rank] }}>{rank}</option>
            ))}
          </select>
          <span aria-hidden="true"><CombatRank rank={build.rank} /></span>
          </span>
        </label>
        <CompareSelect
          label={compact ? "Enh" : "Enhancement"}
          ariaLabel="Enhancement"
          value={build.enhancement}
          compact={compact}
          accent="blue"
          onChange={(value) => update("enhancement", Number(value))}
          options={Array.from({ length: 11 }, (_, index) => ({
            value: index,
            label: `+${index}`,
          }))}
        />
        {(
          [
            ["damageGeneticPotential", "Damage", "/icons/breed-attack.png"],
            ["healthGeneticPotential", "HP", "/icons/breed-health.png"],
          ] as const
        ).map(([key, label, icon]) => (
          <CompareSelect
            key={key}
            label={
              compact
                ? label === "Damage"
                  ? "GP DMG"
                  : "GP HP"
                : `Genetic Potential ${label}`
            }
            ariaLabel={`Genetic Potential ${label}`}
            value={build[key]}
            icon={icon}
            compact={compact}
            onChange={(value) => update(key, Number(value))}
            options={GENETIC_POTENTIAL_VALUES.map((value) => ({
              value,
              label: `${value}%`,
            }))}
          />
        ))}
      </div>
      <div className={compact ? "mt-1 grid grid-cols-2 gap-2" : "contents"}>
        <EquipmentSelect
          compact={compact}
          label="Weapon"
          items={WEAPONS}
          value={build.weaponId}
          onChangeAction={(value) => update("weaponId", value)}
        />
        <EquipmentSelect
          compact={compact}
          label="Armor"
          items={ARMORS}
          value={build.armorId}
          onChangeAction={(value) => update("armorId", value)}
        />
      </div>
    </div>
  );
}

export function MonsterCompare() {
  const [ids, setIds] = useState(() =>
    availableMonsters.slice(0, 2).map((monster) => monster.id),
  );
  const [build, setBuild] = useState<Build>(defaults);
  const [mode, setMode] = useState<"shared" | "custom">("shared");
  const [customBuilds, setCustomBuilds] = useState<Build[]>(() =>
    availableMonsters.slice(0, 2).map(() => defaults()),
  );
  const [customInitialized, setCustomInitialized] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  useCompareAccount(build.accountMultipliers, setBuild);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(compareStorageKey);
      if (!raw) return;

      const saved = JSON.parse(raw) as Partial<SavedCompareState>;
      if (!saved || typeof saved !== "object") return;

      const restoredIds = Array.isArray(saved.ids)
        ? saved.ids
            .filter(
              (id): id is string =>
                typeof id === "string" &&
                availableMonsters.some((monster) => monster.id === id),
            )
            .slice(0, 4)
        : [];

      if (restoredIds.length < 2) return;

      const restoredBuild = normalizeSavedBuild(saved.build);
      const restoredCustomBuilds = restoredIds.map((_, index) =>
        normalizeSavedBuild(saved.customBuilds?.[index] ?? restoredBuild),
      );
      const restoredMode = saved.mode === "custom" ? "custom" : "shared";

      setIds(restoredIds);
      setMode(restoredMode);
      setBuild(restoredBuild);
      setCustomBuilds(restoredCustomBuilds);
      setCustomInitialized(restoredMode === "custom");
    } catch {
      // Compare still works if local storage is unavailable or malformed.
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    const saved: SavedCompareState = {
      ids,
      mode,
      build: { ...build, monsterId: null },
      customBuilds: ids.map((_, index) => ({
        ...(customBuilds[index] ?? build),
        monsterId: null,
      })),
    };

    try {
      localStorage.setItem(compareStorageKey, JSON.stringify(saved));
    } catch {
      // Compare remains usable when browser storage is unavailable.
    }
  }, [storageReady, ids, mode, build, customBuilds]);
  const [picker, setPicker] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (picker === null) return;
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [picker]);
  const hasSharedEvolvedMonster = ids.some((id) =>
    availableMonsters.find((monster) => monster.id === id)?.isEvolved,
  );

  const columns = ids.map((id, index) => {
    const monster = availableMonsters.find((item) => item.id === id)!;
    const currentBuild = {
      ...(mode === "shared" ? build : customBuilds[index]),
      monsterId: id,
      accountMultipliers: build.accountMultipliers,
    };
    const calculationBuild = {
      ...currentBuild,
      evolutionPercent: monster.isEvolved ? currentBuild.evolutionPercent : 100,
    };
    const stats = calculateStats(
      getMonsterStatData(id)!,
      calculationBuild,
      monster.passives ?? [],
    )!;
    const skills = monster.skillIds
      .map(getSkill)
      .filter((skill) => skill !== null)
      .map((skill) => ({
        skill,
        ...calculateSkillSummary(
          monster,
          skill,
          stats,
          calculationBuild,
          monster.passives ?? [],
        ),
      }));
    return {
      monster,
      build: currentBuild,
      stats,
      skills,
      total: skills.reduce((sum, skill) => sum + (skill.dps ?? 0), 0),
    };
  });
  const maxSkills = Math.max(...columns.map((column) => column.skills.length));
  const gridClass =
    ids.length === 2
      ? "lg:grid-cols-2"
      : ids.length === 3
        ? "xl:grid-cols-3"
        : "xl:grid-cols-4";

  return (
    <main className={`${styles.root} mx-auto w-full max-w-[2000px] space-y-2.5 px-3 py-3 text-[#f6f8fc] sm:px-4 xl:px-5`}>
      <header className={styles.banner}>
        <img src={assetPath("/icons/monster-compare.png")} alt="" />
        <div>
          <p className={styles.kicker}>Monster Tools</p>
          <h1 id="compare-heading">Monster Compare</h1>
          <p>Compare up to 4 monsters side by side with <span>{mode === "shared" ? "shared settings" : "their own builds"}</span>.</p>
        </div>
        <aside>Pick monsters to compare their stats, skills, DPS, and different builds with global account multipliers.</aside>
      </header>
      <div className={styles.account}>
        <AccountMultipliers build={build} onBuildChangeAction={setBuild} />
      </div>
      <section
        aria-label="Build mode"
        className={`${styles.mode} ${card} flex flex-wrap items-center justify-between gap-2 px-3 py-2`}
      >
        <div>
          <h2 className={`${eyebrow} mb-1`}>Build Mode</h2>
          <div
            className="inline-flex rounded-md border border-[#344050] p-0.5"
            role="group"
            aria-label="Build mode selection"
          >
            {(["shared", "custom"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={mode === value}
                onClick={() => {
                  if (value === "custom" && !customInitialized) {
                    setCustomBuilds(ids.map(() => ({ ...build })));
                    setCustomInitialized(true);
                  }
                  setMode(value);
                }}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${mode === value ? "bg-[#175bb4] text-white shadow-[inset_0_0_0_1px_#399bff]" : "text-[#a9b7cd] hover:bg-[#202846]"}`}
              >
                {value === "shared" ? "Shared Settings" : "Custom Builds"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a9b7cd]">{ids.length} / 4</span>
          <button
            disabled={ids.length >= 4}
            className="rounded-md border border-[#536aba] px-3 py-2 text-xs text-[#a8b8ff] disabled:opacity-40"
            onClick={() => setPicker(ids.length)}
          >
            + Add monster
          </button>
          <button
            className="rounded-md border border-[#536aba] px-3 py-2 text-xs text-[#a8b8ff]"
            onClick={() => {
              setBuild((current) => ({
                ...defaults(),
                accountMultipliers: current.accountMultipliers,
              }));
              setCustomBuilds(ids.map(() => defaults()));
            }}
          >
            ↻ Reset All
          </button>
        </div>
      </section>
      {mode === "shared" && (
        <section aria-label="Shared build" className={`${styles.sharedBuild} ${card} p-2.5`}>
          <CompareBuildControls build={build} onChange={setBuild} />
          {hasSharedEvolvedMonster && (
            <SharedEvolutionMultiplier
              value={build.evolutionPercent}
              onChange={(evolutionPercent) =>
                setBuild((current) => ({ ...current, evolutionPercent }))
              }
            />
          )}
        </section>
      )}
      <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${gridClass}`}>
        {columns.map((column, columnIndex) => (
          <article
            key={columnIndex}
            aria-label={`${column.monster.name} comparison`}
            className={`${styles.column} flex min-w-0 flex-col gap-1`}
          >
            <header
              className={`${card} relative flex min-h-24 items-center gap-3 p-2`}
            >
              <button
                aria-label={`Replace ${column.monster.name} image`}
                onClick={() => setPicker(columnIndex)}
                className={`h-[88px] w-[100px] shrink-0 rounded-xl border-2 p-1 ${rarityImageClasses[column.monster.rarity]}`}
                style={getMonsterPortraitStyles(column.monster).portraitFrameStyle}
              >
                <span
                  className="grid h-full w-full place-items-center overflow-hidden rounded-[7px] bg-[#10141d]/85"
                  style={getMonsterPortraitStyles(column.monster).portraitStyle}
                >
                <img
                  src={assetPath(
                    column.monster.image ?? "/icons/monster-database.png",
                  )}
                  alt={column.monster.name}
                  onError={(event) => {
                    const fallback = assetPath("/icons/monster-database.png");
                    if (!event.currentTarget.src.endsWith(fallback))
                      event.currentTarget.src = fallback;
                  }}
                  className="h-full w-full object-contain"
                />
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <button
                  className={`${styles.monsterName} pr-5 text-left text-xl font-extrabold leading-tight hover:text-[#a8b8ff]`}
                  onClick={() => setPicker(columnIndex)}
                  title="Click to replace monster"
                >
                  {column.monster.name}
                </button>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  <span className="flex items-center gap-1 rounded border border-[#344050] bg-[#0f1620] px-1.5 py-1">
                    <img
                      alt=""
                      src={assetPath(
                        `/element-icons/${column.monster.element.toLowerCase()}.png`,
                      )}
                      className="size-3"
                    />
                    {column.monster.element}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-1 ${rarityBadgeClasses[column.monster.rarity]}`}
                  >
                    {column.monster.rarity}
                  </span>
                </div>
              </div>
              <button
                aria-label={`Remove ${column.monster.name}`}
                disabled={ids.length <= 2}
                onClick={() => {
                  setCustomBuilds((current) =>
                    current.filter((_, index) => index !== columnIndex),
                  );
                  setIds((current) =>
                    current.filter((_, index) => index !== columnIndex),
                  );
                }}
                className="absolute right-2 top-2 rounded border border-[#344050] px-2 py-1 text-[#a9b7cd] disabled:opacity-25"
              >
                ×
              </button>
            </header>
            {mode === "custom" && (
              <section
                aria-label={`${column.monster.name} build`}
                className={`${card} p-2`}
              >
                <h2 className="mb-1 text-xs font-semibold text-[#91a9ff]">
                  Build
                </h2>
                <div className={styles.customBuildBody}>
                  <CompareBuildControls
                    compact
                    build={customBuilds[columnIndex]}
                    onChange={(next) =>
                      setCustomBuilds((current) =>
                        current.map((item, index) =>
                          index === columnIndex ? next : item,
                        ),
                      )
                    }
                  />
                  {column.monster.isEvolved && (
                    <SharedEvolutionMultiplier
                      shared={false}
                      value={customBuilds[columnIndex].evolutionPercent}
                      onChange={(evolutionPercent) =>
                        setCustomBuilds((current) =>
                          current.map((item, index) =>
                            index === columnIndex
                              ? { ...item, evolutionPercent }
                              : item,
                          ),
                        )
                      }
                    />
                  )}
                </div>
              </section>
            )}
            <section className={`${card} p-2`}>
              <h2 className={`${eyebrow} mb-1`}>Combat Stats</h2>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    ["damage", "DMG", "damage", ""],
                    ["health", "HP", "health", ""],
                    ["critChance", "Crit", "critical-chance", "%"],
                    ["critMultiplier", "CDMG", "critical-damage", "×"],
                  ] as const
                ).map(([key, label, icon, suffix]) => (
                  <Value
                    key={key}
                    label={label}
                    icon={`/account-icons/${icon}.png`}
                    peers={columns.map((item) => item.stats[key])}
                    value={column.stats[key]}
                    suffix={suffix}
                    best={isBestValue(
                      column.stats[key],
                      columns.map((item) => item.stats[key]),
                    )}
                    tone={key === "health" ? "green" : "gold"}
                  />
                ))}
              </div>
            </section>
            <section className={`${styles.skills} ${card} flex flex-1 flex-col overflow-hidden`}>
              <div className="flex items-center justify-between px-2 py-1.5">
                <h2 className={eyebrow}>Skills &amp; Passives</h2>
                <span className="text-[10px] text-[#a9b7cd]">
                  {column.skills.length} skills
                </span>
              </div>
              {column.skills.map((result, skillIndex) => (
                <div
                  key={result.skill.id}
                  className="border-t border-[#344050] p-2"
                >
                  <div className="mb-1.5 flex min-h-10 items-center gap-2">
                    <img
                      alt=""
                      src={assetPath(
                        `/skill-icons/${iconAliases[result.skill.id] ?? result.skill.id}.png`,
                      )}
                      className="size-10 shrink-0 rounded-md border border-[#344050] object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-bold leading-tight">
                        {getSkillDisplayName(result.skill.name)}
                      </h3>
                    </div>
                    <Cooldown
                      value={result.cooldown}
                      peers={columns.map(
                        (item) => item.skills[skillIndex]?.cooldown ?? null,
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ["normalDamage", "DMG"],
                        ["criticalDamage", "Crit"],
                        ["dps", "DPS"],
                      ] as const
                    ).map(([key, label]) => (
                      <Value
                        key={key}
                        label={label}
                        peers={columns.map(
                          (item) => item.skills[skillIndex]?.[key] ?? null,
                        )}
                        value={result[key]}
                        best={isBestValue(
                          result[key],
                          columns.map(
                            (item) => item.skills[skillIndex]?.[key] ?? null,
                          ),
                        )}
                        tone="gold"
                      />
                    ))}
                  </div>
                </div>
              ))}
              {!!column.monster.passives?.length && (
                <div className="flex flex-wrap gap-1 border-t border-[#344050] p-2">
                  {column.monster.passives.map((passive) => (
                    <span
                      key={passive.id}
                      className="flex items-center gap-1 rounded border border-[#344050] px-1.5 py-1 text-[10px] text-[#a9b7cd]"
                      title={PASSIVE_DEFINITIONS[passive.id].name}
                    >
                      <img
                        alt=""
                        src={assetPath(
                          getPassiveImagePath(passive) ??
                            "/icons/monster-database.png",
                        )}
                        className="size-4 object-contain"
                      />
                      {PASSIVE_DEFINITIONS[passive.id].name}
                    </span>
                  ))}
                </div>
              )}
              {column.skills.length < maxSkills && <div className="flex-1" />}
              <div className="mt-auto border-t border-[#52618a]/55 bg-[#101724] p-2">
                <Value
                  inline
                  label="Total Skill DPS"
                  icon="/account-icons/damage.png"
                  peers={columns.map((item) => item.total)}
                  value={column.total}
                  best={isBestValue(
                    column.total,
                    columns.map((item) => item.total),
                  )}
                  tone="gold"
                />
              </div>
            </section>
          </article>
        ))}
      </div>
      {picker !== null && (
        <dialog
          ref={dialog}
          aria-label="Choose a monster"
          onCancel={() => setPicker(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPicker(null);
          }}
          className="fixed inset-0 m-auto max-h-[85dvh] w-[min(760px,calc(100%-24px))] max-w-none overflow-auto rounded-xl border border-[#344050] bg-[#0b0e14] p-3 text-[#f6f8fc] backdrop:bg-black/70"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">
              {picker === ids.length ? "Add monster" : "Replace monster"}
            </h2>
            <button
              autoFocus
              aria-label="Close monster picker"
              className="rounded border border-[#344050] px-3 py-1"
              onClick={() => setPicker(null)}
            >
              Close ×
            </button>
          </div>
          <MonsterBrowser
            portalContainerAction={() => dialog.current ?? document.body}
            monsters={availableMonsters}
            selectedMonster={columns[picker]?.monster ?? null}
            favoriteMonsterIds={favorites}
            onToggleFavoriteAction={(id) =>
              setFavorites((current) =>
                current.includes(id)
                  ? current.filter((item) => item !== id)
                  : [...current, id],
              )
            }
            onSelectAction={(monster) => {
              if (picker === ids.length)
                setCustomBuilds((current) => [...current, { ...build }]);
              setIds((current) =>
                picker === current.length
                  ? [...current, monster.id]
                  : current.map((id, index) =>
                      index === picker ? monster.id : id,
                    ),
              );
              setPicker(null);
            }}
          />
        </dialog>
      )}
    </main>
  );
}
