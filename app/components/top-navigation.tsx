"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { assetPath } from "../lib/asset-path";

const navItems = [
    { label: "Calculator", href: "/", icon: "/icons/monster-calculator.png" },
    { label: "Monster Compare", href: "/compare", icon: "/icons/monster-compare.png" },
    { label: "Monster Database", href: "/monster-database", icon: "/icons/monster-database.png" },
    { label: "Index Tracker", href: "/index-tracker", icon: "/icons/index.png" },
    { label: "Patch Notes", href: "/updates", icon: "/icons/patch-notes.png" },
    { label: "Changelog", href: "/changelog", icon: "/icons/changelog.png" },
] as const;

export function TopNavigation() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const isItemActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    return (
        <header className="relative overflow-hidden border-b border-[#16345e] bg-[#061023]/95 backdrop-blur">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,115,255,0.17),_transparent_58%)]"
            />

            {/* Left crystal */}
            <div className="pointer-events-none absolute -bottom-px left-0 z-0 opacity-80">
                <div className="relative h-[92px] w-[106px] -translate-x-[46%] translate-y-[22%] sm:h-[104px] sm:w-[120px] sm:translate-y-[22%] md:h-[118px] md:w-[136px] md:translate-y-[20%] lg:h-[150px] lg:w-[172px] lg:translate-y-[18%] xl:h-[164px] xl:w-[188px] xl:translate-y-[18%]">
                    <Image
                        src={assetPath("/branding/nav-crystals.png")}
                        width={188}
                        height={164}
                        alt=""
                        aria-hidden="true"
                        unoptimized
                        className="h-full w-full object-contain object-left-bottom"
                    />
                </div>
            </div>

            {/* Right crystal */}
            <div className="pointer-events-none absolute -bottom-px right-0 z-0 opacity-80">
                <div className="relative h-[92px] w-[106px] translate-x-[46%] translate-y-[22%] sm:h-[104px] sm:w-[120px] sm:translate-y-[22%] md:h-[118px] md:w-[136px] md:translate-y-[20%] lg:h-[150px] lg:w-[172px] lg:translate-y-[18%] xl:h-[164px] xl:w-[188px] xl:translate-y-[18%]">
                    <Image
                        src={assetPath("/branding/nav-crystals.png")}
                        width={188}
                        height={164}
                        alt=""
                        aria-hidden="true"
                        unoptimized
                        className="h-full w-full scale-x-[-1] object-contain object-right-bottom"
                    />
                </div>
            </div>

            <nav
                aria-label="Primary navigation"
                className="
                    relative z-10 mx-auto
                    grid h-[68px] w-full
                    max-w-[920px]
                    grid-cols-[84px_1fr_84px]
                    items-center gap-2 px-4

                    sm:max-w-[960px]
                    sm:grid-cols-[96px_1fr_96px]
                    sm:px-5

                    md:h-[76px]
                    md:max-w-[980px]
                    md:grid-cols-[112px_1fr_112px]
                    md:px-6

                    lg:h-[92px]
                    lg:max-w-[1520px]
                    lg:grid-cols-[minmax(0,1fr)_auto]
                    lg:gap-2
                    lg:pl-0
                    lg:pr-[128px]

                    xl:gap-3
                    xl:pr-[144px]
                "
            >
                {/* Balances the mobile grid so the logo stays truly centered */}
                <div aria-hidden="true" className="lg:hidden" />

                {/* Logo */}
                <Link
                    href="/"
                    prefetch={false}
                    onMouseEnter={() => router.prefetch("/")}
                    onFocus={() => router.prefetch("/")}
                    aria-label="Go to Cam Lab home"
                    className="
                        col-start-2
                        flex shrink-0 items-center
                        justify-self-center

                        lg:col-start-1
                        lg:justify-self-center
                    "
                >
                    <span className="relative block h-[40px] w-[150px] sm:h-[44px] sm:w-[164px] md:h-[50px] md:w-[186px] lg:h-[64px] lg:w-[244px] xl:h-[70px] xl:w-[272px] 2xl:h-[72px] 2xl:w-[280px]">
                        <Image
                            src={assetPath("/branding/cam-lab-logo-wide.png")}
                            width={280}
                            height={72}
                            alt="Cam Lab logo"
                            priority
                            unoptimized
                            className="h-full w-full object-contain"
                        />
                    </span>
                </Link>

                {/* Desktop navigation */}
                <div
                    className="
                        hidden min-w-0
                        lg:col-start-2
                        lg:flex
                        lg:items-center
                        lg:justify-self-end
                        lg:gap-0

                        xl:gap-0.5
                    "
                >
                    {navItems.map((item) => {
                        const isActive = isItemActive(item.href);

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                prefetch={false}
                                onMouseEnter={() => router.prefetch(item.href)}
                                onFocus={() => router.prefetch(item.href)}
                                className={`relative flex items-center gap-1.5 rounded-xl px-2 py-2.5 text-[12px] transition-colors xl:gap-2 xl:px-2.5 xl:text-[13px] 2xl:px-3 2xl:text-sm ${
                                    isActive
                                        ? "bg-[#0a1931] text-[#5caaff] shadow-[0_0_0_1px_rgba(92,170,255,0.08)] after:absolute after:inset-x-3 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-[#5caaff]"
                                        : "text-[#a9b4ca] hover:bg-[#09162b] hover:text-white"
                                }`}
                            >
                                <img
                                    src={assetPath(item.icon)}
                                    alt=""
                                    aria-hidden="true"
                                    className={`size-3.5 shrink-0 object-contain xl:size-4 ${
                                        isActive ? "opacity-100" : "opacity-75"
                                    }`}
                                />

                                <span className="whitespace-nowrap">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile / tablet menu button */}
                <button
                    type="button"
                    onClick={() =>
                        setIsMobileMenuOpen((current) => !current)
                    }
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-primary-navigation"
                    className="
                        col-start-3
                        flex items-center gap-2
                        justify-self-end
                        rounded-md
                        border border-[#344050]
                        bg-[#141c28]
                        px-3 py-1.5
                        text-xs font-semibold text-[#bfc7d5]

                        lg:hidden
                    "
                >
                    <span aria-hidden="true">☰</span>
                    Menu
                </button>
            </nav>

            {isMobileMenuOpen && (
                <div
                    id="mobile-primary-navigation"
                    className="relative z-10 border-t border-[#293140] bg-[#071224]/95 px-3 py-2 lg:hidden"
                >
                    <div className="mx-auto grid max-w-[900px] gap-1 px-3 sm:px-4 md:px-6">
                        {navItems.map((item) => {
                            const isActive = isItemActive(item.href);

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    prefetch={false}
                                    onMouseEnter={() => router.prefetch(item.href)}
                                    onFocus={() => router.prefetch(item.href)}
                                    onClick={() =>
                                        setIsMobileMenuOpen(false)
                                    }
                                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                                        isActive
                                            ? "bg-[#1c2330] text-white"
                                            : "text-[#a5afc0] hover:bg-[#141c28] hover:text-white"
                                    }`}
                                >
                                    <img
                                        src={assetPath(item.icon)}
                                        alt=""
                                        aria-hidden="true"
                                        className={`size-5 shrink-0 object-contain ${
                                            isActive
                                                ? "opacity-100"
                                                : "opacity-80"
                                        }`}
                                    />

                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </header>
    );
}