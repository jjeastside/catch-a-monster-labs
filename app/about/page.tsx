import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import camLabLogo from "../assets/cam-lab-logo.png";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
    title: "About — Cam Lab",
    description:
        "Cam Lab is an independent fan-made Catch a Monster companion for build planning, monster research, Index tracking, and clear game calculations.",
    alternates: {
        canonical: "https://jjeastside.github.io/catch-a-monster-labs/about/",
    },
    openGraph: {
        title: "About Cam Lab — Built for Catch a Monster Players",
        description:
            "Plan builds, explore monsters, track your Index, and keep up with Catch a Monster updates.",
        type: "website",
        siteName: "Cam Lab",
        url: "https://jjeastside.github.io/catch-a-monster-labs/about/",
        images: [
            {
                url: "https://jjeastside.github.io/catch-a-monster-labs/about-preview.png",
                width: 1162,
                height: 749,
                alt: "Cam Lab About page featuring the build calculator, monster database, patch notes, and Index Tracker",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "About Cam Lab — Built for Catch a Monster Players",
        description:
            "Plan builds, explore monsters, track your Index, and keep up with Catch a Monster updates.",
        images: ["https://jjeastside.github.io/catch-a-monster-labs/about-preview.png"],
    },
};

type IconName =
    | "calculator"
    | "monster"
    | "notes"
    | "chart"
    | "search"
    | "accuracy"
    | "community"
    | "rocket"
    | "code"
    | "shield"
    | "star";

function Icon({ name, className = "size-7" }: { name: IconName; className?: string }) {
    const common = {
        className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        "aria-hidden": true,
    };

    if (name === "calculator") {
        return <svg {...common}><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8v3H8zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/></svg>;
    }
    if (name === "monster") {
        return <svg {...common}><path d="M5 7 3.5 3.5 8 5.2A9 9 0 0 1 12 4c1.5 0 2.8.4 4 1.2l4.5-1.7L19 7a8 8 0 1 1-14 0Z"/><path d="M8.5 11.5h.01M15.5 11.5h.01M9.5 16c1.7 1.1 3.3 1.1 5 0"/></svg>;
    }
    if (name === "notes") {
        return <svg {...common}><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 7h7M8.5 11h7M8.5 15h4.5"/></svg>;
    }
    if (name === "chart") {
        return <svg {...common}><path d="M4 20V10M10 20V5M16 20v-8M22 20H2M15 7l3-3 3 3M18 4v7"/></svg>;
    }
    if (name === "search") {
        return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>;
    }
    if (name === "accuracy") {
        return <svg {...common}><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>;
    }
    if (name === "community") {
        return <svg {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-1.5a4 4 0 0 0-3-3.9M16 2.7a4 4 0 0 1 0 7.7"/></svg>;
    }
    if (name === "rocket") {
        return <svg {...common}><path d="M14 6c3-3 6-3 7-3 0 1 0 4-3 7l-3 3-4-4 3-3ZM11 9 6 8l-3 3 5 2M15 13l1 5-3 3-2-5M6 18c-1.5 1.5-4 1-4 1s-.5-2.5 1-4"/><circle cx="16.5" cy="7.5" r="1"/></svg>;
    }
    if (name === "code") {
        return <svg {...common}><path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18"/></svg>;
    }
    if (name === "shield") {
        return <svg {...common}><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-5"/></svg>;
    }
    return <svg {...common}><path d="m12 2 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2Z"/></svg>;
}

const tools: { title: string; description: string; href: string; icon: IconName; accent: string }[] = [
    {
        title: "Build Calculator",
        description: "Plan and optimize your builds with powerful calculations and real-time results.",
        href: "/",
        icon: "calculator",
        accent: "text-[#58a9ff] border-[#1464b9] bg-[#092548]",
    },
    {
        title: "Monster Database",
        description: "Browse monsters, stats, abilities, evolutions, and rarity information in one place.",
        href: "/monster-database",
        icon: "monster",
        accent: "text-[#a778ff] border-[#613bb1] bg-[#24134d]",
    },
    {
        title: "Patch Notes / Changelog",
        description: "Stay up to date with the latest game changes and Cam Lab improvements.",
        href: "/updates",
        icon: "notes",
        accent: "text-[#4facff] border-[#165b9e] bg-[#08294d]",
    },
    {
        title: "Index Tracker",
        description: "Track your Index score, monster ranks, mutations, and collection goals.",
        href: "/index-tracker",
        icon: "chart",
        accent: "text-[#61a7ff] border-[#1b5894] bg-[#0a2546]",
    },
];

const focuses: { title: string; description: string; icon: IconName; color: string }[] = [
    {
        title: "Clarity",
        description: "We turn complex formulas and mechanics into clear, easy-to-understand tools and insights.",
        icon: "search",
        color: "text-[#67a1ff]",
    },
    {
        title: "Accuracy",
        description: "Data is carefully tested and verified against in-game results to deliver reliable numbers.",
        icon: "accuracy",
        color: "text-[#55a8ff]",
    },
    {
        title: "Community",
        description: "Built for the community and shaped by feedback. Together, we make Cam Lab better.",
        icon: "community",
        color: "text-[#9b6cff]",
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#040b18] text-[#f4f7ff]">
            <TopNavigation />

            <main className="mx-auto w-full max-w-[1240px] px-3 pb-5 sm:px-5">
                <section className="relative overflow-hidden border-x border-b border-[#16345e] bg-[radial-gradient(circle_at_76%_16%,rgba(40,65,188,0.24),transparent_28rem),linear-gradient(145deg,#07152b_0%,#040d1c_58%,#07142a_100%)] px-5 pb-7 pt-10 shadow-2xl shadow-black/30 sm:rounded-b-2xl sm:px-10 lg:px-14 lg:pb-10 lg:pt-12">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle,#3f64ff_1px,transparent_1px)] [background-position:78%_14%] [background-size:86px_72px]" />

                    <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)]">
                        <div className="max-w-[610px]">
                            <p className="text-xs font-bold uppercase tracking-[0.19em] text-[#55adff]">About Cam Lab</p>
                            <h1 className="mt-3 text-[clamp(2.6rem,6vw,4.45rem)] font-black leading-[.98] tracking-[-0.045em]">
                                Built for Catch a<br className="hidden sm:block" /> Monster players
                            </h1>
                            <p className="mt-5 max-w-[570px] text-base leading-7 text-[#b5c1d8] sm:text-lg">
                                Cam Lab is a fan-made companion site for Catch a Monster on Roblox. We help you plan builds, check stats, explore monsters, track your Index, and keep up with the latest updates.
                            </p>
                        </div>

                        <div className="relative mx-auto flex h-[260px] w-full max-w-[430px] items-center justify-center sm:h-[330px] lg:h-[350px]">
                            <div aria-hidden="true" className="absolute size-64 rounded-full bg-[#243dff]/25 blur-3xl sm:size-80" />
                            <Image src={camLabLogo} alt="Cam Lab monster inside a laboratory flask" priority unoptimized className="relative h-full w-full object-contain drop-shadow-[0_0_22px_rgba(83,99,255,.58)]" />
                        </div>
                    </div>

                    <div className="relative mt-7 grid gap-4 sm:grid-cols-2 lg:mt-3 lg:grid-cols-4">
                        {tools.map((tool) => (
                            <Link key={tool.title} href={tool.href} className="group flex min-h-60 flex-col items-center rounded-xl border border-[#1f4375] bg-[#07152a]/80 px-5 py-6 text-center shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-[#4589e5] hover:bg-[#0a1b35]">
                                <span className={`grid size-[72px] place-items-center rounded-full border ${tool.accent}`}>
                                    <Icon name={tool.icon} className="size-9" />
                                </span>
                                <h2 className="mt-4 text-lg font-bold leading-6 text-white">{tool.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-[#aebbd1]">{tool.description}</p>
                                <span className="mt-auto pt-3 text-xs font-bold uppercase tracking-wider text-[#579eff] opacity-0 transition group-hover:opacity-100">Open tool →</span>
                            </Link>
                        ))}
                    </div>

                    <section className="relative mt-5 overflow-hidden rounded-xl border border-[#20436f] bg-[#061329]/75">
                        <h2 className="border-b border-[#19365c] px-5 py-4 text-xl font-bold">What Cam Lab focuses on</h2>
                        <div className="grid md:grid-cols-3">
                            {focuses.map((focus) => (
                                <div key={focus.title} className="flex gap-4 border-b border-[#17345a] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                                    <span className={`shrink-0 ${focus.color}`}><Icon name={focus.icon} className="size-12" /></span>
                                    <div>
                                        <h3 className="font-bold text-white">{focus.title}</h3>
                                        <p className="mt-1 text-sm leading-5 text-[#a9b5ca]">{focus.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="relative mt-5 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
                        <section className="rounded-xl border border-[#20436f] bg-[#061329]/75 p-5 sm:p-6">
                            <h2 className="text-xl font-bold">Why it exists</h2>
                            <p className="mt-3 text-sm leading-6 text-[#b3bfd4]">
                                Catch a Monster has deep systems and a lot of hidden math. Cam Lab exists to simplify that—providing tools that help players plan smarter, compare builds, and make informed decisions.
                            </p>
                            <p className="mt-3 text-sm leading-6 text-[#b3bfd4]">
                                We reverse-engineer, test, and visualize so you do not have to. Whether you are min-maxing or just curious, Cam Lab gives you the information you need to enjoy the game even more.
                            </p>
                            <div className="mt-5 flex items-center gap-4 rounded-lg border border-[#18375f] bg-[#071831] p-4">
                                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#122d5b] text-[#68a1ff]"><Icon name="star" className="size-7" /></span>
                                <p className="text-sm leading-5"><strong className="text-[#59a8ff]">100% independent. 0% affiliated.</strong><br/><span className="text-[#aebbd0]">Made by a fan, for the players.</span></p>
                            </div>
                        </section>

                        <section className="rounded-xl border border-[#20436f] bg-[#061329]/75 p-5 sm:p-6">
                            <h2 className="text-xl font-bold text-[#54a7ff]">Project status</h2>
                            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#52dda5]"><span className="size-3 rounded-full bg-[#52dda5] shadow-[0_0_12px_rgba(82,221,165,.7)]" />Currently in development</p>
                            <p className="mt-2 text-sm leading-5 text-[#aebbd0]">Cam Lab is actively developed and updated as new data and features become available. Feedback and suggestions help guide future improvements.</p>
                            <div className="mt-4 divide-y divide-[#17365d] overflow-hidden rounded-lg border border-[#1b3a64] bg-[#07172e]">
                                {[
                                    ["rocket", "Frequent updates", "New features and improvements regularly"],
                                    ["code", "Community-driven", "Suggestions shape the roadmap"],
                                    ["shield", "Always free", "No paywalls. Ever."],
                                ].map(([icon, title, description]) => (
                                    <div key={title} className="flex items-center gap-3 px-4 py-3">
                                        <span className="text-[#728dff]"><Icon name={icon as IconName} className="size-6" /></span>
                                        <p className="text-sm"><strong className="block text-white">{title}</strong><span className="text-xs text-[#9daac1]">{description}</span></p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
