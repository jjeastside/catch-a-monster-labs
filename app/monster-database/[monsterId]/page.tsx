import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MonsterProfile } from "../../components/monster-profile";
import { SiteFooter } from "../../components/site-footer";
import { TopNavigation } from "../../components/top-navigation";
import { GENERATED_MONSTERS } from "../../data/generated/monsters";

type MonsterProfilePageProps = {
    params: Promise<{
        monsterId: string;
    }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
    return GENERATED_MONSTERS.map((monster) => ({
        monsterId: monster.id,
    }));
}

export async function generateMetadata({
    params,
}: MonsterProfilePageProps): Promise<Metadata> {
    const { monsterId } = await params;
    const monster = GENERATED_MONSTERS.find(
        (candidate) => candidate.id === monsterId,
    );

    if (!monster) {
        return {
            title: "Monster Not Found — Cam Lab",
        };
    }

    const description =
        `${monster.name} — ${monster.rarity} ${monster.element} monster. ` +
        `View skills, passives, obtainment, evolution, reference stats, and DPS on Cam Lab.`;

    return {
        title: `${monster.name} — Cam Lab Monster Database`,
        description,
        alternates: {
            canonical: `/monster-database/${monster.id}/`,
        },
        openGraph: {
            title: `${monster.name} — Cam Lab Monster Database`,
            description,
            type: "website",
        },
    };
}

export default async function MonsterProfilePage({
    params,
}: MonsterProfilePageProps) {
    const { monsterId } = await params;
    const monsterExists = GENERATED_MONSTERS.some(
        (monster) => monster.id === monsterId,
    );

    if (!monsterExists) {
        notFound();
    }

    return (
        <>
            <TopNavigation />
            <MonsterProfile monsterId={monsterId} />
            <SiteFooter />
        </>
    );
}
