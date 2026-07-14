"use client";
import { useState } from "react";
import { monsters } from "../data/monsters";
import type { Monster } from "../types/monster";
import { BuildEditor } from "./build-editor";
import { CalculatorResults } from "./calculator-results";
import { MonsterBrowser } from "./monster-browser";
import { TopNavigation } from "./top-navigation";
export function AppShell() {
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  return <div className="min-h-screen bg-[#090b10] text-[#f2f4f8]"><TopNavigation /><main className="mx-auto grid w-full max-w-[1800px] gap-4 p-4 lg:h-[calc(100vh-73px)] lg:grid-cols-[minmax(250px,0.85fr)_minmax(420px,1.65fr)_minmax(280px,1fr)] lg:overflow-hidden lg:p-5"><MonsterBrowser monsters={monsters} selectedMonster={selectedMonster} onSelect={setSelectedMonster} /><CalculatorResults monster={selectedMonster} /><BuildEditor monster={selectedMonster} onReset={() => setSelectedMonster(null)} /></main></div>;
}
