"use client";

import type { ReactNode } from "react";

/** Opens the global contact dialog without creating a public feedback issue. */
export function ContactTrigger({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <button
            type="button"
            className={className}
            onClick={() => window.dispatchEvent(new Event("cam-lab:open-contact"))}
            aria-haspopup="dialog"
        >
            {children}
        </button>
    );
}
