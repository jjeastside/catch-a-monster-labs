"use client";
import { SkillEffectSelect } from "./skill-effect-select";
import { matchesMonsterSkillEffect, type SkillEffectFilter } from "../lib/skill-effect-filter";

import { useEffect, useMemo, useState } from "react";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { getSkill, getSkillDisplayName } from "../data/skills";
import { assetPath } from "../lib/asset-path";
import { calculateSkillTransfer, atLeastOneSuccess, displayTransferChance, transferPower } from "../lib/breeding-transfer";
import { hasFixedBreeding } from "../lib/breeding-limits";
import { PageHeading } from "./page-heading";
import { TOOL_PAGE_CONTAINER } from "./tool-page-layout";

type TrackerGender = "male" | "female";
type TrackerEntry = { gender?: TrackerGender };
const STORAGE_KEY = "cam-lab-breeding-v1";
const INDEX_KEY = "cam-lab-index-tracker-v1";
const eligible = GENERATED_MONSTERS.filter((monster) => !hasFixedBreeding(monster.id)).sort((a, b) => a.name.localeCompare(b.name));
const field = "w-full rounded-lg border border-[#355578] bg-[#071729] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5caaff]";
const panel = "rounded-xl border border-[#274767] bg-[linear-gradient(155deg,#0c253d,#09182a)] p-4 sm:p-5";

function MonsterPicker({ id, onChange, title, gender, owned }: {
    id: string; onChange: (id: string) => void; title: string; gender: TrackerGender; owned: Record<string, TrackerEntry>;
}) {
    const [query, setQuery] = useState("");
    const [skillEffect, setSkillEffect] = useState<SkillEffectFilter>("all");
    const selected = eligible.find((monster) => monster.id === id);
    const options = eligible.filter((monster) => matchesMonsterSkillEffect(monster, skillEffect) && (!query || monster.name.toLowerCase().includes(query.toLowerCase())));
    return <section className={panel}>
        <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-black text-white">{title}</h2>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${gender === "male" ? "border-sky-700 bg-sky-950 text-sky-300" : "border-rose-800 bg-rose-950 text-rose-300"}`}>
                {gender === "male" ? "♂ Male" : "♀ Female"}
            </span>
        </div>
        <div className="mb-4 flex min-h-[110px] items-center gap-4 rounded-lg border border-[#285574] bg-[radial-gradient(ellipse_at_top,#104b63,#071727)] p-3">
            {selected?.image ? <img src={assetPath(selected.image)} alt="" className="h-24 w-24 shrink-0 object-contain" /> : null}
            <div className="min-w-0"><p className="truncate text-lg font-black text-white">{selected?.name ?? "Select a monster"}</p>
                <p className="text-xs text-[#b7cbe0]">{selected?.rarity} · {selected?.element}</p>
                <p className="mt-2 text-xs text-[#8faecb]">{selected && transferPower(selected) !== null ? "Power data available" : "Power data missing"}</p>
                {selected && owned[selected.id]?.gender === gender ? <p className="mt-1 text-xs font-bold text-emerald-300">✓ Gender recorded in Index Tracker</p> : selected && owned[selected.id]?.gender ? <p className="mt-1 text-xs text-amber-300">Index Tracker records the opposite gender</p> : <p className="mt-1 text-xs text-[#849db6]">Gender not recorded in Index Tracker</p>}
            </div>
        </div>
        <label className="mb-1 block text-xs font-bold text-[#b8d3ef]">Find monster</label>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name..." className={`${field} mb-2`} />
        <SkillEffectSelect value={skillEffect} onChange={setSkillEffect} label={`${title} Skill Effect`} className="mb-2" />
        <select aria-label={`${title} monster`} value={options.some((monster) => monster.id === id) ? id : ""} onChange={(event) => { onChange(event.target.value); setQuery(""); }} className={field}>
            {!options.some((monster) => monster.id === id) && <option value="">Select a matching monster</option>}
            {options.map((monster) => <option key={monster.id} value={monster.id}>{monster.name}{owned[monster.id]?.gender === gender ? " ✓" : ""}</option>)}
        </select>
    </section>;
}

