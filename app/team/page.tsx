import type { Metadata } from "next";

import { SiteFooter } from "../components/site-footer";
import { TeamComposition } from "../components/team/team-composition";
import { TopNavigation } from "../components/top-navigation";

export const metadata: Metadata = {
  title: "Team Composition — Cam Lab",
  description:
    "Build a three-monster Catch a Monster team, track a small inventory, and compare combined team stats.",
};

export default function TeamCompositionPage() {
  return (
    <>
      <TopNavigation />
      <TeamComposition />
      <SiteFooter />
    </>
  );
}
