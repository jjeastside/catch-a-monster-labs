"use client";

import { getEvolutionMultiplier } from "../lib/calculations/evolution";
import { useCombatMode } from "../lib/combat-mode";

/** Keep the PvP EM rule visible next to every Evolution Multiplier control. */
export function EvolutionPvpNotice({ value }: { value: number }) {
    const [combatMode] = useCombatMode();
    if (combatMode !== "pvp") return null;

    const appliedPercent = getEvolutionMultiplier(value, "pvp") * 100;

    return (
        <p role="note" className="mt-2 text-[11px] leading-4 text-[#ff91ad]">
            <span aria-hidden="true">⚠ </span>
            <strong className="font-semibold">PvP: EM is only 50% effective.</strong>{" "}
            <span className="tabular-nums">{value.toFixed(2)}% selected → {appliedPercent.toFixed(2)}% applied</span>{" "}
            to evolved monsters&apos; base Damage and Health.
        </p>
    );
}
