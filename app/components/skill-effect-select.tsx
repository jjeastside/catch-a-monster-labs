"use client";

import { skillEffectFilterOptions, type SkillEffectFilter } from "../lib/skill-effect-filter";

export function SkillEffectSelect({ value, onChange, className = "", selectClassName = "", label = "Skill Effect" }: {
    value: SkillEffectFilter; onChange: (effect: SkillEffectFilter) => void; className?: string; selectClassName?: string; label?: string;
}) {
    return <label className={`block min-w-0 text-[10px] font-semibold text-[#8fa8be] ${className}`}>
        <span className="mb-1 block">{label}</span>
        <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as SkillEffectFilter)}
            className={`w-full min-w-0 rounded-md border border-[#25475f] bg-[#071b2b] px-2 py-2 text-xs text-[#e3e8f1] outline-none focus:border-[#79c9ff] ${selectClassName}`}>
            <option value="all">All Effects</option>
            {skillEffectFilterOptions.map(([id, details]) => <option key={id} value={id}>{details.label}</option>)}
        </select>
    </label>;
}
