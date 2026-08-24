import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import camLabLogo from "../assets/cam-lab-logo.png";

export const metadata: Metadata = {
    title: "Work in Progress | Cam Lab",
};

export default function WorkInProgressPage() {
    return (
        <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0b0e14] px-5 text-[#f2f4f8]">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7585ff]/10 blur-3xl" />
            <section className="relative w-full max-w-lg rounded-2xl border border-[#343b4b] bg-[#11151e]/95 p-8 text-center shadow-2xl shadow-black/30 sm:p-11">
                <Image
                    src={camLabLogo}
                    alt="Cam Lab logo"
                    priority
                    unoptimized
                    className="mx-auto size-36 object-contain drop-shadow-[0_0_28px_rgba(117,133,255,0.24)]"
                />
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[#7585ff]">
                    Cam Lab
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    Work in progress
                </h1>
                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#99a2b3]">
                    This part of Cam Lab is still being built. The calculator is ready for you in the meantime.
                </p>
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