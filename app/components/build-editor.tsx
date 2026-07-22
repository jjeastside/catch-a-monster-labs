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

import { CollapsibleSection } from "./collapsible-section";
import { Panel } from "./panel";

const mutations: {
    id: Mutation;
    label: string;
    icon: string;
    effects: string[];
}[] = [
    {
        id: "huge",
        label: "Huge",
        icon: "/icons/Huge.png",
        effects: [
            "+40% Health",
            "+40% Damage",
        ],
    },
    {
        id: "shiny",
        label: "Shiny",
        icon: "/icons/Shiny.png",
        effects: [
            "+10% Damage",
            "+30% Crit Chance",
        ],
    },
    {
        id: "bloodlit",
        label: "Bloodlit",
        icon: "/icons/Bloodlit.png",
        effects: [
            "+10% Crit Chance",
            "+100% Crit Damage",
        ],
    },
    {
        id: "fairy",
        label: "Fairy",
        icon: "/icons/Fairy.png",
        effects: [
            "Effects coming soon",
        ],
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

                {options.map((option) => (
                    <option key={option.id} value={option.id}>
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

    const toggleMutation = (mutation: Mutation) => {
        update(
            "mutations",
            build.mutations.includes(mutation)
                ? build.mutations.filter(
                    (value) => value !== mutation,
                )
                : [...build.mutations, mutation],
        );
    };

    const updateAccount = (
        key: keyof Build["accountMultipliers"],
        value: boolean,
    ) => {
        onBuildChangeAction((current) => ({
            ...current,
            accountMultipliers: {
                ...current.accountMultipliers,
                [key]: value,
            },
        }));
    };

    const selectedSkill = getSkill(build.selectedSkillId);

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
            <div className="flex flex-1 flex-col gap-3 overflow-auto p-5">
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
                    <div className="grid grid-cols-2 gap-3">
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

                    <div className="mt-4 rounded-lg border border-[#303848] bg-[#11141c] p-3">
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

                        <div className="grid grid-cols-2 gap-3">
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
                                emptyLabel="None"
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
                                emptyLabel="None"
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
                            const isSelected =
                                build.mutations.includes(mutation.id);

                            return (
                                <button
                                    key={mutation.id}
                                    type="button"
                                    onClick={() =>
                                        toggleMutation(mutation.id)
                                    }
                                    aria-pressed={isSelected}
                                    title={mutation.label}
                                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md border transition ${
                                        isSelected
                                            ? "border-[#79e3ae] bg-[#173126] shadow-[0_0_12px_rgba(121,227,174,0.18)]"
                                            : "border-[#303848] bg-[#171b25] hover:border-[#4a5568] hover:bg-[#1b202b]"
                                    }`}
                                >
                                    <img
                                        src={mutation.icon}
                                        alt={mutation.label}
                                        className="size-11 object-contain"
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

                    <div className="mt-4 border-t border-[#252c38] pt-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                            Selected Effects
                        </p>

                        {build.mutations.length === 0 ? (
                            <p className="text-xs text-[#788295]">
                                No mutations selected.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {mutations
                                    .filter((mutation) =>
                                        build.mutations.includes(mutation.id),
                                    )
                                    .map((mutation) => (
                                        <div
                                            key={mutation.id}
                                            className="flex items-start gap-2 rounded-md border border-[#252c38] bg-[#11141c] p-2"
                                        >
                                            <img
                                                src={mutation.icon}
                                                alt=""
                                                className="size-8 shrink-0 object-contain"
                                            />

                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-[#e8ebf0]">
                                                    {mutation.label}
                                                </p>

                                                <div className="mt-1 space-y-0.5">
                                                    {mutation.effects.map((effect) => (
                                                        <p
                                                            key={effect}
                                                            className="text-[10px] leading-4 text-[#788295]"
                                                        >
                                                            • {effect}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Skill">
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

                    <label className="mt-3 block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
              Multiplier Preview
            </span>

                        <input
                            readOnly
                            value={
                                selectedSkill
                                    ? `${formatSkillMultiplier(
                                        getSkillTotalMultiplier(selectedSkill),
                                    )}×`
                                    : "Select a skill"
                            }
                            className="w-full rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-sm text-[#788295]"
                        />
                    </label>
                </CollapsibleSection>

                <CollapsibleSection title="Equipment">
                    <div className="grid grid-cols-2 gap-3">
                        <SelectField
                            label="Paw"
                            value={build.pawId}
                            onChange={(value) =>
                                update("pawId", value)
                            }
                            options={[
                                { id: "paw-1", label: "Paw 1" },
                                { id: "paw-2", label: "Paw 2" },
                            ]}
                            emptyLabel="None"
                        />

                        <SelectField
                            label="Ring"
                            value={build.ringId}
                            onChange={(value) =>
                                update("ringId", value)
                            }
                            options={[
                                { id: "ring-1", label: "Ring 1" },
                                { id: "ring-2", label: "Ring 2" },
                            ]}
                            emptyLabel="None"
                        />
                    </div>

                    <div className="mt-3 rounded-md border border-dashed border-[#303848] p-3 text-xs text-[#788295]">
                        Gear Attributes placeholder
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Account Multipliers"
                    description="Settings saved across all pets"
                >
                    <div className="space-y-2">
                        {[
                            {
                                id: "indexMania",
                                label: "Index Mania",
                            },
                            {
                                id: "petQuestAchievement",
                                label: "Pet Quest Achievement",
                            },
                            {
                                id: "pathOfProgress",
                                label: "Path of Progress",
                            },
                        ].map((account) => {
                            const accountId =
                                account.id as keyof Build["accountMultipliers"];

                            return (
                                <label
                                    key={account.id}
                                    className="flex items-center justify-between rounded-md bg-[#171b25] px-3 py-2 text-sm text-[#d8dee9]"
                                >
                                    <span>{account.label}</span>

                                    <input
                                        type="checkbox"
                                        checked={
                                            build.accountMultipliers[accountId]
                                        }
                                        onChange={(event) =>
                                            updateAccount(
                                                accountId,
                                                event.target.checked,
                                            )
                                        }
                                        className="accent-[#79e3ae]"
                                    />
                                </label>
                            );
                        })}
                    </div>
                </CollapsibleSection>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                    {[
                        "Save Build",
                        "Load Build",
                        "Compare Builds",
                    ].map((item, index) => (
                        <button
                            key={item}
                            type="button"
                            className={`rounded-md px-3 py-2.5 text-sm font-semibold ${
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
                        className="rounded-md border border-[#303848] bg-[#171b25] px-3 py-2.5 text-sm font-semibold text-[#d8dee9]"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </Panel>
    );
}