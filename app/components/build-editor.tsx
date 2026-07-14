import { Panel } from "./panel";

const fields = ["Level", "Nature", "Ability", "Item"];

export function BuildEditor() {
  return (
    <Panel eyebrow="Step 2" title="Build Editor" action={<button type="button" className="text-xs font-medium text-[#99a2b3]">Reset</button>}>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="rounded-lg border border-dashed border-[#303848] bg-[#0d1017]/45 p-4 text-center">
          <p className="text-sm font-medium text-[#d8dee9]">No monster selected</p>
          <p className="mt-1 text-xs leading-5 text-[#788295]">Pick a monster from the browser to begin editing its build.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => <label key={field} className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">{field}</span><button type="button" className="w-full rounded-md border border-[#303848] bg-[#171b25] px-3 py-2 text-left text-sm text-[#697386]">Select <span className="float-right">⌄</span></button></label>)}
        </div>
        <div className="border-t border-[#272d3a] pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#788295]">Moves</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((move) => <button key={move} type="button" className="rounded-md border border-dashed border-[#303848] bg-[#0d1017]/45 px-3 py-2.5 text-left text-xs text-[#697386]">+ Add move {move}</button>)}
          </div>
        </div>
        <button type="button" className="mt-auto w-full rounded-md bg-[#79e3ae] px-4 py-2.5 text-sm font-bold text-[#0b1510]">Analyze build</button>
      </div>
    </Panel>
  );
}
