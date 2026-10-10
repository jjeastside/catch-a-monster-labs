import { PageHeading } from "../components/page-heading";
import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";
import { gamePatches } from "../data/game-patches";

export const metadata: Metadata = {
    title: "Patch Notes — Cam Lab",
    description: "Catch a Monster patch notes and game updates tracked by Cam Lab.",
};


export default function UpdatesPage() {
    return (
        <div className="min-h-screen bg-[#0b111a] text-[#f6f8fc]">
            <TopNavigation />

            <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-8 [&_img]:!size-16 sm:[&_img]:!size-[72px]"><PageHeading title="Patch Notes" image="/icons/patch-notes.png">Follow the latest <span className="text-[#ffd53d]">game updates and events.</span></PageHeading></div>

                <div className="space-y-5">
                    {gamePatches.map((patch) => (
                        <section
                            key={`${patch.version}-${patch.date}`}
                            className="overflow-hidden rounded-xl border border-[#344050] bg-[#141c28]"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#344050] px-4 py-4 sm:px-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#e3e8f1]">
                                            {patch.version}
                                        </h2>
                                        {patch.label && (
                                            <span className="rounded-full border border-[#7182ff]/40 bg-[#202846] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#aeb8ff]">
                                                {patch.label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-[#7f8b9e]">{patch.date}</p>
                                </div>
                            </div>

                            <div className="divide-y divide-[#293140]">
                                {patch.sections.map((section) => (
                                    <div key={section.title} className="px-4 py-4 sm:px-5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="text-sm font-bold text-[#e3e8f1]">
                                                {section.title}
                                            </h3>
                                            {section.date && (
                                                <span className="text-xs text-[#7f8b9e]">{section.date}</span>
                                            )}
                                        </div>
                                        <ul className="mt-2 space-y-2.5">
                                            {section.changes.map((change) => (
                                                <li key={change} className="flex gap-3 text-sm leading-6 text-[#bfc7d5]">
                                                    <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#7182ff]" />
                                                    <span>{change}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
