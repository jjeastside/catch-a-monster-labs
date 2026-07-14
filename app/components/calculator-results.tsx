import { Panel } from "./panel";

export function CalculatorResults() {
  return (
    <Panel eyebrow="Analysis" title="Calculator Results" action={<button type="button" className="text-xs font-medium text-[#79e3ae]">Clear results</button>}>
      <div className="flex flex-1 flex-col p-5">
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#303848] bg-[#0d1017] p-1 text-center text-xs">
          {["Damage", "Matchups", "Summary"].map((tab, index) => <button key={tab} type="button" className={`rounded-md px-2 py-2 ${index === 0 ? "bg-[#202632] font-semibold text-white" : "text-[#788295]"}`}>{tab}</button>)}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-[#303848] bg-[#171b25] text-2xl text-[#79e3ae]">↗</div>
          <p className="text-base font-semibold text-[#e8ebf0]">Results will appear here</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#99a2b3]">Choose a monster and configure its build to preview matchup and damage calculations.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-[#272d3a] pt-4 text-center">
          {["Power", "Speed", "Coverage"].map((label) => <div key={label}><p className="text-lg font-semibold text-[#697386]">—</p><p className="mt-1 text-[10px] uppercase tracking-wider text-[#697386]">{label}</p></div>)}
        </div>
      </div>
    </Panel>
  );
}
