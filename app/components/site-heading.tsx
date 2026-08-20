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

            <div className="relative mx-auto w-full max-w-[1800px] px-3 py-2 sm:px-5 sm:py-2.5 xl:px-7 2xl:px-8">
                <div className="min-w-0 border-l-2 border-[#7182ff]/75 pl-2.5 sm:pl-3">
                    <h1
                        id="calculator-heading"
                        className="break-words text-sm font-bold leading-5 tracking-tight text-[#f6f8fc] sm:text-[17px]"
                    >
                        Catch a Monster Build Calculator
                    </h1>
                    <p className="mt-0.5 max-w-3xl break-words text-[10px] leading-4 text-[#9ca6b8] sm:text-xs">
                        Calculate monster stats and skill damage using reverse-engineered in-game formulas.
                    </p>
                </div>
            </div>
        </section>
    );
}