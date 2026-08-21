import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
    title: "Update 0.45 — Cam Lab",
    description: "Catch a Monster Update 0.45 notes, including Coilwork City, Splash Isle quests and achievements, the Cog Event, and more.",
};

const updateSections = [
    {
        eyebrow: "New Island",
        title: "Coilwork City",
        description: "Coilwork City is now available!",
        accent: "border-[#7182ff]/35 bg-[#202846]/55 text-[#b7c0ff]",
    },
    {
        eyebrow: "Splash Isle",
        title: "New Quests & Achievements",
        description: "Added new map quests for Splash Isle and new achievements to complete.",
        accent: "border-[#4b96d8]/35 bg-[#18324a]/55 text-[#8bc9ff]",
    },
    {
        eyebrow: "Limited-Time Shop",
        title: "Dynamic Shop Rotation",
        description: "Added a dynamic Limited-Time Shop that opens periodically.",
        accent: "border-[#b07cff]/35 bg-[#2a1e3f]/55 text-[#d4b4ff]",
    },
    {
        eyebrow: "Live Event",
        title: "The Cog Event",
        description: "The Cog Event is now live!",
        accent: "border-[#e3a34d]/35 bg-[#3a2a18]/55 text-[#f2c77f]",
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
                            Update 0.45
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9da8ba] sm:text-base">
                            A new island, more Splash Isle progression, a rotating shop, and the Cog Event arrive in Update 0.45.
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

                    <div className="border-t border-[#344050] px-4 py-5 sm:px-6">
                        <div className="rounded-xl border border-[#4b596e] bg-[#151e2b] p-4 sm:p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7182ff]">Admin Abuse</p>
                            <h2 className="mt-1.5 text-lg font-bold text-[#edf1f7]">Two Time Zones</h2>
                            <p className="mt-1.5 text-sm leading-6 text-[#aab4c4]">
                                Admin Abuse will be held twice for different time zones.
                            </p>
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
