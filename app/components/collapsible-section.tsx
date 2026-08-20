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
        <section className="rounded-lg border border-[#344050] bg-[#0d131d]/55">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
            >
                <span>
                    <span className="block text-sm font-semibold text-[#e3e8f1]">
                        {title}
                    </span>
                    {description && (
                        <span className="mt-0.5 block text-[11px] text-[#7f8b9e]">
                            {description}
                        </span>
                    )}
                </span>

                <span className="text-base text-[#8e99ad]">
                    {isOpen ? "−" : "+"}
                </span>
            </button>

            {isOpen && (
                <div className="border-t border-[#3b4759] p-3">
                    {children}
                </div>
            )}
        </section>
    );
}