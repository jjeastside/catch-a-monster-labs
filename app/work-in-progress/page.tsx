import { PageHeading } from "../components/page-heading";
import type { Metadata } from "next";
import Link from "next/link";



export const metadata: Metadata = {
    title: "Work in Progress | Cam Lab",
};

export default function WorkInProgressPage() {
    return (
        <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0b0e14] px-5 text-[#f2f4f8]">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7585ff]/10 blur-3xl" />
            <section className="relative w-full max-w-lg rounded-2xl border border-[#343b4b] bg-[#11151e]/95 p-8 text-center shadow-2xl shadow-black/30 sm:p-11">
                <PageHeading title="Coming Soon" image="/icons/damage-increase.png">More tools are on the way to <span className="text-[#ffb566]">help you plan your next build.</span></PageHeading>
                <Link
                    href="/"
                    className="mt-7 inline-flex rounded-lg bg-[#7585ff] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#8d9aff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aeb7ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11151e]"
                >
                    Back to calculator
                </Link>
            </section>
        </main>
    );
}