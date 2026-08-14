"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import {
    EVOLUTION_STEP,
    MAX_EVOLUTION_PERCENT,
    MIN_EVOLUTION_PERCENT,
    clampEvolutionPercent,
    getEvolutionBarFill,
    getEvolutionMultiplier,
} from "../lib/calculations/evolution";
import type { Build, Mutation, Rank } from "../types/build";
import type { Monster } from "../types/monster";
import {
    getSkill,
    getSkillTotalMultiplier,
} from "../data/skills";
import { ARMORS, WEAPONS, getEquipment } from "../data/equipments";
import { getAttribute, getAttributesForGear } from "../data/attributes";
import { getActiveAttributeIds, getAttributeSlotCount, getFixedAttributeIds } from "../lib/calculations/attributes";

import { CollapsibleSection } from "./collapsible-section";
import { EquipmentSelect } from "./equipment-select";
import { AttributeSelect } from "./attribute-select";
import { Panel } from "./panel";

const mutations: {
    id: Mutation;
    xId: Mutation;
    label: string;
    icon: string;
    effects: string[];
    xIcon: string;
    xEffects: string[];
}[] = [
    {
        id: "huge",
        xId: "huge-x",
        label: "Huge",
        icon: "/icons/Huge.png",
        effects: [
            "+40% Health",
            "+40% Damage",
        ],
        xIcon: "/icons/huge-x.png",
        xEffects: ["+60% Health", "+60% Damage"],
    },
    {
        id: "shiny",
        xId: "shiny-x",
        label: "Shiny",
        icon: "/icons/Shiny.png",
        effects: [
            "+10% Damage",
            "+30% Crit Chance",
        ],
        xIcon: "/icons/shiny-x.png",
        xEffects: ["+25% Damage", "+35% Crit Chance"],
    },
    {
        id: "bloodlit",
        xId: "bloodlit-x",
        label: "Bloodlit",
        icon: "/icons/Bloodlit.png",
        effects: [
            "+10% Crit Chance",
            "+100% Crit Damage",
        ],
        xIcon: "/icons/bloodlit-x.png",
        xEffects: ["+15% Crit Chance", "+145% Crit Damage"],
    },
    {
        id: "fairy",
        xId: "fairy-x",
        label: "Fairy",
        icon: "/icons/Fairy.png",
        effects: [
            "-25% Incoming Damage",
            "-20% Cooldown",
        ],
        xIcon: "/icons/fairy-x.png",
        xEffects: ["-35% Incoming Damage", "-25% Cooldown"],
    },
];

const ranks: Rank[] = ["SS", "S", "A", "B", "C", "D", "E"];

const enhancements = Array.from(
    { length: 11 },
    (_, index) => index,
);

const geneticPotentialValues = [
    0,
    6,
    12,
    18,
    24,
    30,
    36,
    42,
    48,
    54,
    60,
];

type SelectOption = {
    id: string;
    label: string;
};

type SelectFieldProps = {
    label: string;
    options: SelectOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    emptyLabel?: string;
};

