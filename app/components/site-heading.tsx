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

            <div className="relative mx-auto w-full max-w-[1800px] px-4 py-2.5 sm:px-5 xl:px-7 2xl:px-8">
                <div className="min-w-0 border-l-2 border-[#7182ff]/75 pl-3">
                    <h1
                        id="calculator-heading"
                        className="text-[17px] font-bold tracking-tight text-[#f6f8fc]"
                    >
                        Catch a Monster Build Calculator
                    </h1>
                    <p className="mt-0.5 text-xs leading-4 text-[#9ca6b8]">
                        Calculate monster stats and skill damage using reverse-engineered in-game formulas.
                    </p>
                </div>
            </div>
        </section>
    );
}