import { PageHeading } from "./page-heading";
export function SiteHeading() {
    return (
        <section
            aria-labelledby="calculator-heading"
            className="relative overflow-hidden border-b border-[#293140] bg-[#0b0e14]"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7182ff]/65 to-transparent"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 -top-24 size-48 rounded-full bg-[#7182ff]/[0.06] blur-3xl"
            />

            <div className="relative mx-auto w-full max-w-[1800px] px-3 py-5 sm:px-5 xl:px-7 2xl:px-8">
                <PageHeading id="calculator-heading" title="Build Calculator" image="/icons/monster-calculator.png">Plan your build and calculate <span className="text-[#ff8599]">monster stats and skill damage.</span></PageHeading>
            </div>
        </section>
    );
}