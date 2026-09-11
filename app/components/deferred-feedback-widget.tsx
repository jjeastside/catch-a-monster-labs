"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FeedbackWidget = dynamic(
    () => import("./feedback-widget").then((module) => module.FeedbackWidget),
    { ssr: false },
);

export function DeferredFeedbackWidget() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const windowWithIdle = window as Window & {
            requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };

        if (windowWithIdle.requestIdleCallback) {
            const idleId = windowWithIdle.requestIdleCallback(() => setReady(true), { timeout: 1800 });
            return () => windowWithIdle.cancelIdleCallback?.(idleId);
        }

        const timeoutId = window.setTimeout(() => setReady(true), 900);
        return () => window.clearTimeout(timeoutId);
    }, []);

    return ready ? <FeedbackWidget /> : null;
}
