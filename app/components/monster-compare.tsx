"use client";

import { useEffect, useRef, useState } from "react";
import { monsters } from "../data/monsters";
import { getMonsterStatData } from "../data/monster-stats";
import { getSkill, getSkillDisplayName } from "../data/skills";
import { WEAPONS, ARMORS } from "../data/equipments";
import { calculateStats } from "../lib/calculations/stats";
import { calculateSkillSummary } from "../lib/calculations/skill-summary";
import { GENETIC_POTENTIAL_VALUES } from "../lib/calculations/genetic-potential";
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
import { PageHeading } from "./page-heading";
import {
  rarityBadgeClasses,
  rarityImageClasses,
} from "./monster-overview-card";

const availableMonsters = monsters.filter((monster) =>
  getMonsterStatData(monster.id),
);
const defaults = () => ({ ...createDefaultBuild(), rank: "E" as Rank });
const card = "rounded-xl border border-[#344050] bg-[#151e2b]";
const control =
  "w-full min-w-0 rounded-md border border-[#344050] bg-[#0f1620] px-1 py-1.5 text-xs text-[#f6f8fc]";
const eyebrow =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-[#8796ff]";
const iconAliases: Record<string, string> = {
  "ghost-impact-vulnerability": "ghost-impact",
  "soul-reap-chain-vulnerability": "soul-reap-chain",
  "soul-reap-chain-scareharvest": "soul-reap-chain-poison",
};

function Value({
  label,
  value,
  best,
  suffix = "",
  icon,
  inline = false,
}: {
  label: string;
  value: number | null;
  best: boolean;
  suffix?: string;
  icon?: string;
  inline?: boolean;
}) {
  return (
    <div
      data-best={best}
      className={`min-w-0 rounded-md border px-1.5 py-1.5 ${inline ? "flex items-center justify-between gap-2" : ""} ${best ? "border-[#54ba91]/65 bg-[#15352f]" : "border-[#344050] bg-[#0f1620]"}`}
      title={best ? "Best value (including ties)" : undefined}
    >
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-[#a9b7cd]">
        {icon && (
          <img src={assetPath(icon)} alt="" className="size-4 object-contain" />
        )}
        {label}
      </div>
      <div
        className={`mt-1 text-[15px] font-bold tabular-nums leading-tight ${best ? "text-[#92edbc]" : "text-[#f6f8fc]"}`}
      >
        {value === null
          ? "—"
          : `${suffix === "%" || suffix === "×" ? formatNumber(value) : formatStatNumber(value)}${suffix}`}
      </div>
      {best && <span className="sr-only">Best value</span>}
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
        className={compact ? "grid grid-cols-5 items-end gap-1.5" : "contents"}
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
          <select
            className={`${control} mt-1`}
            aria-label="Rank"
            value={build.rank!}
            onChange={(event) => update("rank", event.target.value as Rank)}
          >
            {["E", "D", "C", "B", "A", "S", "SS"].map((rank) => (
              <option key={rank}>{rank}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#a9b7cd]">
          {compact ? "Enh" : "Enhancement"}
          <select
            className={`${control} mt-1`}
            aria-label="Enhancement"
            value={build.enhancement}
            onChange={(event) =>
              update("enhancement", Number(event.target.value))
            }
          >
            {Array.from({ length: 11 }, (_, index) => (
              <option key={index} value={index}>
                +{index}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["damageGeneticPotential", "Damage"],
            ["healthGeneticPotential", "HP"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-xs text-[#a9b7cd]">
            {compact
              ? label === "Damage"
                ? "GP DMG"
                : "GP HP"
              : `Genetic Potential ${label}`}
            <select
              className={`${control} mt-1`}
              aria-label={`Genetic Potential ${label}`}
              value={build[key]}
              onChange={(event) => update(key, Number(event.target.value))}
            >
              {GENETIC_POTENTIAL_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value}%
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className={compact ? "mt-2 grid grid-cols-2 gap-2" : "contents"}>
        <EquipmentSelect
          label="Weapon"
          items={WEAPONS}
          value={build.weaponId}
          onChangeAction={(value) => update("weaponId", value)}
        />
        <EquipmentSelect
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
  useCompareAccount(build.accountMultipliers, setBuild);
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
  const columns = ids.map((id, index) => {
    const monster = availableMonsters.find((item) => item.id === id)!;
    const currentBuild = {
      ...(mode === "shared" ? build : customBuilds[index]),
      monsterId: id,
      accountMultipliers: build.accountMultipliers,
    };
    const stats = calculateStats(
      getMonsterStatData(id)!,
      currentBuild,
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
          currentBuild,
          monster.passives ?? [],
        ),
      }));
    return {
      monster,
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
    <main className="mx-auto w-full max-w-[2000px] space-y-2.5 px-3 py-3 text-[#f6f8fc] sm:px-4 xl:px-5">
      <PageHeading
        id="compare-heading"
        title="Monster Compare"
        image="/icons/monster-compare.png"
      >
        Compare up to 4 monsters side by side with{" "}
        <span className="text-[#8796ff]">
          {mode === "shared" ? "shared settings" : "their own builds"}
        </span>
        .
      </PageHeading>
      <AccountMultipliers build={build} onBuildChangeAction={setBuild} />
      <section
        aria-label="Build mode"
        className={`${card} flex flex-wrap items-center justify-between gap-2 px-3 py-2`}
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
        <section aria-label="Shared build" className={`${card} p-2.5`}>
          <CompareBuildControls build={build} onChange={setBuild} />
        </section>
      )}
      <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${gridClass}`}>
        {columns.map((column, columnIndex) => (
          <article
            key={columnIndex}
            aria-label={`${column.monster.name} comparison`}
            className="flex min-w-0 flex-col gap-1.5"
          >
            <header
              className={`${card} flex min-h-24 items-center gap-3 p-2.5`}
            >
              <button
                aria-label={`Replace ${column.monster.name} image`}
                onClick={() => setPicker(columnIndex)}
                className={`size-20 shrink-0 rounded-xl border-2 p-1 ${rarityImageClasses[column.monster.rarity]}`}
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
              </button>
              <div className="min-w-0 flex-1">
                <button
                  className="text-left text-lg font-bold hover:text-[#a8b8ff]"
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
                className="self-start rounded border border-[#344050] px-2 py-1 text-[#a9b7cd] disabled:opacity-25"
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
              </section>
            )}
            <section className={`${card} p-2`}>
              <h2 className={`${eyebrow} mb-2`}>Combat Stats</h2>
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
                    value={column.stats[key]}
                    suffix={suffix}
                    best={isBestValue(
                      column.stats[key],
                      columns.map((item) => item.stats[key]),
                    )}
                  />
                ))}
              </div>
            </section>
            <section className={`${card} flex flex-1 flex-col overflow-hidden`}>
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
                  <div className="mb-1.5 flex min-h-9 items-center gap-2">
                    <img
                      alt=""
                      src={assetPath(
                        `/skill-icons/${iconAliases[result.skill.id] ?? result.skill.id}.png`,
                      )}
                      className="size-9 shrink-0 rounded-md border border-[#344050] object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold">
                        {getSkillDisplayName(result.skill.name)}
                      </h3>
                    </div>
                    <span
                      data-best={isBestValue(
                        result.cooldown,
                        columns.map(
                          (item) => item.skills[skillIndex]?.cooldown ?? null,
                        ),
                        true,
                      )}
                      className={`shrink-0 rounded-full border px-2 py-1 text-[10px] ${
                        isBestValue(
                          result.cooldown,
                          columns.map(
                            (item) => item.skills[skillIndex]?.cooldown ?? null,
                          ),
                          true,
                        )
                          ? "border-[#54ba91]/65 bg-[#15352f] text-[#92edbc]"
                          : "border-[#344050] text-[#a9b7cd]"
                      }`}
                      title="Cooldown"
                    >
                      {result.cooldown === null
                        ? "Triggered / unknown"
                        : `${formatNumber(result.cooldown)}s CD`}
                    </span>
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
                        value={result[key]}
                        best={isBestValue(
                          result[key],
                          columns.map(
                            (item) => item.skills[skillIndex]?.[key] ?? null,
                          ),
                        )}
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
              <div className="mt-auto border-t border-[#344050] p-2">
                <Value
                  inline
                  label="Total Skill DPS"
                  icon="/account-icons/damage.png"
                  value={column.total}
                  best={isBestValue(
                    column.total,
                    columns.map((item) => item.total),
                  )}
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
            portalContainer={() => dialog.current ?? document.body}
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
