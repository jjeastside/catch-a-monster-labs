import { isNewMonster } from "../data/new-monsters";

export function NewMonsterBadge({ monsterId }: { monsterId: string }) {
    if (!isNewMonster(monsterId)) return null;

    return (
        <span className="inline-flex shrink-0 items-center rounded-full border border-[#4a9fd0] bg-[#0b293f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#a6e5ff]">
            New
        </span>
    );
}
