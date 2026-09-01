import type { Metadata } from "next";

import { MonsterDatabase } from "../components/monster-database";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

const monsterDatabaseUrl =
    "https://jjeastside.github.io/catch-a-monster-labs/monster-database/";
const monsterDatabasePreviewUrl =
    "https://jjeastside.github.io/catch-a-monster-labs/monster-database-preview.png";

export const metadata: Metadata = {
    title: "Monster Database — Cam Lab",
    description:
        "Browse every Catch a Monster monster, compare reference stats and DPS, filter skills and passives, and explore evolution families.",
    alternates: {
        canonical: monsterDatabaseUrl,
    },
    openGraph: {
        title: "Monster Database — Cam Lab",
        description:
            "Browse every Catch a Monster monster, compare reference stats and DPS, filter skills and passives, and explore evolution families.",
        siteName: "Cam Lab",
        type: "website",
        url: monsterDatabaseUrl,
        images: [
            {
                url: monsterDatabasePreviewUrl,
                width: 692,
                height: 612,
                alt: "Cam Lab Monster Database",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Monster Database — Cam Lab",
        description:
            "Browse every Catch a Monster monster, compare reference stats and DPS, filter skills and passives, and explore evolution families.",
        images: [monsterDatabasePreviewUrl],
    },
};

export default function MonsterDatabasePage() {
    return (
        <>
            <TopNavigation />
            <MonsterDatabase />
            <SiteFooter />
        </>
    );
}
