"use client";

import { useEffect, useRef, useState } from "react";
import type { GearAttribute } from "../types/attribute";

type AttributeSelectProps = {
    label: string;
    options: GearAttribute[];
    value: string | null;
    usedIds: string[];
    onChange: (value: string | null) => void;
};

export function AttributeSelect({ label, options, value, usedIds, onChange }: AttributeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const selected = options.find((attribute) => attribute.id === value) ?? null;

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const choose = (id: string | null) => { onChange(id); setIsOpen(false); };
    return (
        <div ref={rootRef} className="relative min-w-0">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">{label}</span>
            <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className="flex w-full items-center gap-2 rounded-md border border-[#303848] bg-[#171b25] p-1.5 text-left hover:border-[#4a5568]">
                {selected ? <img src={`/attributes/${selected.id}.png`} alt="" className="size-8 shrink-0 rounded object-contain" /> : <span className="size-8 shrink-0 rounded bg-[#202632]" />}
                <span className="min-w-0 flex-1 truncate text-xs text-[#d8dee9]">{selected?.name ?? "None"}</span>
                <span className="text-[10px] text-[#788295]">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-64 w-[min(20rem,calc(100vw-3rem))] overflow-y-auto rounded-lg border border-[#303848] bg-[#11141c] p-1 shadow-2xl">
                    <button type="button" onClick={() => choose(null)} className="w-full rounded p-2 text-left text-xs text-[#99a2b3] hover:bg-[#171b25]">None</button>
                    {options.map((attribute) => {
                        const disabled = usedIds.includes(attribute.id) && attribute.id !== value;
                        return (
                            <button key={attribute.id} type="button" disabled={disabled} onClick={() => choose(attribute.id)} className={`flex w-full items-center gap-2 rounded p-2 text-left ${disabled ? "cursor-not-allowed opacity-35" : attribute.id === value ? "bg-[#173126]" : "hover:bg-[#171b25]"}`}>
                                <img src={`/attributes/${attribute.id}.png`} alt="" loading="lazy" className="size-9 shrink-0 rounded object-contain" />
                                <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#e8ebf0]">{attribute.name}</strong><span className="block text-[10px] text-[#79e3ae]">{attribute.value}{attribute.effectType === "damage_immunity" ? " seconds" : "%"}{attribute.hpCondition ? ` · HP ${attribute.hpCondition}%` : ""}</span></span>
                                {attribute.id === value && <span className="text-[#79e3ae]">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}