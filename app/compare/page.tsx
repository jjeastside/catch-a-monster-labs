import type { Metadata } from "next";
import { TopNavigation } from "../components/top-navigation";
import { SiteFooter } from "../components/site-footer";
import { MonsterCompare } from "../components/monster-compare";
export const metadata: Metadata = {
  title: "Monster Compare — Cam Lab",
  description:
    "Compare up to 4 monsters side by side with shared settings or custom builds and global account multipliers.",
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
