import Image from "next/image";
import Link from "next/link";

import camLabLogo from "../assets/cam-lab-logo.png";

const exploreLinks = [
    { label: "Calculator", href: "/" },
    { label: "Monster Database", href: "/work-in-progress" },
    { label: "Guides", href: "/work-in-progress" },
    { label: "Compare Builds", href: "/work-in-progress" },
];

const projectLinks = [
    { label: "Changelog", href: "/work-in-progress" },
    { label: "Feedback", href: "/work-in-progress" },
    { label: "About CAM Lab", href: "/work-in-progress" },
    { label: "Privacy", href: "/work-in-progress" },
];

function FooterLink({ label, href }: { label: string; href: string }) {
    return (
        <li>
            <Link
                href={href}
                className="group inline-flex items-center gap-1.5 text-sm text-[#8f99aa] transition hover:text-[#7182ff] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7182ff]/60"
            >
                <span>{label}</span>
                <span
                    aria-hidden="true"
                    className="translate-x-0 text-[#7182ff] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                >
                    →
                </span>
            </Link>
        </li>
    );
}

export function SiteFooter() {
    return (
        <footer className="relative mt-5 overflow-hidden border-t border-[#293140] bg-[#0b0e14]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7182ff]/70 to-transparent"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-28 -top-36 size-72 rounded-full bg-[#7182ff]/[0.055] blur-3xl"
            />

            <div className="relative mx-auto w-full max-w-[1800px] px-5 py-8 sm:px-7 lg:px-10">
                <div className="grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.65fr)_minmax(10rem,0.65fr)]">
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
                                <p className="text-base font-bold tracking-tight text-[#f6f8fc]">
                                    CAM<span className="text-[#7182ff]">/</span>LAB
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#69768a]">
                                    Roblox fan-made companion
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[#8f99aa]">
                            Plan builds, compare stats, and explore monsters with clearer calculations and community-focused tools.
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#7f8b9e]">
                            <span>© 2026 CAM Lab</span>
                            <span aria-hidden="true" className="text-[#41506a]">•</span>
                            <span>ROBLOX FAN-SITE</span>
                            <span aria-hidden="true" className="text-[#41506a]">•</span>
                            <span className="rounded-full border border-[#344050] bg-[#0f1620] px-2 py-0.5 font-medium text-[#8e99ad]">
                                v1.0.0
                            </span>
                            <span aria-hidden="true" className="text-[#41506a]">•</span>
                            <span>
                                Built by{" "}
                                <a
                                    href="https://github.com/jjeastside"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[#7182ff] transition hover:text-[#a8b0ff]"
                                >
                                    @jjeastside
                                </a>
                            </span>
                        </div>
                    </div>

                    <nav aria-label="Explore CAM Lab">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7182ff]">
                            Explore
                        </h2>
                        <ul className="mt-4 space-y-2.5">
                            {exploreLinks.map((link) => (
                                <FooterLink key={link.label} {...link}/>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-label="CAM Lab project links">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7182ff]">
                            Project
                        </h2>
                        <ul className="mt-4 space-y-2.5">
                            {projectLinks.map((link) => (
                                <FooterLink key={link.label} {...link}/>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="mt-8 border-t border-[#252c39] pt-5">
                    <p className="max-w-5xl text-xs leading-5 text-[#69768a]">
                        Cam LAB is an independent fan-made companion site. It is not affiliated with, endorsed by, or sponsored by Roblox Corporation or LDS II. All trademarks are property of their respective owners.
                    </p>
                </div>
            </div>
        </footer>
    );
}