"use client";

import { useEffect } from "react";

/**
 * Keeps legacy calculator hash links working now that the calculator lives at
 * /calculator. The feedback hash belongs to the homepage and must stay here.
 */
export function LegacyHashRedirect() {
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || hash === "#feedback") return;

        const pathname = window.location.pathname.endsWith("/")
            ? window.location.pathname
            : `${window.location.pathname}/`;

        window.location.replace(`${pathname}calculator/${hash}`);
    }, []);

    return null;
}
