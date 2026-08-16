"use client";

import { useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
    title: ReactNode;
    children: ReactNode;
    description?: string;
};

export function CollapsibleSection({
                                       title,
                                       children,
                                       description,
                                   }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <section className="rounded-lg border border-[#303848] bg-[#11151e]/55">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
            >
                <span>
                    <span className="block text-sm font-semibold text-[#e8ebf0]">
                        {title}
                    </span>
                    {description && (
                        <span className="mt-0.5 block text-[11px] text-[#788295]">
                            {description}
                        </span>
                    )}
                </span>

                <span className="text-base text-[#99a2b3]">
                    {isOpen ? "−" : "+"}
                </span>
            </button>

            {isOpen && (
                <div className="border-t border-[#343b4b] p-3">
                    {children}
                </div>
            )}
        </section>
    );
}