"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Equipment } from "../types/equipment";
import { assetPath } from "../lib/asset-path";

const rarityTextClasses: Record<Equipment["rarity"], string> = {
    Rare: "text-[#6bc8ff]",
    Epic: "text-[#eb7cff]",
    Legendary: "text-[#ffb866]",
    Mythical: "text-[#79e3ae]",
    Secret: "text-[#ff8b55]",
};

type EquipmentSelectProps = {
    label: string;
    items: Equipment[];
    value: string | null;
    onChangeAction: (value: string | null) => void;
};

export function EquipmentSelect({
                                    label,
                                    items,
                                    value,
                                    onChangeAction,
                                }: EquipmentSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [opensUpward, setOpensUpward] = useState(false);
    const [alignsRight, setAlignsRight] = useState(false);
    const [menuMaxHeight, setMenuMaxHeight] = useState(248);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selectedItem = items.find((item) => item.id === value) ?? null;

    const updateMenuPosition = useCallback(() => {
        const button = buttonRef.current;
        const container = containerRef.current;

        if (!button || !container) {
            return;
        }

        let scrollBoundary: HTMLElement | null = container.parentElement;

        while (scrollBoundary) {
            const overflowY = window.getComputedStyle(scrollBoundary).overflowY;

            if (["auto", "scroll", "hidden", "clip"].includes(overflowY)) {
                break;
            }

            scrollBoundary = scrollBoundary.parentElement;
        }

        const buttonRect = button.getBoundingClientRect();
        const menuWidth = Math.min(256, window.innerWidth - 32);
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

        setOpensUpward(shouldOpenUpward);
        const boundaryRight = Math.min(
            window.innerWidth - 8,
            boundaryRect?.right ?? window.innerWidth - 8,
        );

        setAlignsRight(buttonRect.left + menuWidth > boundaryRight);
        setMenuMaxHeight(Math.max(64, Math.min(248, availableSpace)));
    }, []);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
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

    const selectItem = (id: string | null) => {
        onChangeAction(id);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative min-w-0">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">
                {label}
            </span>

            <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                    if (!isOpen) {
                        updateMenuPosition();
                    }

                    setIsOpen((current) => !current);
                }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="flex min-h-10 w-full items-center gap-1.5 rounded-md border border-[#303848] bg-[#1a1f2a] px-1.5 py-0.5 text-left outline-none hover:border-[#4a5568] focus:border-[#7585ff]"
            >
                {selectedItem ? (
                    <>
                        <img
                            src={assetPath(`/gear/${selectedItem.id}.png`)}
                            alt=""
                            className="size-7 shrink-0 rounded object-contain"
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold leading-tight text-[#e8ebf0]">
                                {selectedItem.name}
                            </span>
                            <span className={`mt-0.5 block truncate text-[9px] leading-tight ${rarityTextClasses[selectedItem.rarity]}`}>
                                +{selectedItem.percentage}% {selectedItem.type === "weapon" ? "Damage" : "Health"}
                            </span>
                        </span>
                    </>
                ) : (
                    <span className="flex-1 px-1 text-xs text-[#788295]">None</span>
                )}
                <span aria-hidden="true" className="shrink-0 text-xs text-[#788295]">
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label={label}
                    style={{ maxHeight: `${menuMaxHeight}px` }}
                    className={`absolute z-50 w-[min(16rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-[#303848] bg-[#131720] p-1 shadow-2xl ${
                        opensUpward
                            ? "bottom-full mb-1"
                            : "top-full mt-1"
                    } ${alignsRight ? "right-0" : "left-0"}`}
                >
                    <button
                        type="button"
                        role="option"
                        aria-selected={value === null}
                        onClick={() => selectItem(null)}
                        className={`w-full rounded-md px-2 py-1.5 text-left text-xs ${
                            value === null ? "bg-[#1f2540] text-[#7585ff]" : "text-[#99a2b3] hover:bg-[#1a1f2a]"
                        }`}
                    >
                        None
                    </button>

                    {items.map((item) => {
                        const selected = item.id === value;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => selectItem(item.id)}
                                className={`flex w-full items-center gap-2 rounded-md p-1.5 text-left ${
                                    selected ? "bg-[#1f2540]" : "hover:bg-[#1a1f2a]"
                                }`}
                            >
                                <img
                                    src={assetPath(`/gear/${item.id}.png`)}
                                    alt=""
                                    loading="lazy"
                                    className="size-10 shrink-0 rounded-md object-contain"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-semibold text-[#e8ebf0]">
                                        {item.name}
                                    </span>
                                    <span className={`mt-0.5 block text-[10px] ${rarityTextClasses[item.rarity]}`}>
                                        {item.rarity} · +{item.percentage}% {item.type === "weapon" ? "Damage" : "Health"}
                                    </span>
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