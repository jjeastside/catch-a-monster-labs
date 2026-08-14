const navItems = [
    "Calculator",
    "Monster Database",
    "Guides",
    "Compare",
    "Account",
];

export function TopNavigation() {
    return (
        <header className="border-b border-[#272d3a] bg-[#0d1017]/95 px-4 backdrop-blur sm:px-6">
            <nav
                aria-label="Primary navigation"
                className="flex h-[73px] w-full items-center justify-between gap-4"
            >
                <a
                    href="#workspace"
                    className="flex shrink-0 items-center gap-3 font-semibold tracking-tight text-white"
                >
                    <span className="grid size-9 place-items-center rounded-lg bg-[#79e3ae] text-lg font-black text-[#0b1510]">
                        M
                    </span>

                    <span>Monster Lab</span>
                </a>

                <div className="hidden items-center gap-1 sm:flex">
                    {navItems.map((item, index) => {
                        const isActive = index === 0;

                        return (
                            <a
                                key={item}
                                href="#workspace"
                                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                                    isActive
                                        ? "bg-[#1c2330] text-white"
                                        : "text-[#99a2b3] hover:text-white"
                                }`}
                            >
                                {item}
                            </a>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="rounded-md border border-[#303848] px-3 py-2 text-sm font-medium text-[#d8dee9] transition-colors hover:border-[#4b566a]"
                >
                    New build
                </button>
            </nav>
        </header>
    );
}