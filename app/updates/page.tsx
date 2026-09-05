import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
    title: "Patch Notes — Cam Lab",
    description: "Catch a Monster patch notes and game updates tracked by Cam Lab.",
};

type PatchSection = {
    title: string;
    date?: string;
    changes: string[];
};

type Patch = {
    version: string;
    date: string;
    label?: string;
    sections: PatchSection[];
};

const patches: Patch[] = [
    {
        version: "Update 0.47",
        date: "September 5, 2026",
        label: "Latest",
        sections: [
            {
                title: "Rift Event",
                changes: [
                    "Added a Rift to Coilwork City.",
                    "The Rift Event is now live.",
                ],
            },
            {
                title: "Rewards & Shop",
                changes: [
                    "Added tiers for the Tower's daily rewards.",
                    "Reduced the prices of some items in the Dungeon Shop.",
                    "Added Roblox Plus to the shop purchase options.",
                ],
            },
            {
                title: "Coming Next & New Code",
                changes: [
                    "PVP Mode is planned for next week, as announced in Update 0.47.",
                    "New Code: stellawolf",
                ],
            },
        ],
    },
    {
        version: "Update 0.46",
        date: "August 28, 2026",
        sections: [
            {
                title: "Boss & Evolution",
                changes: [
                    "Coilwork City now features a brand-new boss.",
                    "Added a new evolution for AbyssalDrake.",
                ],
            },
            {
                title: "Progression & Rewards",
                changes: [
                    "Added time-limited titles for the top 30 players in weekly Index Points.",
                    "Added an exclusive title for Roblox Plus users.",
                ],
            },
            {
                title: "Crafting, Drops & Shop",
                changes: [
                    "Added a crafting recipe for Super Breeding Fruit.",
                    "Normal monsters now drop more items.",
                    "Added Islands 1–5 rifts to the Spire Tower Shop.",
                ],
            },
            {
                title: "Update 0.46.1",
                date: "August 28, 2026",
                changes: [
                    "Fixed some bugs.",
                    "New Code: Achievebug",
                    "Old Code: Turret",
                ],
            },
            {
                title: "Update 0.46.2",
                date: "August 29, 2026",
                changes: [
                    "Fixed some bugs.",
                    "New Code: mutatebug",
                    "Old Codes: achievebug, turret",
                ],
            },
        ],
    },
    {
        version: "Update 0.45",
        date: "August 21, 2026",
        sections: [
            {
                title: "Coilwork City",
                changes: [
                    "New Island: Coilwork City is now available.",
                    "Mechizza — Epic Fire monster obtained as a Natural Spawn on Coilwork City.",
                    "Geariff — Epic Common monster obtained as a Natural Spawn on Coilwork City.",
                    "Lynxgear — Legendary Common monster obtained as a Natural Spawn on Coilwork City.",
                    "Plaguecannon — Mythical Common monster obtained as a Natural Spawn on Coilwork City.",
                ],
            },
            {
                title: "Splash Isle",
                changes: [
                    "Added new map quests for Splash Isle.",
                    "Added a new Splash Isle Pet Quest.",
                    "Added a new Splash Isle Path of Progress quest.",
                ],
            },
            {
                title: "Events & Shop",
                changes: [
                    "The Cog Event is now live.",
                    "The Limited-Time Shop now opens periodically.",
                ],
            },
        ],
    },
];

export default function UpdatesPage() {
    return (
        <div className="min-h-screen bg-[#0b111a] text-[#f6f8fc]">
            <TopNavigation />

            <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-8 max-w-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7182ff]">
                        Catch a Monster Updates
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        Patch Notes
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-[#8e99ad] sm:text-base">
                        A simple history of Catch a Monster updates, new islands, monsters, quests, events, and other gameplay changes.
                    </p>
                </div>

                <div className="space-y-5">
                    {patches.map((patch) => (
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
