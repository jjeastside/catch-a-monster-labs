"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { achievements, getAchievementsByCategory } from "../data/achievements";
import type { Build } from "../types/build";

const storageKey = "monster-lab-account-multipliers";
const validIds = new Set(achievements.map(({ id }) => id));

/** Reads Calculator's account progress, including its legacy boolean format. */
function readAccount(): Build["accountMultipliers"] | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const ids: string[] = Array.isArray(parsed.completedAchievementIds)
      ? parsed.completedAchievementIds.filter(
          (id: unknown): id is string =>
            typeof id === "string" && validIds.has(id),
        )
      : [];
    if (!ids.length) {
      if (parsed.indexMania)
        ids.push(
          ...getAchievementsByCategory("index-mania").map(({ id }) => id),
        );
      if (parsed.pathOfProgress)
        ids.push(
          ...getAchievementsByCategory("path-of-progress").map(({ id }) => id),
        );
      if (parsed.petQuestAchievement)
        ids.push(...getAchievementsByCategory("pet-quest").map(({ id }) => id));
    }
    return { completedAchievementIds: [...new Set(ids)] };
  } catch {
    return null;
  }
}

export function useCompareAccount(
  account: Build["accountMultipliers"],
  setBuild: Dispatch<SetStateAction<Build>>,
) {
  const ready = useRef(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = readAccount();
      if (saved)
        setBuild((current) => ({ ...current, accountMultipliers: saved }));
      ready.current = true;
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      const saved = readAccount() ?? { completedAchievementIds: [] };
      setBuild((current) => ({ ...current, accountMultipliers: saved }));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", onStorage);
    };
  }, [setBuild]);
  useEffect(() => {
    if (!ready.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(account));
    } catch {
      /* Settings still work when storage is unavailable. */
    }
  }, [account]);
}
