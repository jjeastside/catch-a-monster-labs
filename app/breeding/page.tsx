import type { Metadata } from "next";
import { TopNavigation } from "../components/top-navigation";
import { SiteFooter } from "../components/site-footer";
import { BreedingCalculator } from "../components/breeding-calculator";

export const metadata: Metadata = {
    title: "Breeding Calculator — Cam Lab",
    description: "Plan Catch a Monster skill transfers between breeding parents using tested Genesis and Super Breed probabilities.",
    alternates: { canonical: "https://jjeastside.github.io/catch-a-monster-labs/breeding/" },
};

export default function BreedingPage() {
    return <><TopNavigation /><BreedingCalculator /><SiteFooter /></>;
}
