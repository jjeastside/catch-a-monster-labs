"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GearAttribute } from "../types/attribute";

type AttributeSelectProps = {
    label: string;
    options: GearAttribute[];
    value: string | null;
    usedIds: string[];
    onChange: (value: string | null) => void;
};

export function AttributeSelect({
                                    label,
                                    options,
                                    value,
                                    usedIds,
                                    onChange,
                                }: AttributeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [opensUpward, setOpensUpward] = useState(false);
    const [alignsRight, setAlignsRight] = useState(false);
    const [menuMaxHeight, setMenuMaxHeight] = useState(264);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selected = options.find((attribute) => attribute.id === value) ?? null;

    const updateMenuPosition = useCallback(() => {
        const button = buttonRef.current;
        const root = rootRef.current;

        if (!button || !root) {
            return;
        }

        let scrollBoundary: HTMLElement | null = root.parentElement;

        while (scrollBoundary) {
            const overflowY = window.getComputedStyle(scrollBoundary).overflowY;
            if (["auto", "scroll", "hidden", "clip"].includes(overflowY)) {
                break;
            }
            scrollBoundary = scrollBoundary.parentElement;
        }

        const buttonRect = button.getBoundingClientRect();
        const boundaryRect = scrollBoundary?.getBoundingClientRect();
        const boundaryTop = Math.max(8, boundaryRect?.top ?? 8);
        const boundaryBottom = Math.min(
            window.innerHeight - 8,
            boundaryRect?.bottom ?? window.innerHeight - 8,
        );
        const spaceAbove = Math.max(0, buttonRect.top - boundaryTop - 6);
        const spaceBelow = Math.max(0, boundaryBottom - buttonRect.bottom - 6);
        const shouldOpenUpward = spaceBelow < 240 && spaceAbove > spaceBelow;
        const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;
        const menuWidth = Math.min(320, window.innerWidth - 48);

        setOpensUpward(shouldOpenUpward);
        setAlignsRight(buttonRect.left + menuWidth > window.innerWidth - 8);
        setMenuMaxHeight(Math.max(80, Math.min(264, availableSpace)));
    }, []);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        updateMenuPosition();
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);

        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [isOpen, updateMenuPosition]);

    const choose = (id: string | null) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div ref={rootRef} className="relative min-w-0">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                    if (!isOpen) updateMenuPosition();
                    setIsOpen((open) => !open);
                }}
                aria-expanded={isOpen}
                aria-label={selected ? `Change ${selected.name}` : `Select ${label}`}
                className="relative grid aspect-[2.85/1] min-h-[54px] w-full place-items-center overflow-hidden rounded-md border border-[#303848] bg-[#11151e] p-0.5 hover:border-[#4a5568] focus:border-[#7585ff] focus:outline-none"
            >
                {selected ? (
                    <img
                        src={`/attributes/${selected.id}.png`}
                        alt={selected.name}
                        className="block h-auto w-full"
                    />
                ) : (
                    <span className="text-xs text-[#697386]">Select attribute</span>
                )}

                <span className="absolute left-1.5 top-1.5 rounded bg-[#11151e]/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#99a2b3]">
                    {label}
                </span>

                <span className="absolute right-1.5 top-1.5 rounded bg-[#11151e]/85 px-1 text-[9px] text-[#99a2b3]">
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>
            {isOpen && (
                <div
                    role="listbox"
                    aria-label={label}
                    style={{maxHeight: `${menuMaxHeight}px` }}
                    className={`absolute z-50 w-[min(16rem,calc(100vw-3rem))] space-y-1 overflow-y-auto rounded-lg border border-[#303848] bg-[#131720] p-1.5 shadow-2xl ${
                        opensUpward ? "bottom-full mb-1" : "top-full mt-1"
                    } ${alignsRight ? "right-0" : "left-0"}`}
                >
                    <button
                        type="button"
                        role="option"
                        aria-selected={value === null}
                        onClick={() => choose(null)}
                        className="w-full rounded-md border border-transparent p-2 text-left text-xs text-[#99a2b3] hover:border-[#303848] hover:bg-[#1a1f2a]"
                    >
                        None
                    </button>
                    {options.map((attribute) => {
                        const disabled =
                            usedIds.includes(attribute.id) &&
                            attribute.id !== value;

                        return (
                            <button
                                key={attribute.id}
                                type="button"
                                role="option"
                                disabled={disabled}
                                aria-selected={attribute.id === value}
                                onClick={() => choose(attribute.id)}
                                aria-label={`Select ${attribute.name}`}
                                className={`relative grid h-16 w-full place-items-center overflow-hidden rounded-md border border-[#303848] p-0.5 ${
                                    disabled
                                        ? "cursor-not-allowed opacity-35"
                                        : attribute.id === value
                                            ? "bg-[#1f2540] ring-1 ring-[#7585ff]"
                                            : "bg-[#11151e] hover:border-[#4a5568]"
                                }`}
                            >
                                <img
                                    src={`/attributes/${attribute.id}.png`}
                                    alt={attribute.name}
                                    loading="lazy"
                                    className="h-full w-full object-contain"
                                />
                                {attribute.id === value && (
                                    <span className="absolute right-2 top-2 rounded-full bg-[#1f2540] px-1.5 text-xs font-bold text-[#7585ff]">
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}