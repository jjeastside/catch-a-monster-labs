"use client";
import type { ReactNode } from "react";
import { useState } from "react";
export function CollapsibleSection({ title, children, description }: { title: string; children: ReactNode; description?: string }) {
  const [open, setOpen] = useState(true);
  return <section className="rounded-lg border border-[#303848] bg-[#0d1017]/55"><button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"><span><span className="block text-sm font-semibold text-[#e8ebf0]">{title}</span>{description && <span className="mt-0.5 block text-xs text-[#788295]">{description}</span>}</span><span className="text-lg text-[#99a2b3]">{open ? "−" : "+"}</span></button>{open && <div className="border-t border-[#272d3a] p-4">{children}</div>}</section>;
}
