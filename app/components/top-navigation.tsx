"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import camLabLogo from "../assets/cam-lab-logo.png";

const navItems = [
    { label: "Calculator", href: "/" },
    { label: "Monster Database", href: "/work-in-progress" },
    { label: "Guides", href: "/work-in-progress" },
    { label: "Compare", href: "/work-in-progress" },
    { label: "Account", href: "/work-in-progress" },
];

export function TopNavigation() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="border-b border-[#3b4759] bg-[#0d131d]/95 backdrop-blur">
            <nav
                aria-label="Primary navigation"
                className="mx-auto flex h-[52px] w-full max-w-[1800px] items-center justify-between gap-4 px-4 sm:grid sm:h-[73px] sm:grid-cols-[1fr_auto_1fr] sm:px-6"
            >
                <Link
                    href="/"
                    className="flex shrink-0 items-center gap-3 font-semibold tracking-tight text-white"
                >
                    <span className="grid size-8 place-items-center sm:size-12">
                        <Image
                            src={camLabLogo}
                            alt="Cam Lab logo"
                            priority
                            unoptimized
                            className="h-full w-full object-contain"
                        />
                    </span>

                    <span>Cam Lab</span>
                </Link>

                <div className="hidden items-center gap-1 sm:flex">
                    {navItems.map((item, index) => {
                        const isActive = index === 0;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                                    isActive
                                        ? "bg-[#1c2330] text-white"
                                        : "text-[#8e99ad] hover:text-white"
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen((current) => !current)}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-primary-navigation"
                    className="flex items-center gap-2 rounded-md border border-[#344050] bg-[#141c28] px-3 py-1.5 text-xs font-semibold text-[#bfc7d5] sm:hidden"
                >
                    <span aria-hidden="true">☰</span>
                    Menu
                </button>

                <span aria-hidden="true" className="hidden sm:block" />
            </nav>

            {isMobileMenuOpen && (
                <div id="mobile-primary-navigation" className="grid gap-1 border-t border-[#293140] px-3 py-2 sm:hidden">
                    {navItems.map((item, index) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`rounded-md px-3 py-2 text-sm ${index === 0 ? "bg-[#1c2330] text-white" : "text-[#a5afc0] hover:bg-[#141c28] hover:text-white"}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
}
