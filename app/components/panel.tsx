import type { ReactNode } from "react";

type PanelProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Panel({ eyebrow, title, children, action }: PanelProps) {
  return (
    <section className="flex min-h-[390px] flex-col overflow-hidden rounded-xl border border-[#272d3a] bg-[#11141c] shadow-[0_16px_50px_rgba(0,0,0,0.18)] lg:min-h-0">
      <header className="flex items-center justify-between border-b border-[#272d3a] px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#79e3ae]">{eyebrow}</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-[#f2f4f8]">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