function SelectField({
                         label,
                         options,
                         value,
                         onChange,
                         emptyLabel = "Select",
                     }: SelectFieldProps) {
    return (
        <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
        {label}
      </span>

            <select
                value={value ?? ""}
                onChange={(event) =>
                    onChange(event.target.value || null)
                }
                className="w-full rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-sm text-[#d8dee9] outline-none focus:border-[#79e3ae]"
            >
                {emptyLabel && (
                    <option value="">{emptyLabel}</option>
                )}

                {options.map((option, index) => (
                    <option key={`${option.id}-${index}`} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function formatSkillMultiplier(value: number): string {
    return Number(value.toFixed(4)).toString();
}

type EvolutionMultiplierEditorProps = {
    value: number;
    onChange: (value: number) => void;
};

function EvolutionMultiplierEditor({
                                       value,
                                       onChange,
                                   }: EvolutionMultiplierEditorProps) {
    const [inputValue, setInputValue] = useState(
        value.toFixed(2),
    );

    const parsedValue = Number(inputValue);

    const isNumeric =
        inputValue.trim() !== "" &&
        Number.isFinite(parsedValue);

    const isOutOfRange =
        isNumeric &&
        (parsedValue < MIN_EVOLUTION_PERCENT ||
            parsedValue > MAX_EVOLUTION_PERCENT);

    const previewPercent = isNumeric
        ? clampEvolutionPercent(parsedValue)
        : value;

    const evolutionMultiplier =
        getEvolutionMultiplier(previewPercent);

    const evolutionBarFill =
        getEvolutionBarFill(previewPercent);

    const applyValue = () => {
        const normalizedValue = isNumeric
            ? clampEvolutionPercent(parsedValue)
            : value;

        onChange(normalizedValue);
        setInputValue(normalizedValue.toFixed(2));
    };

    const cancelEdit = () => {
        setInputValue(value.toFixed(2));
    };


    return (
        <div className="mt-4 rounded-lg border border-[#ff9f43]/40 bg-[#2a1a0d]/55 p-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#fff3e6]">
                        Evolution Multiplier
                    </p>

                    <p className="mt-0.5 text-xs text-[#c9a27c]">
                        Available only for evolved monsters
                    </p>
                </div>

                <p className="text-sm font-bold text-[#ffad5c]">
                    ×{evolutionMultiplier.toFixed(4)}
                </p>
            </div>

            <div className="mt-3 rounded-lg border-2 border-[#f4d4b3] bg-[#343434] p-1 shadow-inner">
                <div className="relative h-7 overflow-hidden rounded-md bg-[#3a3a3a]">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffd2a3] via-[#ffb160] to-[#ff8a24] transition-[width] duration-150"
                        style={{ width: `${evolutionBarFill}%` }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-black text-white [text-shadow:0_2px_0_#111,1px_0_0_#111,-1px_0_0_#111,0_-1px_0_#111]">
                            EM:{previewPercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
                <label>
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#c9a27c]">
                        Exact EM Percentage
                    </span>

                    <div className="relative">
                        <input
                            type="number"
                            min={MIN_EVOLUTION_PERCENT}
                            max={MAX_EVOLUTION_PERCENT}
                            step={EVOLUTION_STEP}
                            value={inputValue}
                            onChange={(event) =>
                                setInputValue(event.target.value)
                            }
                            onBlur={applyValue}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    applyValue();
                                    event.currentTarget.blur();
                                }

                                if (event.key === "Escape") {
                                    cancelEdit();
                                    event.currentTarget.blur();
                                }
                            }}
                            aria-invalid={!isNumeric || isOutOfRange}
                            className={`w-full rounded-md border bg-[#17120e] px-3 py-2 pr-8 text-sm text-[#fff3e6] outline-none ${
                                !isNumeric || isOutOfRange
                                    ? "border-[#ff7657] focus:border-[#ff7657]"
                                    : "border-[#6f4a2d] focus:border-[#ff9f43]"
                            }`}
                        />

                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#c9a27c]">
                            %
                        </span>
                    </div>
                </label>

                <button
                    type="button"
                    onClick={applyValue}
                    className="rounded-md border border-[#6f4a2d] bg-[#24170e] px-3 py-2 text-xs font-semibold text-[#ffad5c] hover:border-[#ff9f43]"
                >
                    Apply
                </button>
            </div>

            {(!isNumeric || isOutOfRange) && (
                <p className="mt-2 text-xs text-[#ff9a7f]">
                    {!isNumeric
                        ? "Enter a valid number."
                        : `The applied value will be clamped to ${MIN_EVOLUTION_PERCENT.toFixed(2)}%–${MAX_EVOLUTION_PERCENT.toFixed(2)}%.`}
                </p>
            )}

            <div className="mt-2 flex justify-between text-[10px] font-semibold text-[#9d7958]">
                <span>100.00%</span>
                <span>220.00%</span>
            </div>
        </div>
    );
}

type BuildEditorProps = {
    monster: Monster | null;
    build: Build;
    onBuildChangeAction: Dispatch<SetStateAction<Build>>;
    onResetAction: () => void;
};

export function BuildEditor({
                                monster,
                                build,
                                onBuildChangeAction,
                                onResetAction,
                            }: BuildEditorProps) {
    const update = <K extends keyof Build>(
        key: K,
        value: Build[K],
    ) => {
        onBuildChangeAction((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const cycleMutation = (mutation: (typeof mutations)[number]) => {
        const withoutMutation = build.mutations.filter(
            (value) => value !== mutation.id && value !== mutation.xId,
        );

        if (build.mutations.includes(mutation.xId)) {
            update("mutations", withoutMutation);
        } else if (build.mutations.includes(mutation.id)) {
            update("mutations", [...withoutMutation, mutation.xId]);
        } else {
            update("mutations", [...withoutMutation, mutation.id]);
        }
    };

    const selectedSkill = getSkill(build.selectedSkillId);
    const selectedWeapon = getEquipment(build.weaponId);
    const selectedArmor = getEquipment(build.armorId);
    const hasHpConditionalAttribute = getActiveAttributeIds(build)
        .map(getAttribute)
        .some((attribute) => Boolean(attribute?.hpCondition));

    const updateAttribute = (
        key: "weaponAttributeIds" | "armorAttributeIds",
        index: number,
        value: string | null,
    ) => {
        const next = [...build[key]];
        if (value) next[index] = value;
        else next.splice(index, 1);
        update(key, next.filter(Boolean));
    };

    const updateLevel = (value: string) => {
        const level = Number(value);

        if (
            Number.isInteger(level) &&
            level >= 1 &&
            level <= 100
        ) {
            update("level", level);
        }
    };

    const geneticPotentialOptions =
        geneticPotentialValues.map((value) => ({
            id: String(value),
            label: value === 0 ? "None" : `+${value}%`,
        }));



    return (
        <Panel
            eyebrow="Step 2"
            title="Build Editor"
            action={
                <button
                    type="button"
                    onClick={onResetAction}
                    className="text-xs font-medium text-[#99a2b3]"
                >
                    Reset
                </button>
            }
        >
            <div className="flex flex-1 flex-col gap-2 overflow-auto p-3">
                {!monster && (
                    <div className="rounded-lg border border-dashed border-[#303848] bg-[#0d1017]/45 p-4 text-center">
                        <p className="text-sm font-medium text-[#d8dee9]">
                            No monster selected
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#788295]">
                            Pick a monster from the browser to begin editing
                            its build.
                        </p>
                    </div>
                )}

                <CollapsibleSection title="Pet">
                    <div className="grid grid-cols-2 gap-2">
                        <label>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                Level
              </span>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                value={build.level}
                                onChange={(event) =>
                                    updateLevel(event.target.value)
                                }
                                className="w-full rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-sm text-[#d8dee9]"
                            />
                        </label>

                        <SelectField
                            label="Rank"
                            value={build.rank}
                            onChange={(value) =>
                                update("rank", value as Rank | null)
                            }
                            options={ranks.map((rank) => ({
                                id: rank,
                                label: rank,
                            }))}
                            emptyLabel=""
                        />

                        <SelectField
                            label="Enhancement"
                            value={String(build.enhancement)}
                            onChange={(value) =>
                                update(
                                    "enhancement",
                                    Number(value ?? 0),
                                )
                            }
                            options={enhancements.map((value) => ({
                                id: String(value),
                                label: `+${value}`,
                            }))}
                        />
                    </div>

                    <div className="mt-3 rounded-lg border border-[#303848] bg-[#11141c] p-3">
                        <div className="mb-3 flex items-center gap-3">
                            <img
                                src="/icons/genetic-potential.png"
                                alt="Genetic Potential"
                                className="size-9 shrink-0 object-contain"
                            />

                            <div>
                                <p className="text-sm font-semibold text-[#e8ebf0]">
                                    Genetic Potential
                                </p>

                                <p className="text-xs text-[#788295]">
                                    Separate bonuses for Health and Damage
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <SelectField
                                label="Health GP"
                                value={String(
                                    build.healthGeneticPotential,
                                )}
                                onChange={(value) =>
                                    update(
                                        "healthGeneticPotential",
                                        Number(value ?? 0),
                                    )
                                }
                                options={geneticPotentialOptions}
                                emptyLabel=""
                            />

                            <SelectField
                                label="Damage GP"
                                value={String(
                                    build.damageGeneticPotential,
                                )}
                                onChange={(value) =>
                                    update(
                                        "damageGeneticPotential",
                                        Number(value ?? 0),
                                    )
                                }
                                options={geneticPotentialOptions}
                                emptyLabel=""
                            />
                        </div>
                    </div>

                    {monster?.isEvolved && (
                        <EvolutionMultiplierEditor
                            key={`${monster.id}-${build.evolutionPercent}`}
                            value={build.evolutionPercent}
                            onChange={(value) =>
                                update("evolutionPercent", value)
                            }
                        />
                    )}
                </CollapsibleSection>

                <CollapsibleSection title="Mutations">
                    <div className="flex flex-wrap gap-2">
                        {mutations.map((mutation) => {
                            const isX = build.mutations.includes(mutation.xId);
                            const isSelected = isX || build.mutations.includes(mutation.id);
                            const label = isX ? `${mutation.label} X` : mutation.label;

                            return (
                                <button
                                    key={mutation.id}
                                    type="button"
                                    onClick={() => cycleMutation(mutation)}
                                    aria-pressed={isSelected}
                                    aria-label={`${label}. Click to ${isX ? "remove" : isSelected ? `upgrade to ${mutation.label} X` : "select"}.`}
                                    title={`${label} · Click to ${isX ? "remove" : isSelected ? "upgrade" : "select"}`}
                                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-md border transition ${
                                        isSelected
                                            ? "border-[#79e3ae] bg-[#173126] shadow-[0_0_12px_rgba(121,227,174,0.18)]"
                                            : "border-[#303848] bg-[#171b25] hover:border-[#4a5568] hover:bg-[#1b202b]"
                                    }`}
                                >
                                    <img
                                        src={isX ? mutation.xIcon : mutation.icon}
                                        alt={label}
                                        className="size-10 object-contain"
                                    />

                                    {isSelected && (
                                        <span
                                            className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#79e3ae] text-[9px] font-black text-[#0b1510]">
                            ✓
                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 border-t border-[#252c38] pt-2">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                            Selected Effects
                        </p>

                        {build.mutations.length === 0 ? (
                            <p className="text-xs text-[#788295]">
                                No mutations selected.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-1.5">
                                {mutations
                                    .filter((mutation) =>
                                        build.mutations.includes(mutation.id) ||
                                        build.mutations.includes(mutation.xId),
                                    )
                                    .map((mutation) => {
                                        const isX = build.mutations.includes(mutation.xId);
                                        const label = isX ? `${mutation.label} X` : mutation.label;
                                        const icon = isX ? mutation.xIcon : mutation.icon;
                                        const effects = isX ? mutation.xEffects : mutation.effects;
                                        return (
                                            <div
                                                key={mutation.id}
                                                className="flex min-w-0 items-center gap-2 rounded-md border border-[#252c38] bg-[#11141c] p-2"
                                            >
                                                <img
                                                    src={icon}
                                                    alt=""
                                                    className="size-7 shrink-0 object-contain"
                                                />

                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-[#e8ebf0]">
                                                        {label}
                                                    </p>

                                                    <p className="mt-0.5 truncate text-[9px] text-[#788295]" title={effects.join(" · ")}>
                                                        {effects.join(" · ")}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Skill">
                    <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
                        <SelectField
                            label="Skill"
                            value={build.selectedSkillId}
                            onChange={(value) =>
                                update(
                                    "selectedSkillId",
                                    value as Build["selectedSkillId"],
                                )
                            }
                            options={
                                monster?.skillIds
                                    .map(getSkill)
                                    .filter(
                                        (skill): skill is NonNullable<typeof skill> =>
                                            skill !== null,
                                    )
                                    .map((skill) => ({
                                        id: skill.id,
                                        label: skill.name,
                                    })) ?? []
                            }
                            emptyLabel=""
                        />

                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                                Multiplier
                            </span>
                            <input
                                readOnly
                                value={
                                    selectedSkill
                                        ? `${formatSkillMultiplier(
                                            getSkillTotalMultiplier(selectedSkill),
                                        )}×`
                                        : "—"
                                }
                                className="w-full rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-sm text-[#788295]"
                            />
                        </label>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title={
                        <span className="flex items-center gap-2">
                            <span>Equipment</span>
                            <span className="group/help relative" onClick={(event) => event.stopPropagation()}>
                                <span
                                    tabIndex={0}
                                    role="button"
                                    aria-label="How equipment and attributes work"
                                    className="grid size-5 place-items-center rounded-full border border-[#4b566a] bg-[#171b25] text-[11px] font-black text-[#99a2b3] outline-none transition hover:border-[#79e3ae] hover:text-[#79e3ae] focus:border-[#79e3ae] focus:text-[#79e3ae]"
                                >
                                    ?
                                </span>
                                <span
                                    role="tooltip"
                                    className="pointer-events-none absolute bottom-full left-1/2 z-[70] mb-2 w-64 -translate-x-1/2 translate-y-1 rounded-lg border border-[#303848] bg-[#11141c] p-3 text-left text-xs font-normal leading-5 text-[#b8c0ce] opacity-0 shadow-2xl transition group-hover/help:translate-y-0 group-hover/help:opacity-100 group-focus-within/help:translate-y-0 group-focus-within/help:opacity-100"
                                >
                                    <strong className="block font-semibold text-[#e8ebf0]">Equipment &amp; Attributes</strong>
                                    <span className="mt-1 block">Weapons increase Damage. Armor increases Health. Attributes affect skills and combat outcomes rather than base stats.</span>
                                </span>
                            </span>
                        </span>
                    }
                >
                    <div className="grid grid-cols-2 gap-2">
                        <EquipmentSelect
                            label="Weapon"
                            value={build.weaponId}
                            onChange={(value) => {
                                update("weaponId", value);
                                update("weaponAttributeIds", []);
                            }}
                            items={WEAPONS}
                        />

                        <EquipmentSelect
                            label="Armor"
                            value={build.armorId}
                            onChange={(value) => {
                                update("armorId", value);
                                update("armorAttributeIds", []);
                            }}
                            items={ARMORS}
                        />
                    </div>

                    <div
                        className="mt-3 grid items-start gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
                        {[{
                            equipment: selectedWeapon,
                            type: "weapon" as const,
                            key: "weaponAttributeIds" as const
                        }, {
                            equipment: selectedArmor,
                            type: "armor" as const,
                            key: "armorAttributeIds" as const
                        }].map(({equipment, type, key}) => {
                            const slots = getAttributeSlotCount(equipment?.rarity);
                            const fixedIds = getFixedAttributeIds(equipment?.id ?? null);
                            const selectedIds = build[key];
                            return (
                                <div key={type}
                                     className="self-start space-y-2 rounded-md border border-[#252c38] bg-[#11141c] p-2">
                                    <p className="text-xs font-semibold text-[#e8ebf0]">{type === "weapon" ? "Weapon" : "Armor"} Attributes</p>
                                    {fixedIds.map((id) => {
                                        const attribute = getAttribute(id);
                                        return attribute ? (
                                            <div key={id}
                                                 className="relative grid min-h-[72px] w-full place-items-center overflow-hidden rounded-md border border-[#ff9f43]/50 bg-[#0d1017] p-1">
                                                <img src={`/attributes/${id}.png`} alt={attribute.name}
                                                     className="block h-auto w-full"/>
                                                <span
                                                    className="absolute right-1.5 top-1.5 rounded bg-[#2a1a0d]/90 px-1.5 py-0.5 text-[9px] font-semibold text-[#ffb866]">FIXED</span>
                                            </div>
                                        ) : null;
                                    })}
                                    {Array.from({length: slots}, (_, index) => (
                                        <AttributeSelect
                                            key={index}
                                            label={`Slot ${index + 1}`}
                                            options={getAttributesForGear(type)}
                                            value={selectedIds[index] ?? null}
                                            usedIds={selectedIds}
                                            onChange={(value) => updateAttribute(key, index, value)}
                                        />
                                    ))}
                                    {!equipment && <p className="text-[10px] text-[#788295]">Select gear first.</p>}
                                    {equipment && slots === 0 && fixedIds.length === 0 &&
                                        <p className="text-[10px] text-[#788295]">Attributes require Legendary gear or
                                            higher.</p>}
                                </div>
                            );
                        })}
                    </div>

                    {hasHpConditionalAttribute && (
                        <label className="mt-3 block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">Current HP for conditional attributes</span>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="100" value={build.currentHpPercent} onChange={(event) => update("currentHpPercent", Number(event.target.value))} className="min-w-0 flex-1 accent-[#79e3ae]" />
                                <span className="w-12 text-right text-sm font-semibold text-[#d8dee9]">{build.currentHpPercent}%</span>
                            </div>
                        </label>
                    )}

                </CollapsibleSection>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    {[
                        "Save Build",
                        "Load Build",
                        "Compare Builds",
                    ].map((item, index) => (
                        <button
                            key={item}
                            type="button"
                            className={`rounded-md px-3 py-2 text-xs font-semibold ${
                                index === 0
                                    ? "bg-[#79e3ae] font-bold text-[#0b1510]"
                                    : "border border-[#303848] bg-[#171b25] text-[#d8dee9]"
                            }`}
                        >
                            {item}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={onResetAction}
                        className="rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-xs font-semibold text-[#d8dee9]"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </Panel>
    );
}