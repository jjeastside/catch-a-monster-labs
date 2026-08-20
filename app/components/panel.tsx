import type { ReactNode } from "react";

type PanelProps = {
    eyebrow: string;
    title: string;
    children: ReactNode;
    action?: ReactNode;
};

export function Panel({ eyebrow, title, children, action }: PanelProps) {
    return (
        <section className="flex min-h-[390px] w-full min-w-0 max-w-full flex-col overflow-visible rounded-xl border border-[#3b4759] bg-[#0f1620] shadow-[0_16px_50px_rgba(0,0,0,0.18)] lg:min-h-0 lg:overflow-hidden">
            <header className="hidden min-w-0 items-center justify-between gap-3 border-b border-[#3b4759] px-4 py-3.5 sm:px-5 sm:py-4 lg:flex">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7182ff]">{eyebrow}</p>
                    <h2 className="mt-1 text-base font-semibold tracking-tight text-[#f6f8fc]">{title}</h2>
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}
