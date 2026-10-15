import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

import { DeferredFeedbackWidget } from "./components/deferred-feedback-widget";
import { ContactWidget } from "./components/contact-widget";
import { assetPath } from "./lib/asset-path";

// Get this public site token from Cloudflare > Web Analytics > Manage site.
// NEXT_PUBLIC_ variables must be set during the GitHub Pages build, not at runtime.
// Falls back to Cam Lab's public Cloudflare beacon token on GitHub Pages.
const cloudflareAnalyticsToken =
    process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?.trim() ||
    "d6ce3a70a0a142c5bfefcdc462bcc515";

const homeUrl = "https://jjeastside.github.io/catch-a-monster-labs/";
const homePreviewUrl = `${homeUrl}previews/preview.png`;

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(homeUrl),
    title: "Cam Lab — Catch a Monster Companion",
    description:
        "A community-driven Catch a Monster companion with a build calculator, Pet Hatch transfer estimates, Monster Database, Team Builder, Monster Compare, Index Tracker, and game updates.",
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
            "Plan builds, estimate Pet Hatch transfers, compare monsters, build teams, browse game data, and track your Catch a Monster collection with Cam Lab.",
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
            "Plan builds, estimate Pet Hatch transfers, compare monsters, build teams, browse game data, and track your Catch a Monster collection with Cam Lab.",
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
        <ContactWidget />
        {process.env.NODE_ENV === "production" && cloudflareAnalyticsToken && (
            <Script
                id="cloudflare-web-analytics"
                src="https://static.cloudflareinsights.com/beacon.min.js"
                strategy="afterInteractive"
                type="module"
                data-cf-beacon={JSON.stringify({
                    token: cloudflareAnalyticsToken,
                    spa: true,
                })}
            />
        )}
        </body>
        </html>
    );
}
