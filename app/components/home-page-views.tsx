"use client";

import { useEffect, useState } from "react";

// This is the public /stats endpoint of the separately deployed Cloudflare Worker.
// If Cloudflare assigns a different workers.dev domain, update this address.
const STATS_ENDPOINT =
    "https://cam-lab-analytics-stats.camlab.workers.dev/stats";

type Counts = {
    weeklyViews: number;
    totalViews: number;
    updatedAt: string;
};

function isCounts(data: unknown): data is Counts {
    if (!data || typeof data !== "object") return false;
    const candidate = data as Partial<Counts>;
    return (
        typeof candidate.weeklyViews === "number" &&
        Number.isSafeInteger(candidate.weeklyViews) &&
        candidate.weeklyViews >= 0 &&
        typeof candidate.totalViews === "number" &&
        Number.isSafeInteger(candidate.totalViews) &&
        candidate.totalViews >= candidate.weeklyViews &&
        typeof candidate.updatedAt === "string" &&
        !Number.isNaN(Date.parse(candidate.updatedAt))
    );
}

function ViewsIcon({ weekly }: { weekly: boolean }) {
    return weekly ? (
        <svg aria-hidden="true" className="size-10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 3v4M17 3v4M3 10h18M7.5 14h3M7.5 17h6" />
        </svg>
    ) : (
        <svg aria-hidden="true" className="size-10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M2.3 12s3.6-6.6 9.7-6.6 9.7 6.6 9.7 6.6-3.6 6.6-9.7 6.6S2.3 12 2.3 12Z" />
            <circle cx="12" cy="12" r="2.9" />
        </svg>
    );
}

export function HomePageViews() {
    const [counts, setCounts] = useState<Counts | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            try {
                const response = await fetch(STATS_ENDPOINT, {
                    method: "GET",
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error("Analytics unavailable");
                const data: unknown = await response.json();
                if (!isCounts(data)) throw new Error("Invalid analytics response");
                if (!controller.signal.aborted) {
                    setCounts(data);
                    setStatus("ready");
                }
            } catch {
                if (!controller.signal.aborted) setStatus("unavailable");
            }
        }
        void load();
        return () => controller.abort();
    }, []);

    const cards = [
        {
            label: "Views This Week",
            hint: "Last 7 days (UTC)",
            weekly: true,
            accent: "text-[#5aa8ff]",
            value: counts?.weeklyViews,
        },
        {
            label: "Total Views",
            hint: "Since analytics was enabled",
            weekly: false,
            accent: "text-[#39d5ed]",
            value: counts?.totalViews,
        },
    ];

    return (
        <div className="mx-auto mt-4 grid w-full max-w-[1480px] gap-4 sm:grid-cols-2" aria-label="Cam Lab website page views">
            {cards.map((card) => (
                <div key={card.label} className="flex min-h-28 items-center justify-center gap-5 rounded-2xl border border-[#1a4779] bg-[#07172c] px-6 py-5 shadow-[0_14px_30px_rgba(0,0,0,.22)]">
                    <span className={card.accent}><ViewsIcon weekly={card.weekly} /></span>
                    <div>
                        <p className="text-3xl font-black tabular-nums text-white" aria-live="polite">
                            {status === "ready" && card.value !== undefined
                                ? card.value.toLocaleString("en-US")
                                : status === "loading" ? "…" : "—"}
                        </p>
                        <p className="text-sm font-bold text-[#9eb3cf]">{card.label}</p>
                        <p className="mt-0.5 text-[11px] text-[#758ba9]">
                            {status === "unavailable" ? "Stats temporarily unavailable" : card.hint}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
