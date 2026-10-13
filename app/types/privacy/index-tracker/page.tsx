import type { Metadata } from "next";

import { IndexTracker } from "../components/index-tracker";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

const indexTrackerUrl =
    "https://jjeastside.github.io/catch-a-monster-labs/index-tracker/";
const indexTrackerPreviewUrl =
    "https://jjeastside.github.io/catch-a-monster-labs/index-tracker-preview.png";

export const metadata: Metadata = {
    title: "Index Tracker — Cam Lab",
    description: "Track ranks and mutation bonuses for every Catch a Monster monster and calculate your total Index Score.",
    alternates: {
        canonical: indexTrackerUrl,
    },
    openGraph: {
        title: "Index Tracker — Cam Lab",
        description: "Track every monster, record ranks and mutations, and maximize your Catch a Monster Index Score.",
        siteName: "Cam Lab",
        type: "website",
        url: indexTrackerUrl,
        images: [
            {
                url: indexTrackerPreviewUrl,
                width: 1136,
                height: 212,
                alt: "Cam Lab Index Tracker showing an Index Score of 1,983",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Index Tracker — Cam Lab",
        description: "Track every monster, record ranks and mutations, and maximize your Catch a Monster Index Score.",
        images: [indexTrackerPreviewUrl],
    },
};

export default function IndexTrackerPage() {
    return (
        <>
            <TopNavigation />
            <IndexTracker />
            <SiteFooter />
        </>
    );
}
