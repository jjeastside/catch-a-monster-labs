"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Build } from "../types/build";
import type { Monster } from "../types/monster";
import { getEquipment } from "../data/equipments";
import { getTrait } from "../data/traits";
import { monsters } from "../data/monsters";
import { assetPath } from "../lib/asset-path";
import { TraitIcon } from "./trait-icon";
import { MAX_EVOLUTION_PERCENT } from "../lib/calculations/evolution";
import { CURRENT_MAX_LEVEL } from "../lib/level-config";
import { hasFixedBreeding } from "../lib/breeding-limits";
import { useCombatMode } from "../lib/combat-mode";
import { formatStatNumber } from "../lib/format-numbers";
import { RECOMMENDATION_GOALS, MUTATION_ICONS, recommendBuilds, recommendationContext, recommendationReason, applyRecommendation, type RecommendationGoal, type RecommendationPart, type BuildCandidate, type BuildMetrics } from "../lib/build-recommendations";

const buttonClass = "rounded-md border border-[#385e7e] bg-[#102e48] px-2 py-1 text-[11px] font-semibold text-[#c7ceff] hover:border-[#7182ff]";
const metricLabels = { dps: "Skill DPS", health: "HP", damage: "Damage", effectiveHealth: "Effective HP", healing: "Healing / sec", shielding: "Shield / sec" } as const;

