import { PageHeading } from "./page-heading";
export function SiteHeading() {
    return (
        <section aria-labelledby="calculator-heading" className="relative overflow-hidden border-b border-[#25475f] bg-[linear-gradient(100deg,#0b2136,#0b1a2c_52%,#0a1625)]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#58aaff]/50 to-transparent" />
            <div className="relative mx-auto w-full max-w-[1800px] px-3 py-4 sm:px-5 xl:px-7 2xl:px-8">
                <PageHeading id="calculator-heading" title="Build Calculator" image="/icons/monster-calculator.png">Plan your build and calculate monster stats and skill damage.</PageHeading>
            </div>
        </section>
    );
}
