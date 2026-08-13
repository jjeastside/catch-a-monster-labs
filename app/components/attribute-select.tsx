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
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                aria-label={selected ? `Change ${selected.name}` : `Select ${label}`}
                className="relative grid h-24 w-full place-items-center overflow-hidden rounded-md border border-[#303848] bg-[#0d1017] p-0.5 hover:border-[#4a5568]"
            >
                {selected ? (
                    <img
                        src={`/attributes/${selected.id}.png`}
                        alt={selected.name}
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <span className="text-xs text-[#697386]">Select attribute</span>
                )}
                <span className="absolute right-1.5 top-1.5 rounded bg-[#0d1017]/85 px-1 text-[9px] text-[#99a2b3]">
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-2 max-h-80 w-[min(20rem,calc(100vw-3rem))] space-y-2 overflow-y-auto rounded-lg border border-[#303848] bg-[#11141c] p-2 shadow-2xl">
                    <button type="button" onClick={() => choose(null)} className="w-full rounded-md border border-transparent p-2 text-left text-xs text-[#99a2b3] hover:border-[#303848] hover:bg-[#171b25]">None</button>
                    {options.map((attribute) => {
                        const disabled = usedIds.includes(attribute.id) && attribute.id !== value;
                        return (
                            <button key={attribute.id} type="button" disabled={disabled} onClick={() => choose(attribute.id)} aria-label={`Select ${attribute.name}`} className={`relative grid h-24 w-full place-items-center overflow-hidden rounded-md border border-[#303848] p-0.5 ${disabled ? "cursor-not-allowed opacity-35" : attribute.id === value ? "bg-[#173126] ring-1 ring-[#79e3ae]" : "bg-[#0d1017] hover:border-[#4a5568]"}`}>
                                <img src={`/attributes/${attribute.id}.png`} alt={attribute.name} loading="lazy" className="h-full w-full object-contain" />
                                {attribute.id === value && <span className="absolute right-2 top-2 rounded-full bg-[#173126] px-1.5 text-xs font-bold text-[#79e3ae]">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}