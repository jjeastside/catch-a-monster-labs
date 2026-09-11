import { PageHeading } from "../components/page-heading";
import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";
import { releases } from "../data/changelog-releases";

export const metadata: Metadata = {
    title: "Changelog — Cam Lab",
    description: "Recent Cam Lab updates, fixes, and new Catch a Monster calculator features.",
};

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-[#0b111a] text-[#f6f8fc]">
            <TopNavigation />

            <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-8"><PageHeading title="Changelog" image="/icons/changelog.png">See what’s new in Cam Lab: <span className="text-[#ffb566]">features, improvements, and fixes.</span></PageHeading></div>

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
