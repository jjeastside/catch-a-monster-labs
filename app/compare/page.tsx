import type { Metadata } from "next";
import { TopNavigation } from "../components/top-navigation";
import { SiteFooter } from "../components/site-footer";
import { MonsterCompare } from "../components/monster-compare";

const compareUrl =
  "https://jjeastside.github.io/catch-a-monster-labs/compare/";
const comparePreviewUrl =
  "https://jjeastside.github.io/catch-a-monster-labs/compare-preview.png";

export const metadata: Metadata = {
  title: "Monster Compare — Cam Lab",
  description:
    "Compare up to 4 monsters side by side with shared settings or custom builds and global account multipliers.",
  alternates: {
    canonical: compareUrl,
  },
  openGraph: {
    title: "Monster Compare — Cam Lab",
    description:
      "Compare Catch a Monster builds side by side with stats, skills, DPS, equipment, account multipliers, and custom build settings.",
    siteName: "Cam Lab",
    type: "website",
    url: compareUrl,
    images: [
      {
        url: comparePreviewUrl,
        width: 1200,
        height: 630,
        alt: "Cam Lab Monster Compare showing two monsters side by side",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Monster Compare — Cam Lab",
    description:
      "Compare Catch a Monster builds side by side with stats, skills, DPS, equipment, account multipliers, and custom build settings.",
    images: [comparePreviewUrl],
  },
};

export default function ComparePage() {
  return (
    <>
      <TopNavigation />
      <MonsterCompare />
      <SiteFooter />
    </>
  );
}
