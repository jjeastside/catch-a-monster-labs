import type { Metadata } from "next";
import { TopNavigation } from "../components/top-navigation";
import { SiteFooter } from "../components/site-footer";
import { PetHatch } from "../components/pet-hatch";

const petHatchUrl =
    "https://jjeastside.github.io/catch-a-monster-labs/pet-hatch/";
const petHatchPreviewUrl =
    "https://jjeastside.github.io/catch-a-monster-labs/previews/pet-hatch-preview-v2.png";

export const metadata: Metadata = {
    title: "Pet Hatch Transfer — Cam Lab",
    description: "Compare trait transfer, mutation inheritance and genetic value ranges for Catch a Monster breeding.",
    alternates: {
        canonical: petHatchUrl,
    },
    openGraph: {
        title: "Pet Hatch Transfer — Cam Lab",
        description: "Estimate offspring trait inheritance, mutation transfer, rank outcomes, and genetic potential for Normal and Super Breed pairings.",
        siteName: "Cam Lab",
        type: "website",
        url: petHatchUrl,
        images: [
            {
                url: petHatchPreviewUrl,
                width: 1200,
                height: 630,
                type: "image/png",
                alt: "Cam Lab Pet Hatch Transfer calculator",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Pet Hatch Transfer — Cam Lab",
        description: "Estimate offspring trait, mutation, rank, and genetic outcomes for Catch a Monster breeding.",
        images: [petHatchPreviewUrl],
    },
};

export default function PetHatchPage() {
    return <><TopNavigation /><PetHatch /><SiteFooter /></>;
}
