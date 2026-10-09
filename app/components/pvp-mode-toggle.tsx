"use client";

import { useCombatMode } from "../lib/combat-mode";

export function PvpModeToggle({ mobile = false }: { mobile?: boolean }) {
    const [mode, setMode] = useCombatMode();
    const enabled = mode === "pvp";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="PvP Mode"
            title="Switch between PvE and PvP base stats. PvP halves the full EM value for evolved monsters."
            onClick={() => setMode(enabled ? "pve" : "pvp")}
            className={`flex shrink-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#72b7ff] ${
                enabled
                    ? "border-[#a83861] bg-[#341327] text-[#ff91ad]"
                    : "border-[#25475f] bg-[#0a1931] text-[#bfc7d5] hover:border-[#4176a3]"
            } ${mobile ? "w-full px-3 py-2.5 text-sm" : "max-w-full"}`}
        >
            <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span aria-hidden="true">⚔️</span>
                PvP Mode
            </span>
            <span
                aria-hidden="true"
                className={`relative block h-[19px] w-[34px] shrink-0 overflow-hidden rounded-full transition-colors ${enabled ? "bg-[#ec3267]" : "bg-[#36536e]"}`}
            >
                <span className={`absolute left-0 top-[3px] size-[13px] rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
            </span>
        </button>
    );
}