export function BreedingCalculator() {
    const [maleId, setMaleId] = useState("runegolem");
    const [femaleId, setFemaleId] = useState("dumplorer");
    const [superBreed, setSuperBreed] = useState(false);
    const [attempts, setAttempts] = useState(1);
    const [selectedSkill, setSelectedSkill] = useState("");
    const [owned, setOwned] = useState<Record<string, TrackerEntry>>({});
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed: unknown = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    const saved = parsed as Record<string, unknown>;
                    if (typeof saved.maleId === "string" && eligible.some((m) => m.id === saved.maleId)) setMaleId(saved.maleId);
                    if (typeof saved.femaleId === "string" && eligible.some((m) => m.id === saved.femaleId)) setFemaleId(saved.femaleId);
                    if (typeof saved.superBreed === "boolean") setSuperBreed(saved.superBreed);
                    if (typeof saved.attempts === "number" && Number.isFinite(saved.attempts)) setAttempts(Math.max(1, Math.min(10000, Math.floor(saved.attempts))));
                }
            }
            const index = JSON.parse(window.localStorage.getItem(INDEX_KEY) ?? "{}");
            if (index && typeof index === "object" && !Array.isArray(index)) setOwned(index as Record<string, TrackerEntry>);
        } catch { /* Invalid local data should not block the calculator. */ }
        setLoaded(true);
    }, []);
    useEffect(() => {
        if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ maleId, femaleId, superBreed, attempts }));
    }, [maleId, femaleId, superBreed, attempts, loaded]);
    const male = useMemo(() => eligible.find((monster) => monster.id === maleId), [maleId]);
    const female = useMemo(() => eligible.find((monster) => monster.id === femaleId), [femaleId]);
    const result = useMemo(() => male && female ? calculateSkillTransfer(male, female) : null, [male, female]);
    const skills = male?.skillIds.map((skillId) => getSkill(skillId)).filter((skill): skill is NonNullable<typeof skill> => skill !== null) ?? [];
    const chosenSkill = skills.find((skill) => skill.id === selectedSkill) ?? skills[0];
    const chance = result ? (superBreed ? result.superChance : result.genesisChance) : null;
    const percent = (value: number) => `${value.toFixed(2)}%`;
    const traitPercent = (value: number) => `${displayTransferChance(value).toFixed(2)}%`;
    return <main className={`${TOOL_PAGE_CONTAINER} min-h-[75vh] space-y-4 pb-12`}>
        <PageHeading title="Breeding Calculator" image="/icons/breed-attack.png" aside="Player-tested skill transfer model · October 2026">
            Choose the male skill donor and the female target to predict Genesis Fruit and Super Breed transfer chances.
        </PageHeading>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,0.95fr)]">
            <MonsterPicker id={maleId} onChange={(id) => { setMaleId(id); setSelectedSkill(""); }} gender="male" title="Skill donor · Parent 1" owned={owned} />
            <MonsterPicker id={femaleId} onChange={setFemaleId} gender="female" title="Target · Parent 2" owned={owned} />
            <section className={`${panel} flex flex-col`}>
                <h2 className="text-base font-black text-white">Skill transfer chance</h2>
                <p className="mt-1 text-xs text-[#a6bfd9]">The chance shown is for the selected donor skill.</p>
                <div className="mt-4 rounded-xl border border-[#36668d] bg-[#08283f] p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#9bcee9]">{superBreed ? "Super Breed" : "Genesis Fruit"}</p>
                    <p className="my-1 text-5xl font-black tabular-nums text-white">{chance !== null ? traitPercent(chance) : "N/A"}</p>
                    <p className="text-xs text-[#9fc0d8]">Per breeding attempt · {superBreed ? "50%" : "25%"} maximum</p>
                </div>
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-[#33506c] bg-[#0a1b2e] p-3">
                    <input type="checkbox" checked={superBreed} onChange={(event) => setSuperBreed(event.target.checked)} className="size-5 accent-[#4aaaff]" />
                    <span className="text-sm font-bold text-white">Super Breed <span className="block text-xs font-normal text-[#9eb9d2]">Double the Genesis chance (up to 50%)</span></span>
                </label>
                <label htmlFor="breed-attempts" className="mt-4 text-xs font-bold text-[#b8d3ef]">Planned attempts</label>
                <input id="breed-attempts" type="number" min="1" max="10000" value={attempts} onChange={(event) => setAttempts(Math.min(10000, Math.max(1, Math.floor(Number(event.target.value) || 1))))} className={`${field} mt-1`} />
                <p className="mt-3 text-sm text-[#b9d3ed]">Chance of at least one transfer: <strong className="text-white">{chance !== null ? percent(atLeastOneSuccess(chance, attempts)) : "N/A"}</strong></p>
                <p className="mt-2 text-xs text-[#839eb9]">Assumes independent attempts with unchanged parents and probability.</p>
            </section>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <section className={panel}>
                <h2 className="text-lg font-black text-white">Donor skill</h2>
                <p className="mb-3 text-xs text-[#a6bfd9]">Choose which skill you want to transfer from the male parent.</p>
                {skills.length ? <><select aria-label="Donor skill" className={field} value={chosenSkill?.id ?? ""} onChange={(event) => setSelectedSkill(event.target.value)}>
                    {skills.map((skill) => <option key={skill.id} value={skill.id}>{getSkillDisplayName(skill.name)}</option>)}
                </select>{chosenSkill && <div className="mt-3 rounded-lg border border-[#2e4b67] bg-[#071829] p-3">
                    <p className="font-bold text-white">{getSkillDisplayName(chosenSkill.name)}</p>
                    <p className="mt-1 text-sm text-[#a9c2d9]">{chosenSkill.description ?? "Skill description unavailable."}</p>
                </div>}</> : <p className="text-sm text-amber-200">This donor has no recorded transferable skills.</p>}
                <p className="mt-3 text-xs text-[#8ba8c2]">Skill-specific restrictions or inheritance rules beyond the measured chance model are not assumed here.</p>
            </section>
            <section className={panel}>
                <h2 className="text-lg font-black text-white">Transfer power breakdown</h2>
                {result ? <div className="mt-3 space-y-3 text-sm">
                    <div className="flex justify-between gap-3 border-b border-[#294761] pb-2"><span className="text-[#afc6dd]">Male donor Transfer Power</span><strong className="tabular-nums text-white">{result.sourcePower.toLocaleString("en-US", { maximumSignificantDigits: 5, notation: result.sourcePower < 0.01 || result.sourcePower >= 1e7 ? "scientific" : "standard" })}</strong></div>
                    <div className="flex justify-between gap-3 border-b border-[#294761] pb-2"><span className="text-[#afc6dd]">Female target Transfer Power</span><strong className="tabular-nums text-white">{result.targetPower.toLocaleString("en-US", { maximumSignificantDigits: 5, notation: result.targetPower < 0.01 || result.targetPower >= 1e7 ? "scientific" : "standard" })}</strong></div>
                    <div className="flex justify-between gap-3 border-b border-[#294761] pb-2"><span className="text-[#afc6dd]">Target / donor ratio</span><strong className="tabular-nums text-white">{result.ratio.toFixed(4)}×</strong></div>
                    <div className="flex justify-between gap-3 border-b border-[#294761] pb-2"><span className="text-[#afc6dd]">Genesis transfer</span><strong className="tabular-nums text-sky-300">{traitPercent(result.genesisChance)}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-[#afc6dd]">Super Breed transfer</span><strong className="tabular-nums text-rose-300">{traitPercent(result.superChance)}</strong></div>
                </div> : <p className="mt-3 text-sm text-amber-200">Missing valid PvE/PvP base-stat data. Transfer chance cannot be determined for this pair.</p>}
                <div className="mt-4 rounded-lg border border-[#294761] bg-[#06182a] p-3 text-xs leading-relaxed text-[#a8c2dd]">
                    <p>Base factor = √[(PvE Damage / PvP Damage) × (PvE Health / PvP Health)]. Evolved monsters receive a 2.1984× modifier (2.2× for Gravitas). Transfer Power = effective factor ^ (0.7 / ln(1.45)).</p>
                    <p className="mt-2">Dumplorer and Gravitas receive an additional 1.25× modifier (2.748× and 2.75× total, respectively). These modifiers are empirical fits.</p>
                    <p className="mt-2">Genesis % = min(25, 25 × exp(0.7) × donor Transfer Power / target Transfer Power). Super Breed doubles the full-precision Genesis percentage, up to 50%; displayed trait rates are truncated to two decimals.</p>
                </div>
            </section>
        </div>
        <p className="text-xs text-[#8ca8c1]">This is a probability calculator, not a live breeding action. Parent genders are informational and read from your local Index Tracker where available. Breeding-locked monsters are excluded.</p>
    </main>;
}
