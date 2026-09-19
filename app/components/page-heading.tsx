import type { ReactNode } from "react";
import { assetPath } from "../lib/asset-path";

/** Shared header for the main Cam Lab tools. Optional side content stays on the right. */
export function PageHeading({ title, image, children, id, aside }: {
    title: string;
    image: string;
    children: ReactNode;
    id?: string;
    aside?: ReactNode;
}) {
    return (
        <header className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-[#26476d] bg-[linear-gradient(100deg,#0b2136_0%,#0b1a2c_52%,#0a1625_100%)] px-4 py-3 text-left sm:gap-4 sm:px-5">
            <img src={assetPath(image)} alt="" className="size-12 shrink-0 object-contain sm:size-14" />
            <div className="min-w-0 flex-1">
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8caaff]">Monster Tools</p>
                <h1 id={id} className="break-words text-2xl font-black leading-[1.08] tracking-tight text-white sm:text-3xl">{title}</h1>
                <p className="mt-1 text-sm text-[#bad8f4]">{children}</p>
            </div>
            {aside ? <div className="w-full rounded-lg border border-[#28455f] bg-[#041320] px-3 py-2 text-xs leading-relaxed text-[#b4d2ed] sm:ml-auto sm:w-auto sm:max-w-[340px]">{aside}</div> : null}
        </header>
    );
}
