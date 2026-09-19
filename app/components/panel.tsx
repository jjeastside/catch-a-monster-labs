import type { ReactNode } from "react";

type PanelProps = {
    eyebrow: string;
    title: string;
    children: ReactNode;
    action?: ReactNode;
};

export function Panel({ eyebrow, title, children, action }: PanelProps) {
    return (
        <section className="flex min-h-[390px] w-full min-w-0 max-w-full flex-col overflow-visible rounded-xl border border-[#25475f] bg-[#071b2b] shadow-[0_16px_50px_rgba(0,0,0,0.18)] lg:h-full lg:min-h-0 lg:overflow-hidden">
            <header className="hidden min-w-0 items-center justify-between gap-3 border-b border-[#25475f] bg-[#0b2032] px-4 py-3.5 sm:px-5 sm:py-4 lg:flex">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b8cff]">{eyebrow}</p>
                    <h2 className="mt-1 text-base font-extrabold tracking-tight text-[#f6f8fc]">{title}</h2>
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}
