import Image from "next/image";

import { assetPath } from "../lib/asset-path";

type CamLabLoadingProps = {
    compact?: boolean;
    label?: string;
};

export function CamLabLoading({ compact = false, label = "Loading Cam Lab" }: CamLabLoadingProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={compact
                ? "grid min-h-[320px] place-items-center px-5 py-12"
                : "grid min-h-[70vh] place-items-center px-5 py-16"
            }
        >
            <div className="flex w-full max-w-sm flex-col items-center text-center">
                <div className="relative h-16 w-60 sm:h-20 sm:w-72">
                    <Image
                        src={assetPath("/branding/cam-lab-logo-wide.png")}
                        width={280}
                        height={72}
                        alt="Cam Lab"
                        priority
                        unoptimized
                        className="h-full w-full object-contain"
                    />
                </div>

                <div className="mt-5 h-1.5 w-40 overflow-hidden rounded-full border border-[#263957] bg-[#0c1420] shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]">
                    <span className="cam-loading-bar block h-full w-1/2 rounded-full bg-gradient-to-r from-[#3d8cff] via-[#73c7ff] to-[#7182ff]" />
                </div>

                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8ea1bc]">
                    {label}
                </p>
                <p className="mt-1 text-[11px] text-[#63738a]">Preparing monsters, builds, and calculations…</p>
            </div>
        </div>
    );
}
