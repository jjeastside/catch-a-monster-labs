import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LegacyHashRedirect } from "./components/legacy-hash-redirect";
import { SiteFooter } from "./components/site-footer";
import { TopNavigation } from "./components/top-navigation";
import { releases } from "./data/changelog-releases";
import { GENERATED_MONSTERS } from "./data/generated/monsters";
import { GENERATED_SKILLS } from "./data/generated/skills";
import { assetPath } from "./lib/asset-path";

export const metadata: Metadata = {
    title: "Cam Lab — Catch a Monster Companion",
    description:
        "Plan builds, compare monsters, browse Catch a Monster data, build teams, and track your Index with Cam Lab.",
    alternates: {
        canonical: "https://jjeastside.github.io/catch-a-monster-labs/",
    },
};

type IconName =
    | "calculator"
    | "book"
    | "index"
    | "wrench"
    | "users"
    | "heart"
    | "bolt"
    | "star"
    | "info"
    | "sparkles"
    | "github"
    | "arrow"
    | "compare"
    | "team"
    | "gear";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
    const props = {
        className: `block shrink-0 ${className}`,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        focusable: false,
        "aria-hidden": true,
    };

    if (name === "calculator") return <svg {...props}><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8v3H8zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/></svg>;
    if (name === "book") return <svg {...props}><path d="M4 4.5A3.5 3.5 0 0 1 7.5 3H11v16H7.5A3.5 3.5 0 0 0 4 20.5Z"/><path d="M20 4.5A3.5 3.5 0 0 0 16.5 3H13v16h3.5a3.5 3.5 0 0 1 3.5 1.5Z"/></svg>;
    if (name === "index") return <svg {...props}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/><path d="M16 15v4m-2-2h4"/></svg>;
    if (name === "wrench") return <svg {...props}><path d="M14.7 6.3a4 4 0 0 0-5.2-4.8l2.2 2.2-2.8 2.8-2.2-2.2a4 4 0 0 0 4.8 5.2l7.1 7.1a2 2 0 1 1-2.8 2.8l-7.1-7.1"/></svg>;
    if (name === "users") return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.8M17 3.2a4 4 0 0 1 0 7.6"/></svg>;
    if (name === "heart") return <svg {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
    if (name === "bolt") return <svg {...props}><path d="m13 2-9 12h7l-1 8 10-13h-7z"/></svg>;
    if (name === "star") return <svg {...props}><path d="m12 2 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2Z"/></svg>;
    if (name === "info") return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>;
    if (name === "sparkles") return <svg {...props}><path d="m12 3 1.2 3.4L16.5 8l-3.3 1.6L12 13l-1.2-3.4L7.5 8l3.3-1.6L12 3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.8 2.2L22 16l-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13Z"/></svg>;
    if (name === "github") return <svg {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.1.2S17.9-.2 15 1.7a13.4 13.4 0 0 0-7 0C5.1-.2 3.9.2 3.9.2A5.4 5.4 0 0 0 3.7 3a5.8 5.8 0 0 0-1.5 4.1c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 8 18v4M8 19c-3 .9-3-1.5-4.2-2"/></svg>;
    if (name === "compare") return <svg {...props}><path d="M7 7h12l-3-3m3 3-3 3M17 17H5l3 3m-3-3 3-3"/></svg>;
    if (name === "team") return <svg {...props}><circle cx="12" cy="8" r="3"/><circle cx="5" cy="10" r="2"/><circle cx="19" cy="10" r="2"/><path d="M7.5 20v-1.4A4.5 4.5 0 0 1 12 14.1a4.5 4.5 0 0 1 4.5 4.5V20M1.8 20v-.8A3.2 3.2 0 0 1 5 16M22.2 20v-.8A3.2 3.2 0 0 0 19 16"/></svg>;
    if (name === "gear") return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2M12 19.2v2M21.2 12h-2M4.8 12h-2M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4M18.5 18.5l-1.4-1.4M6.9 6.9 5.5 5.5"/><circle cx="12" cy="12" r="7"/></svg>;
    return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}

const uniquePassiveCount = new Set(
    GENERATED_MONSTERS.flatMap((monster) => (monster.passives ?? []).map((passive) => passive.id)),
).size;
const sourceRecordCount = GENERATED_MONSTERS.reduce((total, monster) => total + monster.sources.length, 0);
const latestRelease = releases[0];

const featureCards = [
    {
        title: "Build Calculator",
        description: "Plan builds and calculate combat stats, skill damage, DPS, healing, equipment, traits, and more.",
        href: "/calculator",
        navIcon: "/icons/monster-calculator.png",
        preview: "calculator",
        previewAlt: "Cam Lab Build Calculator preview",
        previewFit: "cover" as const,
    },
    {
        title: "Monster Database",
        description: "Explore every monster, skill, passive, source, evolution, and location in one searchable reference.",
        href: "/monster-database",
        navIcon: "/icons/monster-database.png",
        preview: "database",
        previewAlt: "Cam Lab Monster Database preview",
        previewFit: "cover" as const,
    },
    {
        title: "Index Tracker",
        description: "Track collection progress, ranks, mutations, breeding genders, planning goals, and total Index score.",
        href: "/index-tracker",
        navIcon: "/icons/index.png",
        preview: "index",
        previewAlt: "Cam Lab Index Tracker preview",
        previewFit: "cover" as const,
    },
    {
        title: "Monster Compare",
        description: "Compare two to four monsters side by side with shared settings, custom builds, and account multipliers.",
        href: "/compare",
        navIcon: "/icons/monster-compare.png",
        preview: "compare",
        previewAlt: "Cam Lab Monster Compare preview",
        previewFit: "cover" as const,
    },
    {
        title: "Team Builder",
        description: "Build three-monster teams, manage equipment, review team stats, and plan around different combat goals.",
        href: "/team",
        navIcon: "/team-builder.png",
        preview: "team-builder",
        previewAlt: "Cam Lab Team Builder preview",
        previewFit: "cover" as const,
    },
    {
        title: "Patch Notes",
        description: "Stay current with Catch a Monster game updates, new monsters, balance changes, and important additions.",
        href: "/updates",
        navIcon: "/icons/patch-notes.png",
        preview: null,
        previewAlt: "",
        previewFit: "cover" as const,
    },
];

function MiniMonster({ name, image, meta }: { name: string; image: string; meta?: string }) {
    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#1d3f61] bg-[#0a1b2d] px-2 py-2">
            <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-[#10273a]">
                <Image src={assetPath(image)} alt="" width={36} height={36} unoptimized aria-hidden="true" className="size-9 object-contain" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-[10px] font-black text-white">{name}</p>
                {meta ? <p className="truncate text-[8px] text-[#7f94b1]">{meta}</p> : null}
            </div>
        </div>
    );
}

function BuildCalculatorPreview() {
    return (
        <div className="mt-5 h-[174px] overflow-hidden rounded-xl border border-[#214a79] bg-[#071526] p-3 shadow-inner shadow-black/40">
            <div className="flex items-center justify-between gap-3 border-b border-[#173858] pb-2">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#46c8ff]">Build Calculator</p>
                    <p className="text-[8px] text-[#7188a7]">Monster · Results · Build</p>
                </div>
                <span className="rounded-md border border-[#225176] bg-[#0a2033] px-2 py-1 text-[8px] font-bold text-[#8fc8ed]">Lv 115 · SS</span>
            </div>
            <div className="mt-2 grid grid-cols-[1.05fr_1.2fr_.95fr] gap-2">
                <div className="space-y-1.5">
                    <MiniMonster name="Dummee" image="/monster-artwork/dummee.png" meta="Common" />
                    <MiniMonster name="Leafet" image="/monster-artwork/leafet.png" meta="Grass" />
                </div>
                <div className="rounded-lg border border-[#1d3f61] bg-[#08192a] p-2">
                    <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#6f96be]">Combat Stats</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <div className="rounded-md bg-[#0c2237] p-2"><p className="text-[7px] text-[#6f86a4]">Damage</p><p className="mt-0.5 text-[11px] font-black text-white">509.7B</p></div>
                        <div className="rounded-md bg-[#0c2237] p-2"><p className="text-[7px] text-[#6f86a4]">Health</p><p className="mt-0.5 text-[11px] font-black text-white">2.407T</p></div>
                        <div className="rounded-md bg-[#0c2237] p-2"><p className="text-[7px] text-[#6f86a4]">Crit</p><p className="mt-0.5 text-[11px] font-black text-[#ffd857]">60%</p></div>
                        <div className="rounded-md bg-[#0c2237] p-2"><p className="text-[7px] text-[#6f86a4]">Skill DPS</p><p className="mt-0.5 text-[11px] font-black text-[#55d5ff]">436.4B</p></div>
                    </div>
                </div>
                <div className="rounded-lg border border-[#1d3f61] bg-[#08192a] p-2">
                    <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#6f96be]">Build</p>
                    <div className="mt-2 space-y-1.5 text-[8px]">
                        <div className="flex justify-between rounded-md bg-[#0c2237] px-2 py-1.5"><span className="text-[#7f94b1]">Rank</span><b className="text-[#ff6374]">SS</b></div>
                        <div className="flex justify-between rounded-md bg-[#0c2237] px-2 py-1.5"><span className="text-[#7f94b1]">Enh.</span><b className="text-[#65bfff]">+10</b></div>
                        <div className="flex justify-between rounded-md bg-[#0c2237] px-2 py-1.5"><span className="text-[#7f94b1]">GP</span><b className="text-white">60%</b></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MonsterDatabasePreview() {
    return (
        <div className="mt-5 h-[174px] overflow-hidden rounded-xl border border-[#214a79] bg-[#071526] p-3 shadow-inner shadow-black/40">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#63b8ff]">Cam Lab</p>
                    <p className="text-[15px] font-black text-white">Monster Database</p>
                </div>
                <span className="text-[8px] font-bold text-[#7f94b1]">251 monsters</span>
            </div>
            <div className="mt-2 flex gap-2">
                <div className="flex-1 rounded-md border border-[#1e3f62] bg-[#08192a] px-2 py-1.5 text-[8px] text-[#617a99]">Search monsters...</div>
                <div className="rounded-md border border-[#1e3f62] bg-[#0a1b2d] px-2 py-1.5 text-[8px] font-bold text-[#93abc7]">Filters</div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
                <MiniMonster name="Dummee" image="/monster-artwork/dummee.png" meta="Common · Air Bullet" />
                <MiniMonster name="Leafet" image="/monster-artwork/leafet.png" meta="Grass · Starter" />
                <MiniMonster name="Wattoad" image="/monster-artwork/wattoad.png" meta="Water · Starter" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[8px] text-[#7087a5]"><span>Sort: Index</span><span>Rarity · Element · Source</span></div>
        </div>
    );
}

function IndexTrackerPreview() {
    return (
        <div className="mt-5 h-[174px] overflow-hidden rounded-xl border border-[#214a79] bg-[#071526] p-3 shadow-inner shadow-black/40">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#ffbd2f]">Index Tracker</p>
                    <p className="text-[8px] text-[#7f94b1]">Collection progress and planning</p>
                </div>
                <span className="rounded-md border border-[#31532b] bg-[#102719] px-2 py-1 text-[8px] font-black text-[#67df77]">95 / 234</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-[#1e3f62] bg-[#08192a] p-2 text-center"><p className="text-[7px] uppercase text-[#7087a5]">Current Score</p><p className="mt-1 text-[16px] font-black text-[#39bfff]">1,983</p></div>
                <div className="rounded-lg border border-[#1e3f62] bg-[#08192a] p-2 text-center"><p className="text-[7px] uppercase text-[#7087a5]">Complete</p><p className="mt-1 text-[16px] font-black text-[#5ee273]">41%</p></div>
                <div className="rounded-lg border border-[#1e3f62] bg-[#08192a] p-2 text-center"><p className="text-[7px] uppercase text-[#7087a5]">Remaining</p><p className="mt-1 text-[16px] font-black text-white">139</p></div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#10243a]"><div className="h-full w-[41%] rounded-full bg-gradient-to-r from-[#29a9ff] to-[#54df74]" /></div>
            <div className="mt-2 grid grid-cols-3 gap-2">
                <MiniMonster name="Dummee" image="/monster-artwork/dummee.png" meta="SS · 21 / 21" />
                <MiniMonster name="Leafet" image="/monster-artwork/leafet.png" meta="S · 17 / 21" />
                <MiniMonster name="Wattoad" image="/monster-artwork/wattoad.png" meta="A · 13 / 21" />
            </div>
        </div>
    );
}

function MonsterComparePreview() {
    return (
        <div className="mt-5 h-[174px] overflow-hidden rounded-xl border border-[#214a79] bg-[#071526] p-3 shadow-inner shadow-black/40">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-md bg-[#0a2035] p-1 text-[7px] font-bold">
                    <span className="rounded bg-[#1688f4] px-2 py-1 text-white">Shared Settings</span>
                    <span className="px-2 py-1 text-[#7790ae]">Custom Builds</span>
                </div>
                <span className="text-[8px] text-[#7087a5]">2 / 4 monsters</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
                {[{name:"Dummee", image:"/monster-artwork/dummee.png", damage:"24.8K", health:"116K", dps:"13.2K"},{name:"Leafet", image:"/monster-artwork/leafet.png", damage:"28.1K", health:"104K", dps:"15.7K"}].map((monster) => (
                    <div key={monster.name} className="rounded-lg border border-[#1e3f62] bg-[#08192a] p-2">
                        <div className="flex items-center gap-2">
                            <div className="grid size-8 place-items-center rounded-md bg-[#10273a]"><Image src={assetPath(monster.image)} alt="" width={32} height={32} unoptimized aria-hidden="true" className="size-8 object-contain" /></div>
                            <div><p className="text-[10px] font-black text-white">{monster.name}</p><p className="text-[7px] text-[#7188a7]">Lv 115 · SS · +10</p></div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                            <div className="rounded bg-[#0c2237] px-1 py-1.5"><p className="text-[6px] uppercase text-[#6f86a4]">Damage</p><p className="text-[9px] font-black text-white">{monster.damage}</p></div>
                            <div className="rounded bg-[#0c2237] px-1 py-1.5"><p className="text-[6px] uppercase text-[#6f86a4]">Health</p><p className="text-[9px] font-black text-white">{monster.health}</p></div>
                            <div className="rounded bg-[#0c2237] px-1 py-1.5"><p className="text-[6px] uppercase text-[#6f86a4]">DPS</p><p className="text-[9px] font-black text-[#55d5ff]">{monster.dps}</p></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-md border border-[#1e3f62] bg-[#091a2c] px-2 py-1.5 text-[7px] text-[#7f94b1]"><span>Account Multipliers</span><span>Best values highlighted</span></div>
        </div>
    );
}

function FeaturePreview({ preview }: { preview: string | null }) {
    if (preview === "calculator") return <BuildCalculatorPreview />;
    if (preview === "database") return <MonsterDatabasePreview />;
    if (preview === "index") return <IndexTrackerPreview />;
    if (preview === "compare") return <MonsterComparePreview />;
    if (preview === "team-builder") return <TeamBuilderPreview />;
    return <PatchPreview />;
}

function TeamBuilderPreview() {
    const members = [
        { name: "Dummee", image: "/monster-artwork/dummee.png" },
        { name: "Leafet", image: "/monster-artwork/leafet.png" },
        { name: "Wattoad", image: "/monster-artwork/wattoad.png" },
    ];

    return (
        <div className="mt-5 h-[174px] overflow-hidden rounded-xl border border-[#214a79] bg-[#071526] p-3 shadow-inner shadow-black/40">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Image src={assetPath("/team-builder.png")} alt="" width={22} height={22} unoptimized aria-hidden="true" className="size-[22px] object-contain" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#60baff]">Team Composition</p>
                        <p className="text-[9px] text-[#7f94b1]">Build and compare a three-monster team</p>
                    </div>
                </div>
                <span className="rounded-md border border-[#23476d] bg-[#0b2137] px-2 py-1 text-[9px] font-bold text-[#9fc8ec]">3 / 3</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
                {members.map((member) => (
                    <div key={member.name} className="flex min-w-0 items-center gap-2 rounded-lg border border-[#1e3f62] bg-[#0a1b2d] px-2 py-2">
                        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-[#10273a]">
                            <Image src={assetPath(member.image)} alt="" width={36} height={36} unoptimized aria-hidden="true" className="size-9 object-contain" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[10px] font-black text-white">{member.name}</p>
                            <p className="text-[8px] text-[#7f94b1]">Lv 115 · SS</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 rounded-lg border border-[#1e3f62] bg-[#08192a] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#91b8dc]">Team Overview</span>
                    <div className="flex gap-3 text-[8px] text-[#7f94b1]">
                        <span>Damage</span><span>Health</span><span>Skill DPS</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PatchPreview() {
    return (
        <div className="mt-5 min-h-[174px] rounded-xl border border-[#214a79] bg-[#081322] p-4 shadow-inner shadow-black/40">
            <div className="flex items-center justify-between gap-3">
                <span className="rounded-md bg-[#5f4de8] px-2.5 py-1 text-[10px] font-black text-white">{latestRelease.version}</span>
                <span className="text-[10px] text-[#7187a8]">{latestRelease.date}</span>
            </div>
            <p className="mt-3 text-xs font-black text-[#e4f2ff]">{latestRelease.title ?? "Latest Cam Lab Improvements"}</p>
            <ul className="mt-2 space-y-2 text-[10px] leading-4 text-[#a9b8ce]">
                {latestRelease.changes.slice(0, 3).map((change) => (
                    <li key={change} className="line-clamp-2"><span className="mr-1.5 font-black text-[#4ce778]">+</span>{change}</li>
                ))}
            </ul>
        </div>
    );
}

export default function HomePage() {
    const recentReleases = releases.slice(0, 3);

    return (
        <div className="min-h-screen bg-[#030a16] text-[#f5f8ff]">
            <LegacyHashRedirect />
            <TopNavigation />

            <main>
                <section className="relative overflow-hidden border-b border-[#15345d] bg-[#030a16]">
                    <div className="absolute inset-y-0 left-1/2 w-full max-w-[1680px] -translate-x-1/2 overflow-hidden">
                        <Image
                            src={assetPath("/home/hero-background.webp")}
                            alt=""
                            fill
                            priority
                            unoptimized
                            sizes="(min-width: 1680px) 1680px, 100vw"
                            className="object-cover object-center"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,7,17,0.98)_0%,rgba(3,11,25,0.94)_25%,rgba(3,13,30,0.73)_43%,rgba(3,13,30,0.28)_61%,rgba(2,8,18,0.08)_78%),linear-gradient(180deg,rgba(2,8,18,0.06)_42%,rgba(2,8,18,0.58)_100%)]"
                        />
                    </div>

                    <div className="relative mx-auto grid min-h-[520px] w-full max-w-[1480px] items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,.92fr)_minmax(500px,1.08fr)] lg:px-10 lg:py-16 xl:px-14">
                        <div className="relative z-20 max-w-[670px]">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#60baff] drop-shadow-[0_2px_8px_rgba(0,0,0,.8)]">Catch a Monster Labs</p>
                            <h1 className="mt-4 max-w-[650px] text-[clamp(2.8rem,4.2vw,4.65rem)] font-black leading-[1.01] tracking-[-0.04em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.7)]">
                                Plan builds. Explore monsters. <span className="bg-gradient-to-r from-[#29e3f7] via-[#2ea8ff] to-[#5d8dff] bg-clip-text text-transparent">Track progress.</span>
                            </h1>
                            <p className="mt-6 max-w-[620px] text-base leading-7 text-[#d0d9e8] drop-shadow-[0_2px_8px_rgba(0,0,0,.8)] sm:text-lg">
                                Cam Lab brings the build calculator, Monster Database, comparison tools, team planning, and Index tracking together in one place for Catch a Monster players.
                            </p>
                            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                <Link href="/calculator" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#54c6ff] bg-gradient-to-b from-[#23b9ff] to-[#1688f4] px-6 py-3 text-sm font-black text-[#03101f] shadow-[0_12px_30px_rgba(14,145,255,0.25)] transition hover:brightness-110">
                                    <Icon name="calculator" className="size-5" /> Open Calculator <Icon name="arrow" className="size-4" />
                                </Link>
                                <Link href="/monster-database" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#3c72ba] bg-[#07152b]/85 px-6 py-3 text-sm font-black text-white shadow-lg shadow-black/20 backdrop-blur-sm transition hover:border-[#5aa7ff] hover:bg-[#0a203d]">
                                    <Icon name="book" className="size-5" /> Browse Monsters
                                </Link>
                            </div>
                            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-[#d1dceb] drop-shadow-[0_2px_7px_rgba(0,0,0,.8)]">
                                <span className="inline-flex items-center gap-2"><Icon name="users" className="size-5 text-[#31c7ff]" />Free to use</span>
                                <span className="inline-flex items-center gap-2"><Icon name="heart" className="size-5 text-[#5bb4ff]" />Community project</span>
                                <span className="inline-flex items-center gap-2"><Icon name="bolt" className="size-5 text-[#ffc52f]" />Regularly updated</span>
                            </div>
                        </div>

                        <div className="relative hidden h-[430px] lg:block" aria-hidden="true" />
                    </div>
                </section>

                <section className="border-b border-[#17345b] bg-[#040b18] px-4 py-5 sm:px-6 lg:px-8">
                    <div className="mx-auto grid w-full max-w-[1480px] gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {featureCards.map((feature) => (
                            <Link key={feature.title} href={feature.href} className="group rounded-2xl border border-[#1b4777] bg-[linear-gradient(150deg,#07172d,#06101f)] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-[#2d75b9] hover:bg-[#081b34]">
                                <div className="flex items-start justify-between gap-4">
                                    <Image
                                        src={assetPath(feature.navIcon)}
                                        alt=""
                                        width={48}
                                        height={48}
                                        unoptimized
                                        aria-hidden="true"
                                        className="size-11 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,.35)] sm:size-12"
                                    />
                                    <span className="grid size-9 place-items-center rounded-full border border-[#214a77] bg-[#0b1b31] text-[#6f9fd2] transition group-hover:border-[#3c83c8] group-hover:text-white"><Icon name="arrow" className="size-4" /></span>
                                </div>
                                <h2 className="mt-3 text-xl font-black tracking-tight text-white">{feature.title}</h2>
                                <p className="mt-2 min-h-[68px] text-sm leading-6 text-[#b7c4d6]">{feature.description}</p>
                                <FeaturePreview preview={feature.preview} />
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="relative overflow-hidden border-b border-[#17345b] bg-[#030a16] py-3 sm:px-6 sm:py-4 lg:px-8">
                    <div className="relative mx-auto min-h-[210px] w-full max-w-[1380px] overflow-hidden border-y border-[#17345b] bg-[#061426] sm:aspect-[3.45/1] sm:min-h-0 sm:rounded-2xl sm:border">
                        <Image
                            src={assetPath("/home/build-smarter-background.webp")}
                            alt="Leafet and Flamix in a moonlit forest"
                            fill
                            unoptimized
                            sizes="(min-width: 1480px) 1480px, 100vw"
                            className="object-cover object-[center_42%]"
                        />
                        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,9,19,.08)_0%,rgba(3,12,26,.22)_28%,rgba(3,12,26,.72)_43%,rgba(3,12,26,.78)_57%,rgba(3,12,26,.22)_72%,rgba(2,9,19,.08)_100%)]" />
                        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                            <div className="max-w-[720px] drop-shadow-[0_3px_12px_rgba(0,0,0,.9)]">
                                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">Builds, comparisons, team planning, and collection tracking.</h2>
                                <p className="mx-auto mt-2 max-w-[670px] text-xs leading-5 text-[#d6e0ed] sm:text-sm sm:leading-6">
                                    Cam Lab combines the Build Calculator, Monster Database, Monster Compare, Team Builder, and Index Tracker in one place.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#040b18] px-4 py-7 sm:px-6 lg:px-8">
                    <div className="mx-auto grid w-full max-w-[1480px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { icon: "users" as IconName, value: `${GENERATED_MONSTERS.length}+`, label: "Monsters", accent: "text-[#35caff]" },
                            { icon: "gear" as IconName, value: `${Object.keys(GENERATED_SKILLS).length}+`, label: "Skills", accent: "text-[#5aa8ff]" },
                            { icon: "star" as IconName, value: `${uniquePassiveCount}+`, label: "Passives", accent: "text-[#ffc62f]" },
                            { icon: "book" as IconName, value: `${sourceRecordCount}+`, label: "Source Records", accent: "text-[#2ed8ee]" },
                        ].map((stat) => (
                            <div key={stat.label} className="flex min-h-28 items-center justify-center gap-5 rounded-2xl border border-[#1a4779] bg-[#07172c] px-6 py-5 shadow-[0_14px_30px_rgba(0,0,0,.22)]">
                                <span className={stat.accent}><Icon name={stat.icon} className="size-10" /></span>
                                <div><p className="text-3xl font-black text-white">{stat.value}</p><p className="text-sm font-bold text-[#9eb3cf]">{stat.label}</p></div>
                            </div>
                        ))}
                    </div>

                    <div className="mx-auto mt-5 grid w-full max-w-[1480px] gap-5 lg:grid-cols-[1.08fr_.92fr]">
                        <section className="rounded-2xl border border-[#1b4777] bg-[#071426] p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="flex items-center gap-3 text-xl font-black text-white"><span className="text-[#27c4ff]"><Icon name="wrench" /></span>Latest Updates</h2>
                                <Link href="/changelog" className="inline-flex items-center gap-2 rounded-lg border border-[#286ac0] px-3 py-2 text-xs font-bold text-[#66b9ff] transition hover:bg-[#0a203e]">View All <Icon name="arrow" className="size-3.5" /></Link>
                            </div>
                            <div className="mt-4 space-y-3">
                                {recentReleases.map((release) => (
                                    <div key={release.version} className="grid gap-3 rounded-xl border border-[#1d3d64] bg-[#08182b] p-4 sm:grid-cols-[84px_1fr_auto] sm:items-start">
                                        <span className="w-fit rounded-lg bg-gradient-to-b from-[#6555e7] to-[#4355c9] px-3 py-1.5 text-xs font-black text-white">{release.version}</span>
                                        <div>
                                            <h3 className="text-sm font-black text-white">{release.title ?? "Cam Lab Improvements"}</h3>
                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#9fb0c7]">{release.changes[0]}</p>
                                        </div>
                                        <span className="text-[11px] text-[#7085a4]">{release.date}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#1b4777] bg-[#071426] p-5 sm:p-6">
                            <h2 className="flex items-center gap-3 text-xl font-black text-white"><span className="text-[#59acff]"><Icon name="info" /></span>About Cam Lab</h2>
                            <p className="mt-4 text-sm leading-6 text-[#b6c3d6]">Cam Lab is a fan-made website created by a player, for players. The goal is to make Catch a Monster more accessible, organized, and enjoyable for everyone.</p>
                            <div className="mt-5 space-y-3">
                                {[
                                    ["heart" as IconName, "Community Focused", "Built with and for the CAM community.", "text-[#a676ff]"],
                                    ["sparkles" as IconName, "Accurate & Reliable", "Continuously updated with tested game data.", "text-[#ffd23d]"],
                                    ["github" as IconName, "Open Development", "Follow Cam Lab's public development and changelog.", "text-[#7794ff]"],
                                ].map(([icon, title, text, accent]) => (
                                    <div key={title} className="flex items-center gap-3 rounded-xl border border-[#1e426b] bg-[#08182b] px-4 py-3">
                                        <span className={accent as string}><Icon name={icon as IconName} className="size-6" /></span>
                                        <div><h3 className="text-sm font-black text-white">{title}</h3><p className="text-xs text-[#92a5c0]">{text}</p></div>
                                    </div>
                                ))}
                            </div>
                            <Link href="/about" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#4db8ff] bg-gradient-to-r from-[#24aaff] to-[#5e8dff] px-4 py-3 text-sm font-black text-[#03101f] transition hover:brightness-110">Learn More About Cam Lab <Icon name="arrow" className="size-4" /></Link>
                        </section>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
