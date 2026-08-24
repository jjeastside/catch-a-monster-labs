import { MonsterDatabase } from "../components/monster-database";
import { SiteFooter } from "../components/site-footer";
import { TopNavigation } from "../components/top-navigation";

export default function MonsterDatabasePage() {
    return (
        <>
            <TopNavigation />
            <MonsterDatabase />
            <SiteFooter />
        </>
    );
}
