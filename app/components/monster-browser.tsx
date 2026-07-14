import { Panel } from "./panel";

export function MonsterBrowser() {
  return (
    <Panel eyebrow="Step 1" title="Monster Browser" action={<span className="rounded-full bg-[#202632] px-2.5 py-1 text-xs text-[#99a2b3]">0 selected</span>}>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <label className="relative block">
          <span className="sr-only">Search monsters</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#788295]">⌕</span>
          <input type="search" placeholder="Search by name or number" className="w-full rounded-lg border border-[#303848] bg-[#0d1017] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#697386] focus:border-[#79e3ae]" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["All types", "Any generation"].map((label) => <button key={label} type="button" className="rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-left text-xs text-[#99a2b3]">{label} <span className="float-right">⌄</span></button>)}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[#303848] bg-[#0d1017]/45 px-6 text-center">
          <div className="mb-3 grid size-11 place-items-center rounded-full bg-[#202632] text-xl text-[#79e3ae]">✦</div>
          <h3 className="text-sm font-semibold text-[#d8dee9]">Your collection starts here</h3>
          <p className="mt-2 max-w-[210px] text-xs leading-5 text-[#788295]">Search the full monster index to add a contender to your build.</p>
        </div>
      </div>
    </Panel>
  );
}
