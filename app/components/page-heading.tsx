import type { ReactNode } from "react";
import { assetPath } from "../lib/asset-path";

export function PageHeading({ title, image, children, id }: {
    title: string;
    image: string;
    children: ReactNode;
    id?: string;
}) {
    return (
        <div className="flex min-w-0 items-center gap-3 text-left">
            <img src={assetPath(image)} alt="" className="size-14 shrink-0 object-contain sm:size-16" />
            <div className="min-w-0">
                <h1 id={id} className="break-words text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">{title}</h1>
                <p className="mt-1 text-sm text-[#c2cad7] sm:text-base">{children}</p>
            </div>
        </div>
    );
}
