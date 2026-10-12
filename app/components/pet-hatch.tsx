"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { GENERATED_MONSTERS } from "../data/generated/monsters";
import { getMonsterExclusiveTraits, getTrait, TRAITS } from "../data/traits";
import { assetPath } from "../lib/asset-path";
import { hasFixedBreeding } from "../lib/breeding-limits";
import { MUTATIONS, averageBreeds, displayedTraitRates, getBreedingTraits, mutationTransfer, rankTransfer, traitTransfer, type BreedRank, type Mutation, type MutationState } from "../lib/breed-transfer";
import { TraitSelect } from "./trait-select";
import { TraitTransferHelp } from "./trait-transfer-help";
import styles from "./pet-hatch.module.css";

const available = [...GENERATED_MONSTERS].filter(m => !hasFixedBreeding(m.id)).sort((a, b) => a.name.localeCompare(b.name));
const mutationOrder: Mutation[] = ["Huge", "Shiny", "Bloodlit", "Fairy"];
const nextMutation: Record<MutationState, MutationState> = { none: "normal", normal: "x", x: "none" };
const rankVisuals: Record<"A" | BreedRank, { color: string; background: string; gradient?: string }> = {
    A: { color: "#ffad0a", background: "rgba(255,173,10,.14)" },
    S: { color: "#67e879", background: "rgba(74,201,126,.13)", gradient: "linear-gradient(100deg,#ff4545 4%,#ffd83d 25%,#43e86e 45%,#31cbea 65%,#8e62ff 82%,#ff58a8 100%)" },
    SS: { color: "#ff5a62", background: "rgba(255,90,98,.14)" },
};

type Parent = { monsterId: string; rank: BreedRank; traitId: string | null; mutations: Record<Mutation, MutationState> };
const initial = (monsterId: string): Parent => ({ monsterId, rank: "S", traitId: getBreedingTraits(monsterId).some(trait => trait.id === "impair-4") ? "impair-4" : null, mutations: { Shiny: "normal", Bloodlit: "none", Fairy: "none", Huge: "none" } });

