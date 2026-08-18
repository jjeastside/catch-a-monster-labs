import { useState, type CSSProperties } from "react";

import type { Trait } from "../types/trait";

type TraitIconProps = {
    trait: Trait;
    size?: "combat" | "selected" | "option";
};

const rarityVisuals: Record<Trait["rarity"], {
    frame: string;
    surface: string;
    symbol: string;
}> = {
    rare: {
        frame: "bg-[#278fd1]",
        surface: "bg-[radial-gradient(circle_at_50%_100%,rgba(15,135,223,0.48),transparent_72%),linear-gradient(145deg,#101b29,#11151e_62%)]",
        symbol: "linear-gradient(145deg,#4bb9ff,#176cff 72%)",
    },
    epic: {
        frame: "bg-[#bd35cd]",
        surface: "bg-[radial-gradient(circle_at_50%_100%,rgba(218,41,229,0.5),transparent_72%),linear-gradient(145deg,#24142d,#17131f_62%)]",
        symbol: "linear-gradient(145deg,#f082ff,#9c35d8 72%)",
    },
    legendary: {
        frame: "bg-[#df8124]",
        surface: "bg-[radial-gradient(circle_at_50%_100%,rgba(242,135,30,0.52),transparent_72%),linear-gradient(145deg,#302013,#1e1812_62%)]",
        symbol: "linear-gradient(145deg,#ffb23d,#ef690e 72%)",
    },
    mythical: {
        frame: "bg-[linear-gradient(135deg,#f22988,#7b3cff_28%,#0ec6dc_52%,#48e05c_73%,#ff982e)]",
        surface: "bg-[radial-gradient(circle_at_18%_86%,rgba(244,23,170,0.72),transparent_46%),radial-gradient(circle_at_82%_18%,rgba(45,220,89,0.5),transparent_48%),linear-gradient(135deg,#201043,#06252b_56%,#37230b)]",
        // This value is used as inline CSS, so gradient-stop separators must be
        // real spaces. Tailwind-style underscores make the whole value invalid.
        symbol: "linear-gradient(135deg, #ff2f7f, #a24cff 27%, #15d3ff 50%, #4dff70 72%, #ffb12e)",
    },
};

const sizes = {
    combat: { frame: "size-7 rounded p-px", inset: "rounded-[3px] border-0", symbolInset: 4 },
    selected: { frame: "size-11 rounded-md p-px", inset: "rounded-[5px] border-0", symbolInset: 7 },
    option: { frame: "size-14 rounded-lg p-px", inset: "rounded-[7px] border-0", symbolInset: 8 },
};

export function TraitIcon({ trait, size = "selected" }: TraitIconProps) {
    const [failedSymbol, setFailedSymbol] = useState<string | null>(null);
    // Impair IV is always the Mythical rainbow treatment, even if stale imported
    // data or an older saved build reports another rarity.
    const visualRarity = trait.id === "impair-4" ? "mythical" : trait.rarity;
    const visual = rarityVisuals[visualRarity];
    const dimensions = sizes[size];
    const useSymbol = Boolean(trait.symbolImage) && failedSymbol !== trait.symbolImage;
    const maskStyle = useSymbol ? ({
        WebkitMaskImage: `url(${trait.symbolImage})`,
        maskImage: `url(${trait.symbolImage})`,
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskMode: "alpha",
        maskMode: "alpha",
        position: "absolute",
        display: "block",
        inset: `${dimensions.symbolInset}px`,
        backgroundImage: visual.symbol,
    } as CSSProperties) : undefined;

    return (
        <span className={`relative grid shrink-0 place-items-center shadow-[0_4px_10px_rgba(0,0,0,0.28)] ${dimensions.frame} ${visual.frame}`}>
            <span className={`relative size-full overflow-hidden ${dimensions.inset} ${visual.surface}`}>
                {trait.symbolImage && (
                    <img
                        src={trait.symbolImage}
                        alt=""
                        aria-hidden="true"
                        className="hidden"
                        onError={() => setFailedSymbol(trait.symbolImage ?? null)}
                    />
                )}
                {useSymbol ? (
                    <span aria-hidden="true" className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]" style={maskStyle} />
                ) : (
                    <span className="absolute inset-0 grid place-items-center text-[9px] font-black tracking-tight text-white/70">
                        {trait.name.slice(0, 2).toUpperCase()}
                    </span>
                )}
            </span>
        </span>
    );
}
