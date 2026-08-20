import Image from "next/image";
import Link from "next/link";

import camLabLogo from "../assets/cam-lab-logo.png";

const navItems = [
    { label: "Calculator", href: "/" },
    { label: "Monster Database", href: "/work-in-progress" },
    { label: "Guides", href: "/work-in-progress" },
    { label: "Compare", href: "/work-in-progress" },
    { label: "Account", href: "/work-in-progress" },
];

export function TopNavigation() {
    return (
        <header className="border-b border-[#3b4759] bg-[#0d131d]/95 px-4 backdrop-blur sm:px-6">
            <nav
                aria-label="Primary navigation"
                className="mx-auto grid h-[52px] w-full max-w-[1800px] grid-cols-[1fr_auto_1fr] items-center gap-4 sm:h-[73px]"
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

                <span aria-hidden="true" />
            </nav>
        </header>
    );
}
