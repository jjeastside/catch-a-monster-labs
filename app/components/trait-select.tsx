"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getAvailableTraits, getTrait } from "../data/traits";
import type { Trait } from "../types/trait";
import { TraitIcon } from "./trait-icon";

type TraitSelectProps = {
    value: string | null;
    onChangeAction: (value: string | null) => void;
};

const rarityTextClasses: Record<Trait["rarity"], string> = {
    rare: "text-[#6bc8ff]",
    epic: "text-[#eb7cff]",
    legendary: "text-[#ffb866]",
    mythical: "text-[#79e3ae]",
};

function effectLabel(trait: Trait): string {
    return trait.effects.map(({ description }) => description).join(" · ");
}

export function TraitSelect({ value, onChangeAction }: TraitSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [opensUpward, setOpensUpward] = useState(false);
    const [menuMaxHeight, setMenuMaxHeight] = useState(300);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selectedTrait = getTrait(value);
    const traits = getAvailableTraits();

    const updateMenuPosition = useCallback(() => {
        const button = buttonRef.current;
        const container = containerRef.current;
        if (!button || !container) return;

        let scrollBoundary: HTMLElement | null = container.parentElement;
        while (scrollBoundary) {
            const overflowY = window.getComputedStyle(scrollBoundary).overflowY;
            if (["auto", "scroll", "hidden", "clip"].includes(overflowY)) break;
            scrollBoundary = scrollBoundary.parentElement;
        }

        const buttonRect = button.getBoundingClientRect();
        const boundaryRect = scrollBoundary?.getBoundingClientRect();
        const boundaryTop = Math.max(8, boundaryRect?.top ?? 8);
        const boundaryBottom = Math.min(window.innerHeight - 8, boundaryRect?.bottom ?? window.innerHeight - 8);
        const spaceAbove = Math.max(0, buttonRect.top - boundaryTop - 6);
        const spaceBelow = Math.max(0, boundaryBottom - buttonRect.bottom - 6);
        const shouldOpenUpward = spaceBelow < 260 && spaceAbove > spaceBelow;

        setOpensUpward(shouldOpenUpward);
        setMenuMaxHeight(Math.max(100, Math.min(320, shouldOpenUpward ? spaceAbove : spaceBelow)));
    }, []);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        updateMenuPosition();
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);
        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [isOpen, updateMenuPosition]);

    const selectTrait = (id: string | null) => {
        onChangeAction(id);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative min-w-0">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                    if (!isOpen) updateMenuPosition();
                    setIsOpen((current) => !current);
                }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="flex min-h-[58px] w-full items-center gap-2 rounded-lg border border-[#303848] bg-[#1a1f2a] px-2 py-1.5 text-left outline-none transition hover:border-[#4a5568] focus:border-[#7585ff]"
            >
                {selectedTrait ? (
                    <>
                        <TraitIcon trait={selectedTrait} size="combat" />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-[#e8ebf0]">{selectedTrait.name}</span>
                            <span className={`mt-0.5 block truncate text-[10px] ${rarityTextClasses[selectedTrait.rarity]}`}>
                                <span className="capitalize">{selectedTrait.rarity}</span> · {effectLabel(selectedTrait)}
                            </span>
                        </span>
                    </>
                ) : (
                    <span className="flex-1 px-1 text-xs text-[#788295]">No Trait</span>
                )}
                <span aria-hidden="true" className="shrink-0 text-xs text-[#788295]">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label="Trait"
                    style={{ maxHeight: `${menuMaxHeight}px` }}
                    className={`absolute left-0 z-50 w-full min-w-[18rem] overflow-y-auto rounded-lg border border-[#303848] bg-[#131720] p-1 shadow-2xl ${opensUpward ? "bottom-full mb-1" : "top-full mt-1"}`}
                >
                    <button
                        type="button"
                        role="option"
                        aria-selected={value === null}
                        onClick={() => selectTrait(null)}
                        className={`w-full rounded-md px-2 py-2 text-left text-xs ${value === null ? "bg-[#1f2540] text-[#7585ff]" : "text-[#99a2b3] hover:bg-[#1a1f2a]"}`}
                    >
                        No Trait
                    </button>

                    {traits.map((trait) => {
                        const selected = trait.id === selectedTrait?.id;
                        return (
                            <button
                                key={trait.id}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => selectTrait(trait.id)}
                                className={`flex w-full items-center gap-2 rounded-md p-2 text-left ${selected ? "bg-[#1f2540]" : "hover:bg-[#1a1f2a]"}`}
                            >
                                <TraitIcon trait={trait} size="combat" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-semibold text-[#e8ebf0]">{trait.name}</span>
                                    <span className={`mt-0.5 block text-[10px] ${rarityTextClasses[trait.rarity]}`}>
                                        <span className="capitalize">{trait.rarity}</span> · {effectLabel(trait)}
                                    </span>
                                    {trait.naturalSource && (
                                        <span className="mt-0.5 block text-[9px] text-[#8993a5]">
                                            Exclusive to {trait.naturalSource} · Breed to transfer
                                        </span>
                                    )}
                                </span>
                                {selected && <span className="text-[#7585ff]">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}