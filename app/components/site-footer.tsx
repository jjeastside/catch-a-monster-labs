"use client";

import Image from "next/image";
import Link from "next/link";

import camLabLogo from "../assets/cam-lab-logo.png";

const exploreLinks = [
    { label: "Calculator", href: "/" },
    { label: "Monster Database", href: "/monster-database" },
    { label: "Index Tracker", href: "/index-tracker" },
    { label: "Patch Notes", href: "/updates" },
    { label: "Changelog", href: "/changelog" },
    { label: "About", href: "/about" },
    { label: "Privacy Policy", href: "/privacy" },
];

const projectLinks = [
    { label: "Suggest a Feature", feedbackCategory: "feature" },
    { label: "Report an Issue", feedbackCategory: "bug" },
    { label: "Send Feedback", feedbackCategory: "general" },
    { label: "View on GitHub", href: "https://github.com/jjeastside/catch-a-monster-labs" },
] as const;

type FooterLinkProps = {
    label: string;
    href?: string;
    feedbackCategory?: "feature" | "bug" | "general";
};

function FooterLink({ label, href, feedbackCategory }: FooterLinkProps) {
    const content = (
        <>
            <span>{label}</span>
            <span
                aria-hidden="true"
                className="translate-x-0 text-[#7182ff] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
            >
                →
            </span>
        </>
    );
    const className =
        "group inline-flex items-center gap-1.5 text-left text-sm text-[#8f99aa] transition hover:text-[#7182ff] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7182ff]/60";

    return (
        <li>
            {feedbackCategory ? (
                <button
                    type="button"
                    className={className}
                    onClick={() =>
                        window.dispatchEvent(
                            new CustomEvent("cam-lab:open-feedback", {
                                detail: { category: feedbackCategory },
                            }),
                        )
                    }
                >
                    {content}
                </button>
            ) : (
                <Link href={href ?? "/"} className={className}>
                    {content}
                </Link>
            )}
        </li>
    );
}

export function SiteFooter() {
    return (
        <footer className="relative overflow-hidden border-t border-[#17345b] bg-[#050d1b]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7182ff]/70 to-transparent"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-28 -top-36 size-72 rounded-full bg-[#7182ff]/[0.055] blur-3xl"
            />

            <div className="relative mx-auto w-full max-w-[1240px] px-5 py-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(9rem,.7fr))]">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3">
                            <span className="grid size-12 place-items-center">
                                <Image
                                    src={camLabLogo}
                                    alt="Cam Lab logo"
                                    unoptimized
                                    className="h-full w-full object-contain"
                                />
                            </span>
                            <div>
                                <p className="text-xl font-black tracking-tight text-[#f6f8fc]">
                                    Cam Lab
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#69768a]">
                                    Roblox fan-made companion
                                </p>
                            </div>
                        </div>

                        <p className="mt-3 max-w-xs text-sm leading-5 text-[#8f99aa]">
                            The ultimate companion for Catch a Monster on Roblox.
                        </p>

                    </div>

                    <nav aria-label="Explore Cam Lab">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7182ff]">
                            Site
                        </h2>
                        <ul className="mt-4 space-y-2.5">
                            {exploreLinks.map((link) => (
                                <FooterLink key={link.label} {...link}/>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-label="Cam Lab project links">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7182ff]">
                            Community
                        </h2>
                        <ul className="mt-4 space-y-2.5">
                            {projectLinks.map((link) => (
                                <FooterLink key={link.label} {...link}/>
                            ))}
                        </ul>
                    </nav>

                    <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7182ff]">
                            Project
                        </h2>
                        <div className="mt-4 inline-flex rounded-lg border border-[#7046c8] bg-[#130c2c] px-6 py-2 text-sm font-bold text-[#a982ff]">
                            v1.0.9
                        </div>
                        <p className="mt-4 text-sm text-[#8f99aa]">Created by</p>
                        <a
                            href="https://github.com/jjeastside"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold text-[#52aaff] transition hover:text-[#8dc8ff]"
                        >
                            @jjeastside
                        </a>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-[#252c39] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-5xl text-xs leading-5 text-[#69768a]">
                        Cam Lab is an independent fan-made companion site. It is not affiliated with, endorsed by, or sponsored by Roblox Corporation or LDS II. All trademarks are property of their respective owners.
                    </p>
                    <a
                        href="https://catchamonsterhub.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-xs font-bold text-[#52aaff] transition hover:text-[#8dc8ff] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7182ff]/60"
                    >
                        Partners with CAM Hub ↗
                    </a>
                </div>
            </div>
        </footer>
    );
}
