import type { Metadata } from "next";

import { AppShell } from "../components/app-shell";

export const metadata: Metadata = {
    title: "Build Calculator — Cam Lab",
    description:
        "Build and compare Catch a Monster builds with combat stats, skill damage, DPS, equipment, traits, mutations, passives, and account multipliers.",
    alternates: {
        canonical: "https://jjeastside.github.io/catch-a-monster-labs/calculator/",
    },
};

export default function CalculatorPage() {
    return <AppShell />;
}
