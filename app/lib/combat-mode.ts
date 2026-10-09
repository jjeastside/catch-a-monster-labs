"use client";

import { useSyncExternalStore } from "react";

export type CombatMode = "pve" | "pvp";
const STORAGE_KEY = "cam-lab-combat-mode";
const EVENT_NAME = "cam-lab-combat-mode-change";

function getSnapshot(): CombatMode {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "pvp" ? "pvp" : "pve";
    } catch {
        return "pve";
    }
}

function getServerSnapshot(): CombatMode {
    return "pve";
}

function subscribe(callback: () => void) {
    window.addEventListener("storage", callback);
    window.addEventListener(EVENT_NAME, callback);
    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(EVENT_NAME, callback);
    };
}

/** Shared, persistent display mode for every page. PvP formulas are implemented separately. */
export function useCombatMode(): [CombatMode, (mode: CombatMode) => void] {
    const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    function setMode(nextMode: CombatMode) {
        try {
            window.localStorage.setItem(STORAGE_KEY, nextMode);
        } catch {
            // Mode remains PvE if browser storage is unavailable.
        }
        window.dispatchEvent(new Event(EVENT_NAME));
    }
    return [mode, setMode];
}
