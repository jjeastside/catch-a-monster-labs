const navItems = ["Workbench", "Teams", "Compare"];

export function TopNavigation() {
  return (
    <header className="border-b border-[#272d3a] bg-[#0d1017]/95 px-4 backdrop-blur sm:px-6">
      <nav className="mx-auto flex h-[73px] max-w-[1800px] items-center justify-between gap-4" aria-label="Primary navigation">
        <a href="#workspace" className="flex shrink-0 items-center gap-3 font-semibold tracking-tight text-white">
          <span className="grid size-9 place-items-center rounded-lg bg-[#79e3ae] text-lg font-black text-[#0b1510]">M</span>
          <span>Monster Lab</span>
        </a>
        <div className="hidden items-center gap-1 sm:flex">
          {navItems.map((item, index) => (
            <a key={item} href="#workspace" className={`rounded-md px-3 py-2 text-sm transition-colors ${index === 0 ? "bg-[#1c2330] text-white" : "text-[#99a2b3] hover:text-white"}`}>
              {item}
            </a>
          ))}
        </div>
        <button type="button" className="rounded-md border border-[#303848] px-3 py-2 text-sm font-medium text-[#d8dee9] hover:border-[#4b566a]">
          New build
        </button>
      </nav>
    </header>
  );
}
