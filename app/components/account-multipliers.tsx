"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
    ACCOUNT_MULTIPLIERS,
    ACCOUNT_MULTIPLIER_IDS,
    getAccountMultiplier,
    getSelectedAccountMultiplierCount,
    type AccountMultiplierId,
} from "../lib/calculations/account-multipliers";
import type { Build } from "../types/build";

type AccountMultipliersProps = {
    build: Build;
    onBuildChangeAction: Dispatch<SetStateAction<Build>>;
};

function formatMultiplier(value: number): string {
    return `${Number(value.toFixed(4))}×`;
}

export function AccountMultipliers({
                                       build,
                                       onBuildChangeAction,
                                   }: AccountMultipliersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const selectedCount = getSelectedAccountMultiplierCount(build.accountMultipliers);
    const totalMultiplier = getAccountMultiplier(build.accountMultipliers);

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen]);

    const toggle = (id: AccountMultiplierId) => {
        onBuildChangeAction((current) => ({
            ...current,
            accountMultipliers: {
                ...current.accountMultipliers,
                [id]: !current.accountMultipliers[id],
            },
        }));
    };

    const reset = () => {
        onBuildChangeAction((current) => ({
            ...current,
            accountMultipliers: {
                indexMania: false,
                petQuestAchievement: false,
                pathOfProgress: false,
            },
        }));
    };

    return (
        <>
            <section className="rounded-lg border border-[#272d3a] bg-[#11141c] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <div className="grid gap-3 lg:grid-cols-[minmax(230px,0.9fr)_repeat(3,minmax(190px,1fr))] lg:items-stretch">
                    <div className="flex items-center justify-between gap-3 lg:pr-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-sm font-semibold text-[#e8ebf0]">Account Multipliers</h2>
                                <span className="rounded border border-[#303848] bg-[#171b25] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#788295]">Account-wide</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#788295]">These settings stay active when you switch monsters.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className="shrink-0 rounded-md border border-[#303848] bg-[#171b25] px-2.5 py-1.5 text-[10px] font-semibold text-[#99a2b3] transition hover:border-[#79e3ae] hover:text-[#79e3ae]"
                        >
                            Manage
                        </button>
                    </div>

                    {ACCOUNT_MULTIPLIER_IDS.map((id, index) => {
                        const item = ACCOUNT_MULTIPLIERS[id];
                        const isSelected = build.accountMultipliers[id];
                        const icons = ["★", "✦", "↟"];
                        const iconStyles = [
                            "border-[#8056b8] bg-[#382254] text-[#d8b7ff]",
                            "border-[#5f9b50] bg-[#1e4523] text-[#a5ef8e]",
                            "rotate-45 border-[#d99a2b] bg-[#173e5c] text-[#72c5ff]",
                        ];

                        return (
                            <button
                                key={id}
                                type="button"
                                role="switch"
                                aria-checked={isSelected}
                                onClick={() => toggle(id)}
                                className={`flex min-w-0 items-center gap-3 rounded-md border px-3 py-2 text-left transition ${
                                    isSelected
                                        ? "border-[#3a765a] bg-[#173126]/55"
                                        : "border-[#303848] bg-[#171b25] hover:border-[#4a5568]"
                                }`}
                            >
                                <span className={`grid size-8 shrink-0 place-items-center rounded border text-sm font-black shadow-md ${iconStyles[index]}`}>
                                    <span className={index === 2 ? "-rotate-45" : ""}>{icons[index]}</span>
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-medium text-[#d8dee9]">{item.label}</span>
                                    <span className={`mt-0.5 block text-[10px] ${isSelected ? "text-[#79e3ae]" : "text-[#788295]"}`}>
                                        {isSelected ? `Active · ${formatMultiplier(item.multiplier)}` : "Not active"}
                                    </span>
                                </span>
                                <span className={`relative h-5 w-9 shrink-0 rounded-full border transition ${isSelected ? "border-[#79e3ae] bg-[#2d7652]" : "border-[#4a5568] bg-[#0d1017]"}`}>
                                    <span className={`absolute top-0.5 size-3.5 rounded-full bg-[#d8dee9] transition-transform ${isSelected ? "translate-x-[17px]" : "translate-x-0.5"}`} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-[2px]"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setIsOpen(false);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="account-multipliers-title"
                        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#303848] bg-[#11141c] shadow-2xl"
                    >
                        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#272d3a] bg-[#11141c] px-5 py-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#79e3ae]">Account Progress</p>
                                <h2 id="account-multipliers-title" className="mt-1 text-lg font-semibold text-[#f2f4f8]">Account Multipliers</h2>
                                <p className="mt-1 text-xs text-[#99a2b3]">Check the achievements completed in your game.</p>
                            </div>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close account multipliers"
                                className="grid size-9 shrink-0 place-items-center rounded-md border border-[#303848] bg-[#171b25] text-lg text-[#99a2b3] hover:border-[#79e3ae] hover:text-[#79e3ae]"
                            >
                                ×
                            </button>
                        </header>

                        <div className="space-y-3 p-5">
                            {ACCOUNT_MULTIPLIER_IDS.map((id) => {
                                const item = ACCOUNT_MULTIPLIERS[id];
                                const isSelected = build.accountMultipliers[id];

                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        onClick={() => toggle(id)}
                                        className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition ${
                                            isSelected
                                                ? "border-[#79e3ae] bg-[#173126]/55"
                                                : "border-[#303848] bg-[#171b25] hover:border-[#4a5568]"
                                        }`}
                                    >
                                        <span className={`grid size-6 shrink-0 place-items-center rounded border text-xs font-black ${isSelected ? "border-[#79e3ae] bg-[#79e3ae] text-[#0b1510]" : "border-[#4a5568] text-transparent"}`}>✓</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-[#e8ebf0]">{item.label}</span>
                                            <span className="mt-0.5 block text-xs text-[#788295]">{item.description}</span>
                                        </span>
                                        <span className="shrink-0 text-sm font-bold text-[#79e3ae]">{formatMultiplier(item.multiplier)}</span>
                                    </button>
                                );
                            })}

                            <div className="mt-4 flex items-center justify-between rounded-lg border border-[#2c6048] bg-[#173126]/45 p-4">
                                <div>
                                    <p className="text-xs text-[#9ab2a5]">Combined Account Multiplier</p>
                                    <p className="mt-1 text-[10px] text-[#788295]">Applied automatically to Health and Damage</p>
                                </div>
                                <p className="text-2xl font-bold text-[#79e3ae]">{formatMultiplier(totalMultiplier)}</p>
                            </div>
                        </div>

                        <footer className="sticky bottom-0 flex justify-between gap-3 border-t border-[#272d3a] bg-[#11141c] px-5 py-4">
                            <button type="button" onClick={reset} disabled={selectedCount === 0} className="rounded-md px-3 py-2 text-xs font-semibold text-[#99a2b3] hover:text-[#e8ebf0] disabled:cursor-not-allowed disabled:opacity-40">Reset</button>
                            <button type="button" onClick={() => setIsOpen(false)} className="rounded-md bg-[#79e3ae] px-5 py-2 text-sm font-bold text-[#0b1510] hover:bg-[#8ce9ba]">Done</button>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
}