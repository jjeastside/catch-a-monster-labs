const exploreLinks = [
    { label: "Calculator", href: "/" },
    { label: "Monster Database", href: "/monsters" },
    { label: "Guides", href: "/guides" },
    { label: "Compare Builds", href: "/compare" },
];

const projectLinks = [
    { label: "Changelog", href: "/changelog" },
    { label: "Feedback", href: "/feedback" },
    { label: "About CAM/LAB", href: "/about" },
    { label: "Privacy", href: "/privacy" },
];

function FooterLink({ label, href }: { label: string; href: string }) {
    return (
        <li>
            <a
                href={href}
                className="group inline-flex items-center gap-1.5 text-sm text-[#8f99aa] transition hover:text-[#7585ff] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7585ff]/60"
            >
                <span>{label}</span>
                <span
                    aria-hidden="true"
                    className="translate-x-0 text-[#7585ff] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                >
                    →
                </span>
            </a>
        </li>
    );
}

export function SiteFooter() {
    return (
        <footer className="relative mt-5 overflow-hidden border-t border-[#293140] bg-[#0b0e14]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7585ff]/70 to-transparent"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-28 -top-36 size-72 rounded-full bg-[#7585ff]/[0.055] blur-3xl"
            />

            <div className="relative mx-auto w-full max-w-[1800px] px-5 py-8 sm:px-7 lg:px-10">
                <div className="grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.65fr)_minmax(10rem,0.65fr)]">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl border border-[#7585ff]/35 bg-[#1f2540] text-sm font-black tracking-tight text-[#7585ff] shadow-[0_0_24px_rgba(117,133,255,0.08)]">
                                C/L
                            </span>
                            <div>
                                <p className="text-base font-bold tracking-tight text-[#f2f4f8]">
                                    CAM<span className="text-[#7585ff]">/</span>LAB
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#697386]">
                                    Roblox fan-made companion
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[#8f99aa]">
                            Plan builds, compare stats, and explore monsters with clearer calculations and community-focused tools.
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#788295]">
                            <span>© 2026 CAM/LAB</span>
                            <span aria-hidden="true" className="text-[#3a4354]">•</span>
                            <span>ROBLOX FAN-SITE</span>
                            <span aria-hidden="true" className="text-[#3a4354]">•</span>
                            <span className="rounded-full border border-[#303848] bg-[#131720] px-2 py-0.5 font-medium text-[#99a2b3]">
                                v1.0.0
                            </span>
                            <span aria-hidden="true" className="text-[#3a4354]">•</span>
                            <span>
                                Built by{" "}
                                <a
                                    href="https://github.com/jjeastside"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[#7585ff] transition hover:text-[#a8b0ff]"
                                >
                                    @jjeastside
                                </a>
                            </span>
                        </div>
                    </div>

                    <nav aria-label="Explore CAM Lab">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7585ff]">
                            Explore
                        </h2>
                        <ul className="mt-4 space-y-2.5">
                            {exploreLinks.map((link) => (
                                <FooterLink key={link.href} {...link}/>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-label="CAM Lab project links">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7585ff]">
                            Project
                        </h2>
                        <ul className="mt-4 space-y-2.5">
                            {projectLinks.map((link) => (
                                <FooterLink key={link.href} {...link}/>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="mt-8 border-t border-[#252c39] pt-5">
                    <p className="max-w-5xl text-xs leading-5 text-[#697386]">
                        CAM/LAB is an independent fan-made companion site. It is not affiliated with, endorsed by, or sponsored by Roblox Corporation or LDS II. All trademarks are property of their respective owners.
                    </p>
                </div>
            </div>
        </footer>
    );
}