import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
    title: "Changelog — Cam Lab",
    description: "Recent Cam Lab updates, fixes, and new Catch a Monster calculator features.",
};

const releases = [
    {
        version: "v1.0.0",
        date: "August 20, 2026",
        label: "Latest",
        changes: [
            "Added persistent monster favorites. Favorite monsters directly from the browser or Monster Overview and filter the browser to favorites only.",
            "Added the Changelog page and linked it from the site header.",
            "Added in-game Poison effect info tooltips to skills that apply Poison, including the 0.4% current HP damage, 4% Attack reduction per stack, and 10-stack limit.",
            "Added Burn effect info tooltips showing 0.5% of target Max HP per second for 8 seconds, up to 10 stacks.",
            "Updated Burn duration handling so the Scorch trait's +50% Burn Duration increases Burn from 8 seconds to 12 seconds in Skill Analysis.",
            "Fixed the Poison Volley source-data typo so Poison detection works normally without special-case misspelling handling.",
            "Fixed desktop scrolling for Calculator Results and Build Editor.",
            "Improved healing skill presentation so healing results are shown prominently while detailed formulas remain under calculation details.",
            "Corrected damage-based healing to scale from base Damage instead of post-skill-multiplier damage, including critical healing.",
            "Updated Grace to provide +30% Healing Effectiveness to outgoing skill healing.",
            "Clarified ally healing behavior for Lunar Heal and Holy Aura.",
            "Cleaned up skill display names by hiding internal monster-disambiguation suffixes while preserving meaningful skill variants.",
            "Fixed follow-up TypeScript errors caused by the skill display-name cleanup.",
            "Completed mobile layout and account multiplier formatting improvements.",
            "Improved Index Mania score entry and sequential achievement selection behavior.",
            "Restored Pet Quest achievements and icons to Account Multipliers.",
        ],
    },
    {
        version: "Development Update",
        date: "August 19, 2026",
        changes: [
            "Added basic expected skill DPS using normal damage, critical damage, critical chance, and cooldown.",
            "Expanded Skill Analysis for monsters with multiple skills and added Total Skill DPS.",
            "Improved site metadata and social preview support.",
        ],
    },
    {
        version: "Development Update",
        date: "August 18, 2026",
        changes: [
            "Implemented the trait system and trait symbols throughout the calculator.",
            "Added persistent active builds and save/load build slots.",
            "Expanded equipment attributes, passives, mutations, Genetic Potential, and Evolution Multiplier calculations.",
        ],
    },
];

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-[#0b111a] text-[#f6f8fc]">
            <TopNavigation />

            <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-8 max-w-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">
                        Cam Lab Updates
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        Changelog
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-[#8e99ad] sm:text-base">
                        New features, calculator improvements, data updates, and bug fixes added to Cam Lab.
                    </p>
                </div>

                <div className="space-y-5">
                    {releases.map((release, releaseIndex) => (
                        <section
                            key={`${release.version}-${release.date}`}
                            className="overflow-hidden rounded-xl border border-[#344050] bg-[#141c28]"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#344050] px-4 py-4 sm:px-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#e3e8f1]">
                                            {release.version}
                                        </h2>
                                        {release.label && (
                                            <span className="rounded-full border border-[#7182ff]/40 bg-[#202846] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#aeb8ff]">
                                                {release.label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-[#7f8b9e]">{release.date}</p>
                                </div>
                                <span className="text-xs font-medium text-[#7182ff]">
                                    {release.changes.length} {release.changes.length === 1 ? "change" : "changes"}
                                </span>
                            </div>

                            <ul className="divide-y divide-[#293140]">
                                {release.changes.map((change) => (
                                    <li key={change} className="flex gap-3 px-4 py-3.5 text-sm leading-6 text-[#bfc7d5] sm:px-5">
                                        <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#7182ff]" />
                                        <span>{change}</span>
                                    </li>
                                ))}
                            </ul>

                            {releaseIndex === 0 && (
                                <div className="border-t border-[#344050] bg-[#0f1620]/60 px-4 py-3 text-xs text-[#7f8b9e] sm:px-5">
                                    Favorites are stored locally in your browser, so they remain selected after refreshes on the same device and browser.
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}