import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
title: "Changelog — Cam Lab",
description: "Recent Cam Lab updates, fixes, and new Catch a Monster calculator features.",
};

const releases = [
{
version: "v1.0.2",
date: "August 25, 2026",
label: "Latest",
changes: [
"Added the complete Monster Database with visual cards for all 231 monsters, including artwork, rarity, element, reference stats, skills, passives, index position, and acquisition source.",
"Added Monster Database search and filters for rarity, element, source type, island, obtainability, passive, skill effect, and evolution status.",
"Added database sorting by Index, DPS, Damage, and Health using the same comparison calculations as the main calculator.",
"Added passive comparison modes and an Evolution Multiplier control for more accurate Damage, Health, and DPS rankings.",
"Added detailed monster profiles with reference stats, skill information, passive effects, acquisition methods, evolution families, and direct calculator links.",
"Added dedicated shareable Monster Database profile routes and a Copy Link action for individual monsters.",
"Replaced the original in-grid selected-monster panel with a fixed detail drawer so profiles can be opened from anywhere in the database without losing the current grid position.",
"The monster detail drawer now resets to the top for every selection and supports backdrop click, a close button, and the Escape key.",
"Locked background scrolling while database drawers are open and preserved the page position when returning to the monster grid.",
"Added a compact mobile Monster Database layout with responsive monster cards and a sticky mobile results toolbar.",
"Added a dedicated mobile filter drawer with clear and apply controls so the full database remains practical on smaller screens.",
"Improved database card sizing, artwork presentation, source visibility, selected states, and responsive stat layouts across desktop and mobile.",
],
},
{
version: "v1.0.1",
date: "August 21, 2026",
changes: [
"Updated monster and skill data for the Catch a Monster 0.45 update.",
"Added Coilwork City as a supported island and added its new monsters to the calculator data.",
"Added an All Islands filter to the Monster Browser so monsters can be filtered by island.",
"Restricted the island filter to actual islands so event locations, shops, and other source locations do not appear in the list.",
"Moved All Evolution Types next to All Passive Types for a cleaner Monster Browser filter layout.",
"Added a Patch Notes page for tracking Catch a Monster game updates separately from Cam Lab development changes.",
"Updated Path of Progress from 12 to 13 achievements and added the new Splash Isle Path of Progress reward, increasing the maximum Path of Progress Health bonus from +24% to +26%.",
"Added shareable build URLs so complete Cam Lab builds can be copied and opened by other players without requiring an account or backend.",
"Shared build links preserve calculator-relevant build state, including monster, level, rank, enhancement, Evolution Multiplier, Genetic Potential, mutations, traits, equipment, attributes, teammates, combat conditions, and account multipliers.",
"Replaced Compare Builds with Share Build in the Build Editor actions.",
"Compressed shared build URLs using compact indexed IDs, packed achievement selections, and shortened numeric and flag encoding to keep links practical for Discord and other sharing.",
"Removed BigInt from shared-build achievement encoding for broader browser and TypeScript compatibility.",
"Added direct monster links using URL hashes, allowing links such as #lynxgear, #glacier_claw, and #glacier-claw to open the matching monster immediately.",
"Selecting a monster now updates the URL with its direct monster hash while #b= links remain reserved for complete shared builds.",
"Redesigned Monster Browser filtering with separate Stats and Browse filter panels to reduce clutter around the search bar.",
"Added stat sorting by Index, DPS, Damage, and Health with compact icon-based controls and ascending/descending ordering.",
"Added an Evolution Multiplier control to stat comparisons, including the same drag-up 0.01% precision behavior used by the Build Editor.",
"Added passive comparison modes for stat sorting: No Passives, Always-Active Passives, and Conditional Passives with Vital Surge treated as active.",
"Always-active personal damage and critical passives now contribute to Damage and DPS browser comparisons while context-specific Boss, Spire, Rift, and Dungeon passives remain excluded.",
"Index sorting now hides passive and Evolution Multiplier controls because they do not affect index order.",
"Added hover help for both Monster Browser filter buttons and portal-based help tooltips that can render outside panel boundaries without clipping.",
"Moved Favorites into the Browse Filters panel and added an active-filter count badge plus a compact Clear action.",
"Polished the Stats Filter layout with smaller labels, clearer selected states, compact EM typography, and dedicated Index, DPS, Damage, Health, Hard Carapace, and Vital Surge icons.",
"Fixed self-only passives such as Vital Surge so they no longer appear as or contribute through teammate passives.",
"Updated Skill Analysis trait handling so traits only appear on skills they actually affect, such as damage traits on damaging skills, Grace on healing skills, and vulnerability traits on vulnerability-applying skills.",
"Simplified Skill Analysis trait indicators to compact icon-and-name labels and moved them into the skill metadata row for a cleaner layout.",
"Improved cooldown modifier presentation: Fairy and Hasten now use compact icons while the cooldown value changes color to show the active modifier.",
"Added tier-aware Hasten cooldown colors: Hasten I uses blue, Hasten II uses purple, and Hasten III uses orange, with combined styling when Fairy and Hasten are active together.",
],
},
{
version: "v1.0.0",
date: "August 20, 2026",
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
"Added Experimental Mode to the bottom of Build Editor, collapsed by default.",
"Added optional experimental level support for levels 106–110 while keeping level 105 as the normal in-game maximum.",
"Updated the level selector and growth graph to extend to 110 only when experimental levels are enabled.",
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
                    {releases.map((release) => (
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

                            {release.version === "v1.0.0" && (
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
