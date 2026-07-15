import type { ReactNode } from "react";

type BadgeProps = {
    children: ReactNode;
};

export function Badge({ children }: BadgeProps) {
    return (
        <span className="inline-flex items-center rounded-md border border-[#303848] bg-[#202632] px-2 py-1 text-xs font-medium text-[#d8dee9]">
      {children}
    </span>
    );
}