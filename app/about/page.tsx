import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import camLabLogo from "../assets/cam-lab-logo.png";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
    title: "About — Cam Lab",
    description:
        "Learn about Cam Lab, an independent fan-made Catch a Monster companion for build planning, monster research, and clearer game calculations.",
};

const tools = [
    {
        title: "Build Calculator",
        description:
            "Plan a monster build and see how ranks, mutations, equipment, traits, passives, achievements, and combat conditions change the final result.",
        href: "/",
        action: "Open calculator",
        icon: "⌁",
    },
    {
        title: "Monster Database",
        description:
            "Browse Catch a Monster data in one place, compare monster stats, inspect skills and passives, and follow evolution families.",
        href: "/monster-database",
        action: "Browse monsters",
        icon: "◇",
    },
    {
        title: "Patch Notes",
        description:
            "Keep a readable history of Catch a Monster updates alongside the Cam Lab changelog so game changes and site changes stay separate.",
        href: "/updates",
        action: "View patch notes",
        icon: "↗",
    },
];

const principles = [
    {
        title: "Useful over flashy",
        description:
            "Cam Lab is built around information that helps with real decisions: what a build does, why the number changed, and what you may still be missing.",
    },
    {
        title: "Calculations you can inspect",
        description:
            "The goal is to make game mechanics easier to understand instead of hiding everything behind a single final number.",
    },
    {
        title: "Community-driven data",
        description:
            "Catch a Monster changes over time, so Cam Lab is updated as new monsters, skills, effects, progression systems, and balance changes are discovered.",
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0b111a] text-[#f6f8fc]">
            <TopNavigation />

            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
                <section className="relative overflow-hidden rounded-2xl border border-[#344050] bg-[#101722] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-[#7182ff]/10 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7182ff] to-transparent"
                    />

                    <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <div className="max-w-3xl">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7182ff]">
                                About the project
                            </p>
                            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                                Built to make Catch a Monster easier to understand.
                            </h1>
                            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#9ca8ba] sm:text-base">
                                Cam Lab is an independent fan-made companion for Catch a Monster. It brings build planning,
                                monster data, combat calculations, and update tracking together in one place so players can
                                spend less time doing manual math and more time testing ideas.
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href="/"
                                    className="rounded-lg bg-[#7182ff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#8391ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aeb8ff]"
                                >
                                    Open Calculator
                                </Link>
                                <a
                                    href="https://github.com/jjeastside/catch-a-monster-labs"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-[#3c485a] bg-[#141c28] px-4 py-2.5 text-sm font-semibold text-[#c5cedc] transition hover:border-[#7182ff]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7182ff]/60"
                                >
                                    View on GitHub ↗
                                </a>
                            </div>
                        </div>

                        <div className="mx-auto flex w-full max-w-[230px] flex-col items-center rounded-2xl border border-[#344050] bg-[#0b111a]/70 p-6 text-center shadow-2xl shadow-black/20">
                            <Image
                                src={camLabLogo}
                                alt="Cam Lab logo"
                                priority
                                unoptimized
                                className="size-28 object-contain"
                            />
                            <p className="mt-4 text-xl font-black tracking-tight">
                                CAM<span className="text-[#7182ff]">/</span>LAB
                            </p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#69768a]">
                                Roblox fan-made companion
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-10">
                    <div className="max-w-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">
                            What Cam Lab does
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            Tools built around the game
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-[#8e99ad]">
                            Each part of Cam Lab is meant to answer a practical question without making you jump between spreadsheets, screenshots, and calculators.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {tools.map((tool) => (
                            <article
                                key={tool.title}
                                className="flex min-h-64 flex-col rounded-xl border border-[#344050] bg-[#141c28] p-5"
                            >
                                <div className="grid size-10 place-items-center rounded-lg border border-[#7182ff]/30 bg-[#202846] text-lg font-black text-[#aeb8ff]">
                                    {tool.icon}
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-[#e7ebf2]">{tool.title}</h3>
                                <p className="mt-2 flex-1 text-sm leading-6 text-[#929daf]">
                                    {tool.description}
                                </p>
                                <Link
                                    href={tool.href}
                                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7182ff] transition hover:text-[#aeb8ff]"
                                >
                                    {tool.action} <span aria-hidden="true">→</span>
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
                    <div className="rounded-xl border border-[#344050] bg-[#141c28] p-5 sm:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">
                            Project philosophy
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight">How it is being built</h2>

                        <div className="mt-6 divide-y divide-[#293140]">
                            {principles.map((principle, index) => (
                                <div key={principle.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#445168] bg-[#0f1620] text-xs font-bold text-[#7182ff]">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-[#e3e8f1]">{principle.title}</h3>
                                        <p className="mt-1.5 text-sm leading-6 text-[#8e99ad]">{principle.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="rounded-xl border border-[#344050] bg-[#101722] p-5 sm:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">
                            Independent project
                        </p>
                        <h2 className="mt-2 text-xl font-bold tracking-tight">Made by a player, for players.</h2>
                        <p className="mt-3 text-sm leading-6 text-[#8e99ad]">
                            Cam Lab is maintained as a community-focused project and is not an official Catch a Monster or Roblox product.
                        </p>

                        <div className="mt-6 rounded-lg border border-[#344050] bg-[#0b111a] p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f8b9e]">Creator</p>
                            <a
                                href="https://github.com/jjeastside"
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-sm font-semibold text-[#7182ff] transition hover:text-[#aeb8ff]"
                            >
                                @jjeastside ↗
                            </a>
                        </div>

                        <p className="mt-5 text-xs leading-5 text-[#69768a]">
                            Cam Lab is not affiliated with, endorsed by, or sponsored by Roblox Corporation or LDS II. All trademarks belong to their respective owners.
                        </p>
                    </aside>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
