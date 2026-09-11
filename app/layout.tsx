import type { Metadata, Viewport } from "next";
import "./globals.css";

import { DeferredFeedbackWidget } from "./components/deferred-feedback-widget";
import { assetPath } from "./lib/asset-path";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL("https://jjeastside.github.io/catch-a-monster-labs/"),
    title: "Cam Lab — Catch a Monster Build Calculator",
    description:
        "Build and compare Catch a Monster builds with combat stats, skill damage, DPS, equipment, traits, mutations, passives, and account multipliers.",
    icons: {
        icon: [
            { url: assetPath("/favicon.ico") },
            { url: assetPath("/icon.png"), type: "image/png" },
        ],
        shortcut: assetPath("/favicon.ico"),
        apple: assetPath("/apple-icon.png"),
    },
    openGraph: {
        title: "Cam Lab — Catch a Monster Build Calculator",
        description:
            "Build and compare Catch a Monster builds with combat stats, skill damage, DPS, equipment, traits, mutations, passives, and account multipliers.",
        siteName: "Cam Lab",
        type: "website",
        url: "https://jjeastside.github.io/catch-a-monster-labs/",
        images: [
            {
                url: assetPath("/preview.png"),
                width: 807,
                height: 493,
                alt: "Cam Lab — Catch a Monster Build Calculator",
            },
        ],
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
