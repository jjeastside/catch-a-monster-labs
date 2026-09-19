import { PageHeading } from "./page-heading";
export function SiteHeading() {
    return (
        <div className="mx-auto w-full max-w-[1800px] px-3 pt-3 sm:px-5 xl:px-7 2xl:px-8">
            <PageHeading id="calculator-heading" title="Build Calculator" image="/icons/monster-calculator.png">Plan your build and calculate monster stats and skill damage.</PageHeading>
        </div>
    );
}