function delta(before: number, after: number) {
    if (!before) return after ? "new" : "0%";
    const value = (after / before - 1) * 100;
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function BuildIcons({ build, part }: { build: Build; part?: RecommendationPart }) {
    const items: { name: string; icon: string }[] = [];
    for (const type of ["weapon", "armor"] as const) {
        if (part && part !== type) continue;
        const gear = getEquipment(type === "weapon" ? build.weaponId : build.armorId);
        if (gear) items.push({ name: gear.name, icon: `/gear/${gear.id}.png` });
    }
    const trait = getTrait(build.traitId);
    if (!part || part === "mutation") for (const mutation of build.mutations) items.push({ name: mutation.replace("-x", " X"), icon: MUTATION_ICONS[mutation] });
    return <div className="flex min-w-0 flex-wrap items-center gap-1">
        {items.map(item => <span key={item.name} title={item.name} className="flex min-w-0 items-center gap-1"><img src={assetPath(item.icon)} alt={item.name} className="size-6 shrink-0 object-contain" />{part && <span className="truncate text-[11px] font-semibold">{item.name}</span>}</span>)}
        {trait && (!part || part === "trait") && <span title={trait.name} aria-label={trait.name} className="flex min-w-0 items-center gap-1"><TraitIcon trait={trait} size="combat" />{part && <span className="truncate text-[11px] font-semibold">{trait.name}</span>}</span>}
        {!items.length && !(trait && (!part || part === "trait")) && <span className="text-[11px] text-[#aeb9cb]">None</span>}
    </div>;
}

function Comparison({ before, after }: { before: BuildMetrics; after: BuildMetrics }) {
    return <table className="w-full text-left text-[10px] tabular-nums"><caption className="sr-only">Current build versus recommended build under the selected goal</caption><thead><tr className="text-[#7f8b9e]"><th className="py-1 font-medium">Stat</th><th className="font-medium">Current</th><th className="font-medium">Recommended</th><th className="text-right font-medium">Change</th></tr></thead><tbody>{Object.entries(metricLabels).filter(([key]) => !(key === "healing" || key === "shielding") || before[key as keyof BuildMetrics] > 0 || after[key as keyof BuildMetrics] > 0).map(([key, label]) => {
        const from = before[key as keyof BuildMetrics], to = after[key as keyof BuildMetrics];
        return <tr key={key} className="border-t border-[#25475f]/60"><th className="py-1 font-medium text-[#aeb9cb]">{label}</th><td>{formatStatNumber(from)}</td><td>{formatStatNumber(to)}</td><td className={`text-right ${to > from ? "text-[#82f0b7]" : to < from ? "text-[#f2b3a3]" : "text-[#7f8b9e]"}`}>{delta(from, to)}</td></tr>;
    })}</tbody></table>;
}

export function BuildRecommendations({ monster, build, onBuildChangeAction }: { monster: Monster; build: Build; onBuildChangeAction: Dispatch<SetStateAction<Build>> }) {
    const [open, setOpen] = useState(false);
    const [goal, setGoal] = useState<RecommendationGoal>("General");
    const [combatMode, setCombatMode] = useCombatMode();
    const activeGoal = combatMode === "pvp" && (goal === "General" || goal === "Boss" || goal === "Dungeon" || goal === "Spire" || goal === "PvP") ? "PvP" : goal === "PvP" ? "General" : goal;
    const [allowX, setAllowX] = useState(false);
    const [comparison, setComparison] = useState(false);
    const [message, setMessage] = useState("");
    const result = useMemo(() => open ? recommendBuilds(monster, build, activeGoal, allowX) : null, [open, monster, build, activeGoal, allowX]);
    const apply = (candidate: BuildCandidate, part?: RecommendationPart) => {
        onBuildChangeAction(current => current.monsterId === monster.id ? applyRecommendation(current, candidate.build, part) : current);
        setMessage(`${part ? `Recommended ${part}` : "Recommended build"} applied.`);
    };
    const summary = (candidate: BuildCandidate) => `DPS ${delta(result!.current.metrics.dps, candidate.metrics.dps)} · HP ${delta(result!.current.metrics.health, candidate.metrics.health)} · Effective HP ${delta(result!.current.metrics.effectiveHealth, candidate.metrics.effectiveHealth)}`;
    const maximumLabel = `Lv ${activeGoal === "Dungeon" || (build.combatContext === "dungeon" && combatMode !== "pvp") ? 60 : CURRENT_MAX_LEVEL} · +10 · ${hasFixedBreeding(monster.id) ? 6 : 60}% ATK / HP${monster.isEvolved ? ` · EM ${MAX_EVOLUTION_PERCENT}%` : ""}`;
    const changeGoal = (next: RecommendationGoal) => {
        setGoal(next);
        const mode = next === "PvP" ? "pvp" : ["Boss", "Dungeon", "Spire", "General"].includes(next) ? "pve" : combatMode;
        setCombatMode(mode);
        onBuildChangeAction(current => recommendationContext({ ...current, combatMode: mode }, next));
        setMessage("");
    };
    const teammatePreview = (candidate: BuildCandidate) => <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#aeb9cb]">{candidate.build.teammateMonsterIds.map(id => monsters.find(m => m.id === id)).filter(m => m != null).map(teammate => <span key={teammate.id} className="inline-flex items-center gap-1" title="Recommended teammate"><img src={assetPath(teammate.image ?? "/icons/monster-database.png")} alt="" className="size-5 object-contain" />{teammate.name}</span>)}{candidate.build.targetStatused && <span className="text-[#ffc447]">Burn/Poison supplied</span>}</div>;
    return <section className="min-w-0 rounded-lg border border-[#34516c] bg-[#071b2b]" aria-label="Build Recommendations">
        <button type="button" className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs font-bold text-[#c7ceff]" aria-expanded={open} onClick={() => setOpen(value => !value)}><span>Build Recommendations</span><span aria-hidden="true">{open ? "▴" : "▾"}</span></button>
        {open && <div className="space-y-1.5 px-2 pb-2 text-[#e3e8f1]">
            <div className="flex flex-wrap items-center gap-2"><label htmlFor="recommendation-goal" className="text-[10px] text-[#aeb9cb]">Goal</label><select id="recommendation-goal" value={activeGoal} onChange={event => changeGoal(event.target.value as RecommendationGoal)} className="min-w-0 flex-1 rounded-md border border-[#34516c] bg-[#041320] p-1 text-[11px]">{RECOMMENDATION_GOALS.map(label => <option key={label}>{label}</option>)}</select><label className="flex items-center gap-1 text-[10px] text-[#aeb9cb]"><input aria-label="Include Mutation X upgrades" type="checkbox" checked={allowX} onChange={event => setAllowX(event.target.checked)} />Mutation X</label></div>
            <button type="button" onClick={() => window.dispatchEvent(new Event("cam-lab-open-account-profiles"))} className="text-[10px] font-semibold text-[#c7ceff]">⇄ Change account</button>
            <p className="text-[10px] text-[#7f8b9e]">Max setup: {maximumLabel} · {combatMode.toUpperCase()}</p>
            {result ? <>
                <article className="space-y-1 rounded-md border border-[#7182ff]/40 bg-[#10263b] p-2">
                    <div className="flex items-center justify-between gap-2"><strong className="text-[11px]">Best overall build found</strong><button type="button" className={buttonClass} onClick={() => apply(result.builds[0])}>Apply build</button></div>
                    <BuildIcons build={result.builds[0].build} />
                    {teammatePreview(result.builds[0])}
                    <p className="text-[10px] leading-4 text-[#82f0b7]">{summary(result.builds[0])}</p>
                    <button type="button" className="text-[10px] font-semibold text-[#c7ceff]" aria-expanded={comparison} onClick={() => setComparison(value => !value)}>{comparison ? "Hide comparison" : "Compare current vs recommended"}</button>
                    {comparison && <Comparison before={result.current.metrics} after={result.builds[0].metrics} />}
                </article>
                <div className="divide-y divide-[#25475f] rounded-md border border-[#25475f]">
                    {(["weapon", "armor", "trait", "mutation"] as const).map(part => <article key={part} data-recommendation={part} className="min-w-0 px-2 py-1.5">
                        <div className="flex items-center justify-between gap-2"><div className="min-w-0"><span className="text-[9px] uppercase tracking-wide text-[#7f8b9e]">{part === "mutation" ? "Single mutation" : part}</span><BuildIcons build={result.parts[part].build} part={part} /></div><button type="button" className={`${buttonClass} shrink-0`} aria-label={`Apply ${part}`} onClick={() => apply(result.parts[part], part)}>Apply</button></div>
                        <details className="mt-0.5 text-[10px] leading-4"><summary className="cursor-pointer text-[#82f0b7]">{summary(result.parts[part])}</summary><p className="mt-1 text-[#aeb9cb]">{recommendationReason(result.parts[part].build, part)}</p></details>
                    </article>)}
                </div>
                <details className="text-[10px]"><summary className="cursor-pointer font-semibold text-[#c7ceff]">Alternative builds</summary><div className="mt-1 space-y-1">{result.builds.slice(1).map((candidate, index) => <article key={index} className="space-y-1 rounded-md border border-[#25475f] p-1.5"><div className="flex items-center justify-between gap-2"><BuildIcons build={candidate.build} /><button type="button" className={buttonClass} aria-label={`Apply alternative ${index + 1}`} onClick={() => apply(candidate)}>Apply</button></div>{teammatePreview(candidate)}<p className="text-[10px] text-[#82f0b7]">{summary(candidate)}</p><details className="text-[10px] text-[#aeb9cb]"><summary>Gear details</summary>{recommendationReason(candidate.build)}</details></article>)}</div></details>
                <details className="text-[10px] leading-4 text-[#7f8b9e]"><summary className="cursor-pointer">How these recommendations work</summary><p className="mt-1">Recommendations maximize live-game level, breeding and enhancement, and set evolved monsters to 220% EM, preserving your rank and account bonuses while optimizing two teammates and their supported combat conditions. Applying any recommendation also applies these maximum settings and its recommended teammates. Dungeon is capped at Lv 60; Cannelloni dragons and Necro Hydra stay at 6% breeding without traits. Random attributes are ideal rolls to obtain. Teammates are selected from the monster database, not your owned inventory. Goal selection immediately switches the encounter.</p><p className="mt-1">Compared {result.evaluated.toLocaleString()} candidates with a shortlist search, not exhaustive enumeration. General/PvP/Dungeon/Spire balance DPS, effective HP and recovery; DPS/Boss/Farming prioritize damage output; Survivability prioritizes effective HP; Support prioritizes healing, shields and known buff/debuff uptime. Skill DPS sums each skill’s expected damage per cooldown. Rotations, damage over time, enemy resistance, unknown effects and proc uptime are not simulated. Rude Awakening counts only when enabled. Transferable passive bonuses are deduplicated. Burn/Poison, team damage and vulnerability are enabled only when this lineup supplies them; rankings assume those effects are active and do not guarantee uptime. Burn/Poison Fragility is excluded without a valid status source; Impair remains available instead.</p><p className="mt-1">For tied armor results, unconditional All Resistances rolls are favored over element-specific or HP-dependent rolls. Skill resistance is not added to effective HP without a known enemy damage profile. Effective HP estimates passive, trait and Fairy mitigation, expected dodge and non-stacking Vital Barrier uptime. Healing and shields use known unconditional scaling and cooldowns. Dual Cast, immunity, damage redirect and shield-breaking are described without assuming uptime. Farming does not model travel or resource rewards. Exclusive traits may require breeding transfer. Applying a single mutation replaces your selection; overall builds can stack all four.</p></details>
            </> : <p className="text-xs text-[#aeb9cb]">Stat data is unavailable for this monster.</p>}
            {message && <p role="status" className="text-[10px] text-[#82f0b7]">{message}</p>}
        </div>}
    </section>;
}