function DnaIcon() { return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M8 2c0 14 16 14 16 28M24 2c0 14-16 14-16 28M9 5h14M12 10h8M12 22h8M9 27h14" /></svg>; }
function EggIcon() { return <svg viewBox="0 0 32 40" aria-hidden="true"><path d="M16 2C9 2 2 19 2 27a14 12 0 0 0 28 0C30 19 23 2 16 2Z" fill="#9de5ff" stroke="#42bded" strokeWidth="2"/><path d="m5 18 8-5 6 6-8 6Zm11 10 8-5 4 6-6 7Z" fill="#a79aff"/><path d="m12 3 4 9 7-1M4 29l7 5" fill="none" stroke="#fff0a0" strokeWidth="4"/></svg>; }
function SuperBreedIcon() { return <svg viewBox="0 0 32 40" aria-hidden="true"><path d="M16 2C9 2 2 19 2 27a14 12 0 0 0 28 0C30 19 23 2 16 2Z" fill="#713f0b" stroke="#ffc94d" strokeWidth="2"/><path d="m16 10 3.5 9 8.5 3-8.5 3L16 34l-3.5-9L4 22l8.5-3Z" fill="#ffdf7a" stroke="#ffeac0" strokeWidth="1"/></svg>; }
function BreedBadge({ superBreed }: { superBreed: boolean }) { return <span className={`${styles.badge} ${superBreed ? styles.superBadge : ""}`}>{superBreed ? <SuperBreedIcon /> : <EggIcon />}{superBreed ? "Super Breed" : "Normal Breed"}</span>; }
function GeneticRange({ superBreed, label }: { superBreed: boolean; label: string }) {
    const heights = superBreed ? [10, 10, 11, 11, 12, 12, 13, 13, 14, 15, 16, 17, 19, 22, 25, 30, 48, 58] : Array<number>(18).fill(28);
    return <div className={styles.geneticDistribution}>
        <svg viewBox="0 0 360 78" preserveAspectRatio="none" role="img" aria-label={`${label}: 6–60%. ${superBreed ? "Illustrative higher probability toward 54–60%; exact distribution unknown." : "Uniform visual across the range."}`}>
            {superBreed && <rect x="320" y="0" width="40" height="76" rx="4" fill="#ffca4820" />}
            {heights.map((height, index) => <rect key={index} x={index * 20 + 2} y={68 - height} width="16" height={height} rx="3" fill={superBreed ? index >= 16 ? "#ffd164" : "#78dcae" : "#45bbec"} opacity={superBreed && index < 16 ? .75 : 1} />)}
            <path d="M0 72H360" stroke="#36536b" />
        </svg>
        <div className={styles.distributionLabels}><b>6%</b>{superBreed && <span className={styles.highRange}>54–60%</span>}<b>60%</b></div>
    </div>;
}
function MutationIcon({ mutation, x = false }: { mutation: Mutation; x?: boolean }) { return <img className={styles.mutationIcon} src={assetPath(`/icons/${x ? `${mutation.toLowerCase()}-x` : mutation}.png`)} alt="" />; }
function Help({ label, text }: { label: string; text: string }) {
    const id = useId();
    const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
    const show = (button: HTMLButtonElement) => {
        const rect = button.getBoundingClientRect();
        setPosition({ left: Math.max(12, Math.min(rect.left - 130, window.innerWidth - 292)), top: Math.min(rect.bottom + 8, window.innerHeight - 180) });
    };
    return <><button type="button" className={styles.helpButton} aria-label={label} aria-describedby={position ? id : undefined} onMouseEnter={event => show(event.currentTarget)} onMouseLeave={() => setPosition(null)} onFocus={event => show(event.currentTarget)} onBlur={() => setPosition(null)} onClick={event => show(event.currentTarget)} onKeyDown={event => { if (event.key === "Escape") setPosition(null); }}>?</button>{position && createPortal(<span id={id} role="tooltip" className={styles.helpTooltip} style={position}>{text}</span>, document.body)}</>;
}
function rankTextStyle(rank: "A" | BreedRank): CSSProperties {
    const visual = rankVisuals[rank];
    return visual.gradient ? { backgroundImage: visual.gradient, backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", textShadow: "none", display: "inline-block", filter: "drop-shadow(0 1px 0 #061725)" } : { color: visual.color };
}

export function PetHatch() {
    const [parents, setParents] = useState<[Parent, Parent]>([initial("runegolem"), initial("violetaegis")]);
    const [superBreed, setSuperBreed] = useState(false);
    const [monsterPicker, setMonsterPicker] = useState<0 | 1 | null>(null);
    const [rankPicker, setRankPicker] = useState<0 | 1 | null>(null);
    const [monsterSearch, setMonsterSearch] = useState("");
    const [exclusiveTraitFilter, setExclusiveTraitFilter] = useState("all");
    const [visibleMonsterCount, setVisibleMonsterCount] = useState(24);
    const [showFormula, setShowFormula] = useState(false);
    const monsters = parents.map(parent => available.find(monster => monster.id === parent.monsterId)!);
    const filteredMonsters = useMemo(() => available.filter(monster => {
        const exclusive = getMonsterExclusiveTraits(monster.id);
        const query = monsterSearch.trim().toLowerCase();
        if (!monster.name.toLowerCase().includes(query) && !exclusive.some(trait => trait.name.toLowerCase().includes(query))) return false;
        if (exclusiveTraitFilter === "has") return exclusive.length > 0;
        if (exclusiveTraitFilter === "none") return exclusive.length === 0;
        return exclusiveTraitFilter === "all" || exclusive.some(trait => trait.id === exclusiveTraitFilter);
    }), [monsterSearch, exclusiveTraitFilter]);
    const update = (index: number, patch: Partial<Parent>) => setParents(current => current.map((parent, i) => {
        if (i !== index) return parent;
        const next = { ...parent, ...patch };
        if (next.traitId && !getBreedingTraits(next.monsterId).some(trait => trait.id === next.traitId)) next.traitId = null;
        return next;
    }) as [Parent, Parent]);
    const rates = [
        traitTransfer(monsters[0], monsters[1], !!parents[0].traitId),
        traitTransfer(monsters[1], monsters[0], !!parents[1].traitId),
    ];
    const rankOutcomes = rankTransfer(parents[0].rank, parents[1].rank, superBreed);
    const rate = (value: number | undefined) => value === undefined ? "Unknown" : `~${value.toFixed(2).replace(/\.00$/, "")}%`;
    const activeTraitRate = (result: ReturnType<typeof traitTransfer>) => {
        if (result === null) return undefined;
        const display = displayedTraitRates(result.normal);
        return superBreed ? display.super : display.normal;
    };

    useEffect(() => {
        if (monsterPicker === null) return;
        const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMonsterPicker(null); };
        document.addEventListener("keydown", close);
        return () => document.removeEventListener("keydown", close);
    }, [monsterPicker]);

    return <main className={styles.page}>
        <header className={styles.hero}>
            <div className={styles.dna}><img src={assetPath("/icons/breed-health.png")} alt="" aria-hidden="true" /></div>
            <div><span className={styles.eyebrow}>BREEDING TOOLS</span><h1>Pet Hatch Transfer</h1><p>See trait, mutation, rank, and genetic transfer odds for the selected parents.</p></div>
        </header>

        <div className={styles.layout}>
            <section className={styles.panel} aria-labelledby="parents-heading">
                <h2 id="parents-heading">Parent Pets <Help label="Parent controls help" text="Click a monster to search and select its replacement. Click its rank to choose S or SS. Mutation icons cycle None → Normal → X → None." /></h2>
                <div className={styles.parents}>
                    {parents.map((parent, index) => {
                        const monster = monsters[index];
                        return <article key={index} className={styles.parent}>
                            <h3>Parent {index + 1}</h3>
                            <div className={styles.portrait} data-rarity={monster.rarity}>
                                <button type="button" className={styles.portraitPicker} aria-label={`Change Parent ${index + 1} monster. Current monster: ${monster.name}`} onClick={() => { setMonsterSearch(""); setExclusiveTraitFilter("all"); setVisibleMonsterCount(24); setMonsterPicker(index as 0 | 1); setRankPicker(null); }} />
                                <button type="button" className={styles.rank} aria-expanded={rankPicker === index} aria-label={`Change Parent ${index + 1} rank. Current rank: ${parent.rank}`} onClick={() => setRankPicker(current => current === index ? null : index as 0 | 1)}><span style={rankTextStyle(parent.rank)}>{parent.rank}</span></button>
                                {rankPicker === index && <div className={styles.rankPicker} role="group" aria-label={`Parent ${index + 1} rank options`}>{(["S", "SS"] as BreedRank[]).map(rank => <button type="button" key={rank} aria-pressed={parent.rank === rank} style={{ color: rankVisuals[rank].color, background: parent.rank === rank ? rankVisuals[rank].background : undefined }} onClick={() => { update(index, { rank }); setRankPicker(null); }}><span style={rankTextStyle(rank)}>{rank}</span></button>)}</div>}
                                <img className={styles.monsterImage} src={assetPath(monster.image ?? "/icon.png")} alt={monster.name} />
                                <div className={styles.cardMutations} role="group" aria-label={`Parent ${index + 1} mutations`}>
                                    {mutationOrder.map(mutation => {
                                        const state = parent.mutations[mutation];
                                        return <button key={mutation} type="button" className={`${styles.mutationButton} ${state === "none" ? styles.mutationOff : styles.mutationOn}`} data-state={state} aria-label={`Parent ${index + 1} ${mutation}: ${state === "x" ? "X" : state === "normal" ? "Normal" : "None"}. Click to cycle.`} title={`${mutation}: ${state === "x" ? "X" : state === "normal" ? "Normal" : "None"}`} onClick={() => update(index, { mutations: { ...parent.mutations, [mutation]: nextMutation[state] } })}><MutationIcon mutation={mutation} x={state === "x"} /></button>;
                                    })}
                                </div>
                            </div>
                            <div className={styles.label}>Trait <Help label={`Parent ${index + 1} trait availability`} text="Exclusive traits appear only for their source monsters. Other traits are available to every parent. Vital Barrier is the exception: it can be selected on any monster. Changing a parent clears a trait that is no longer available." /><TraitSelect compact iconVariant="icon" allowedTraitIds={getBreedingTraits(parent.monsterId).map(trait => trait.id)} value={parent.traitId} onChangeAction={traitId => update(index, { traitId })} /></div>
                        </article>;
                    })}
                    <span className={styles.plus} aria-hidden="true">+</span>
                </div>

                <h2 className={styles.breedHeading}>Breed Type <Help label="Breeding rules" text="Only S and SS ranks can breed. Level and enhancement do not affect this model. Non-breedable Cannelloni dragons and Necro Hydra are excluded." /></h2>
                <div className={styles.breedTypes}>{[false, true].map(isSuper => <button key={String(isSuper)} type="button" aria-pressed={superBreed === isSuper} className={`${styles.breedButton} ${superBreed === isSuper ? styles.selected : ""} ${isSuper ? styles.super : ""}`} onClick={() => setSuperBreed(isSuper)}><span aria-hidden="true">{isSuper ? <SuperBreedIcon /> : <EggIcon />}</span><div><strong>{isSuper ? "Super Breed" : "Normal Breed"}</strong><small>{isSuper ? "Higher trait and mutation odds" : "Standard breeding rates"}</small></div><span className={styles.radio} aria-hidden="true">{superBreed === isSuper ? "●" : "○"}</span></button>)}</div>
            </section>

            <div className={styles.results}>
                <section className={styles.panel} aria-labelledby="trait-heading">
                    <h2 id="trait-heading">Offspring Trait Chance <button type="button" className={styles.helpButton} aria-label="Trait transfer formula" aria-expanded={showFormula} aria-controls="trait-formula-help" onClick={() => setShowFormula(current => !current)}>?</button> <BreedBadge superBreed={superBreed} /></h2>
                    {showFormula && <TraitTransferHelp />}
                    <div className={styles.offspringTraits}>{([0, 1] as const).filter(index => !!parents[index].traitId).map(index => {
                        const other = index === 0 ? 1 : 0;
                        const trait = getTrait(parents[index].traitId);
                        const rawChance = rates[index];
                        const average = rawChance === null ? null : averageBreeds(superBreed ? rawChance.super : rawChance.normal);
                        return <div key={index} className={`${styles.offspringTrait} ${superBreed ? styles.offspringSuper : ""}`}>
                            <div className={styles.traitFlow}>
                                <img src={assetPath(monsters[index].image ?? "/icon.png")} alt={`Trait source: ${monsters[index].name}`} />
                                <div><span className={styles.flowEyebrow}>PARENT {index + 1} · TRAIT INHERITANCE</span><h3>{monsters[index].name} <span aria-hidden="true">→</span> Offspring</h3></div>
                                <Help label={`Parent ${index + 1} inheritance details`} text={`Estimated chance for ${monsters[index].name} to pass ${trait?.name ?? "its trait"} to offspring of ${monsters[other].name}'s species. The receiving species is an input to the formula; this is not the chance of getting that species. Variation is about ±0.3 percentage points.`} />
                            </div>
                            {trait && <img className={styles.offspringTraitBanner} src={assetPath(trait.image)} alt={trait.name} />}
                            <div className={styles.offspringChance} title="Research estimate: about ±0.3 percentage points"><strong>{rate(activeTraitRate(rates[index]))}</strong><span>transfer rate</span></div>
                            {average !== null && <div className={styles.averageBreeds}>≈1 in {average.toLocaleString("en-US", { maximumFractionDigits: 2 })} breeds <Help label={`Parent ${index + 1} average breeds explanation`} text="The estimated average number of independent breeds per successful trait transfer is 100 divided by the percent chance. This is a long-run average for the same pairing and breed type, not a guarantee by that attempt. It uses the unrounded estimate." /></div>}
                        </div>;
                    })}</div>
                    {!parents.some(parent => parent.traitId) && <p className={styles.emptyState}>Select a parent trait to see inheritance chances.</p>}
                </section>

                <section className={styles.panel} aria-labelledby="mutations-heading">
                    <h2 id="mutations-heading"><span className={styles.headingIcon}><DnaIcon /></span> Offspring Mutations <Help label="Mutation transfer explanation" text={superBreed ? "One mutated parent gives a 35% normal-mutation chance; two give 70%. Each X-mutated parent also adds a 10% X-mutation chance. Swapping the parents does not change these rates." : "If either or both parents have the mutation, its normal-mutation transfer chance is 30%. Only mutations with a nonzero transfer chance are shown."} /> <BreedBadge superBreed={superBreed} /></h2>
                    <div className={styles.mutationRows}>{mutationOrder.map(mutation => {
                        const outcome = mutationTransfer(parents[0].mutations[mutation], parents[1].mutations[mutation], superBreed);
                        if (outcome.normal === 0 && outcome.x === 0) return null;
                        return <div key={mutation} className={styles.mutationRow} data-mutation={mutation}>{(["normal", "x"] as const).filter(variant => outcome[variant] > 0).map(variant => <div key={variant} className={styles.mutationResult} data-variant={variant}><MutationIcon mutation={mutation} x={variant === "x"} /><span>{mutation}{variant === "x" ? " X" : ""}</span><strong>{outcome[variant]}%</strong><Help label={`${mutation}${variant === "x" ? " X" : ""} transfer details`} text={variant === "x" ? "Super Breed transfers an X mutation at 10% with one X-mutated parent, or 20% with two." : superBreed ? "Normal or X versions count toward this mutation: 35% with one mutated parent, or 70% with two." : "Normal Breed transfers this mutation at 30% when at least one parent has its Normal or X version."} /></div>)}</div>;
                    })}</div>
                    {MUTATIONS.every(mutation => mutationTransfer(parents[0].mutations[mutation], parents[1].mutations[mutation], superBreed).normal === 0) && <p className={styles.emptyState}>No mutations to transfer.</p>}

                    <h3 className={styles.subheading}>Offspring Rank <Help label="Rank transfer explanation" text={superBreed ? "Super Breed: S + S gives 55.55% S and 44.44% A (rounded rates total 99.99%). S + SS gives 30% SS and 70% S. SS + SS gives 50% SS and 50% S. Parent order does not change the result." : "Normal Breed: S + S gives 40% S and 60% A. S + SS gives 20% SS, 50% S and 30% A. SS + SS gives 60% SS and 40% S. Parent order does not change the result."} /></h3>
                    <div className={styles.rankOutcomes}>{rankOutcomes.map(outcome => <div key={outcome.rank} style={{ borderColor: `${rankVisuals[outcome.rank].color}88`, background: rankVisuals[outcome.rank].background }}><strong style={rankTextStyle(outcome.rank)}>{outcome.rank}</strong><span>{outcome.chance}%</span></div>)}</div>
                </section>

                <section className={styles.panel} aria-labelledby="genetics-heading">
                    <h2 id="genetics-heading">Genetic Potential <Help label="Genetic range explanation" text={superBreed ? "HP and ATK can each roll 6–60%. The rising shape illustrates a bias toward 54–60%; its heights are illustrative, not measured probabilities. Super Breed’s exact distribution is not established." : "HP and ATK can each roll 6–60%. Equal-height bars visualize a uniform chance across the range."} /> <BreedBadge superBreed={superBreed} /></h2>
                    {["HP (Health)", "ATK (Attack)"].map((stat, index) => <div className={styles.geneticsSingle} key={stat}><strong>{index === 0 ? "♥" : "⚔"} {stat}</strong><GeneticRange label={stat} superBreed={superBreed} /></div>)}
                    {superBreed && <span className={styles.distributionCaption}>Illustrative high-end bias</span>}
                </section>
            </div>
        </div>

        {monsterPicker !== null && <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="monster-picker-title" onMouseDown={event => { if (event.target === event.currentTarget) setMonsterPicker(null); }}><section className={styles.monsterModal}>
            <header><div><span className={styles.eyebrow}>PARENT {monsterPicker + 1}</span><h2 id="monster-picker-title">Select a Monster</h2><p>{Math.min(visibleMonsterCount, filteredMonsters.length)} of {filteredMonsters.length} matching monsters</p></div><button type="button" aria-label="Close monster selector" onClick={() => setMonsterPicker(null)}>×</button></header>
            <div className={styles.pickerFilters}>
                <label className={styles.modalSearch}><span>⌕</span><input type="search" value={monsterSearch} onChange={event => { setMonsterSearch(event.target.value); setVisibleMonsterCount(24); }} placeholder="Search monsters or traits" autoFocus /></label>
                <label className={styles.exclusiveFilter}>Exclusive Trait<select aria-label="Exclusive Trait" value={exclusiveTraitFilter} onChange={event => { setExclusiveTraitFilter(event.target.value); setVisibleMonsterCount(24); }}><option value="all">All monsters</option><option value="has">Has exclusive trait</option><option value="none">No exclusive trait</option>{TRAITS.filter(trait => trait.exclusiveSourceIds?.length).map(trait => <option key={trait.id} value={trait.id}>{trait.name}</option>)}</select></label>
            </div>
            <div key={`${monsterSearch}/${exclusiveTraitFilter}`} className={styles.monsterGrid} onScroll={event => { const element = event.currentTarget; if (element.scrollHeight - element.scrollTop - element.clientHeight < 160) setVisibleMonsterCount(count => Math.min(count + 24, filteredMonsters.length)); }}>
                {filteredMonsters.slice(0, visibleMonsterCount).map(monster => <button type="button" key={monster.id} className={parents[monsterPicker].monsterId === monster.id ? styles.monsterSelected : ""} onClick={() => { update(monsterPicker, { monsterId: monster.id }); setMonsterPicker(null); }}><img loading="lazy" decoding="async" src={assetPath(monster.image ?? "/icon.png")} alt="" /><span><strong>{monster.name}</strong><small>{getMonsterExclusiveTraits(monster.id).map(trait => trait.name).join(" · ") || `${monster.rarity} · ${monster.element}`}</small></span>{parents[monsterPicker].monsterId === monster.id && <b>✓</b>}</button>)}
                {visibleMonsterCount < filteredMonsters.length && <button type="button" className={styles.loadMoreMonsters} onClick={() => setVisibleMonsterCount(count => Math.min(count + 24, filteredMonsters.length))}>Load 24 more monsters</button>}
                {filteredMonsters.length === 0 && <p className={styles.emptyState}>No monsters match these filters.</p>}
            </div>
        </section></div>}
    </main>;
}
