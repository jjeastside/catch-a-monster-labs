import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
    title: "Update 0.46 — Cam Lab",
    description: "Catch a Monster Update 0.46 notes, including the Coilwork City boss, Dragon Evolution Event, AbyssalDrake evolution, fixes, and codes through 0.46.2.",
};

const updateSections = [
    {
        eyebrow: "Coilwork City",
        title: "Brand-New Boss",
        description: "Coilwork City now features a brand-new boss.",
        accent: "border-[#ef6461]/35 bg-[#402021]/55 text-[#ffaaa7]",
    },
    {
        eyebrow: "Live Event",
        title: "Dragon Evolution Event",
        description: "The Dragon Evolution Event is now live.",
        accent: "border-[#69b97c]/35 bg-[#183526]/55 text-[#9ad9a8]",
    },
    {
        eyebrow: "Evolution",
        title: "AbyssalDrake Evolution",
        description: "A new evolution has been added for AbyssalDrake.",
        accent: "border-[#e3a34d]/35 bg-[#3a2a18]/55 text-[#f2c77f]",
    },
    {
        eyebrow: "Weekly Index",
        title: "Top 30 Titles",
        description: "Added time-limited titles for the top 30 players in weekly Index Points.",
        accent: "border-[#f0bd4b]/35 bg-[#3b2e16]/55 text-[#ffd77a]",
    },
    {
        eyebrow: "Roblox Plus",
        title: "Exclusive Title",
        description: "Added an exclusive title for Roblox Plus users.",
        accent: "border-[#7182ff]/35 bg-[#202846]/55 text-[#b7c0ff]",
    },
    {
        eyebrow: "Crafting",
        title: "Super Breeding Fruit",
        description: "Added a crafting recipe for Super Breeding Fruit.",
        accent: "border-[#dd5f70]/35 bg-[#3c1d27]/55 text-[#ff9cac]",
    },
    {
        eyebrow: "Drops",
        title: "More Normal Monster Items",
        description: "Normal monsters now drop more items.",
        accent: "border-[#9da8ba]/35 bg-[#252d38]/55 text-[#c9d0dc]",
    },
    {
        eyebrow: "Spire Tower Shop",
        title: "Islands 1–5 Rifts",
        description: "Added Islands 1–5 rifts to the Spire Tower Shop.",
        accent: "border-[#4b96d8]/35 bg-[#18324a]/55 text-[#8bc9ff]",
    },
];

const followUpUpdates = [
    {
        version: "Update 0.46.1",
        date: "August 28, 2026",
        title: "Bug Fixes & Achievebug Code",
        description: "Fixed some bugs. New Code: Achievebug. Old Code: Turret.",
    },
    {
        version: "Update 0.46.2",
        date: "August 29, 2026",
        title: "More Bug Fixes & mutatebug Code",
        description: "Fixed some bugs. New Code: mutatebug. Old Codes: achievebug, turret.",
    },
];

export default function UpdatePage() {
    return (
        <div className="min-h-screen bg-[#0b111a] text-[#f6f8fc]">
            <TopNavigation />

            <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
                <section className="overflow-hidden rounded-2xl border border-[#344050] bg-[#111925]">
                    <div className="border-b border-[#344050] bg-[radial-gradient(circle_at_top_right,rgba(113,130,255,0.16),transparent_42%)] px-5 py-7 sm:px-8 sm:py-9">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#7182ff]/40 bg-[#202846] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#aeb8ff]">
                                Catch a Monster
                            </span>
                            <span className="text-xs font-semibold text-[#7182ff]">Latest Game Update</span>
                        </div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                            Update 0.46
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9da8ba] sm:text-base">
                            Update 0.46 adds a new Coilwork City boss, the Dragon Evolution Event, a new AbyssalDrake evolution, progression rewards, crafting, drop changes, and new Spire Tower Shop rifts. The 0.46.1 and 0.46.2 follow-ups are included below.
                        </p>
                    </div>

                    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                        {updateSections.map((section) => (
                            <article key={section.title} className="rounded-xl border border-[#2e3949] bg-[#0f1620] p-4 sm:p-5">
                                <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.09em] ${section.accent}`}>
                                    {section.eyebrow}
                                </span>
                                <h2 className="mt-3 text-lg font-bold text-[#edf1f7]">{section.title}</h2>
                                <p className="mt-1.5 text-sm leading-6 text-[#9da8ba]">{section.description}</p>
                            </article>
                        ))}
                    </div>

                    <div className="border-t border-[#344050] p-4 sm:p-6">
                        <div className="overflow-hidden rounded-xl border border-[#4b596e] bg-[#151e2b]">
                            <div className="border-b border-[#344050] px-4 py-3 sm:px-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7182ff]">Update 0.46 Follow-Ups</p>
                            </div>
                            <div className="divide-y divide-[#344050]">
                                {followUpUpdates.map((update) => (
                                    <article key={update.version} className="p-4 sm:p-5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-xs font-bold text-[#c8d0ff]">{update.version}</p>
                                            <p className="text-xs text-[#7f8b9e]">{update.date}</p>
                                        </div>
                                        <h2 className="mt-1.5 text-lg font-bold text-[#edf1f7]">{update.title}</h2>
                                        <p className="mt-1.5 text-sm leading-6 text-[#aab4c4]">{update.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                    <Link href="/" className="rounded-lg bg-[#7182ff] px-4 py-2.5 font-bold text-white transition hover:bg-[#8493ff]">
                        Open Calculator
                    </Link>
                    <Link href="/changelog" className="rounded-lg border border-[#344050] bg-[#141c28] px-4 py-2.5 font-semibold text-[#bfc7d5] transition hover:border-[#536077] hover:text-white">
                        View Cam Lab Changelog
                    </Link>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
