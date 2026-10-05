import type { Metadata, Viewport } from "next";
import "./globals.css";

import { DeferredFeedbackWidget } from "./components/deferred-feedback-widget";
import { assetPath } from "./lib/asset-path";

const homeUrl = "https://jjeastside.github.io/catch-a-monster-labs/";
const homePreviewUrl = `${homeUrl}preview.png`;

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(homeUrl),
    title: "Cam Lab — Catch a Monster Companion",
    description:
        "A community-driven Catch a Monster companion with a build calculator, Monster Database, Team Builder, Monster Compare, Index Tracker, and game updates.",
    icons: {
        icon: [
            { url: assetPath("/favicon.ico") },
            { url: assetPath("/icon.png"), type: "image/png" },
        ],
        shortcut: assetPath("/favicon.ico"),
        apple: assetPath("/apple-icon.png"),
    },
    openGraph: {
        title: "Cam Lab — Catch a Monster Companion",
        description:
            "Plan builds, compare monsters, build teams, browse game data, and track your Catch a Monster collection with Cam Lab.",
        siteName: "Cam Lab",
        type: "website",
        url: homeUrl,
        images: [
            {
                url: homePreviewUrl,
                width: 1438,
                height: 571,
                alt: "Cam Lab — Catch a Monster Companion",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Cam Lab — Catch a Monster Companion",
        description:
            "Plan builds, compare monsters, build teams, browse game data, and track your Catch a Monster collection with Cam Lab.",
        images: [homePreviewUrl],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body>
        {children}
        <DeferredFeedbackWidget />
        </body>
        </html>
    );
}
