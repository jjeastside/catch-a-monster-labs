/**
 * TODO
 *
 * Rewrite these tests after the MonsterStatData refactor.
 *
 * The expected values have been verified in-game and should
 * not be changed without confirming the game formulas.

import { describe, expect, it } from "vitest";


import { monster-artwork } from "../../data/monster-artwork";
import { calculateStats } from "./stats";
const monster = (id: string) => monster-artwork.find((entry) => entry.id === id)!;
const expectApprox = (actual: number | undefined, expected: number) => expect(Math.abs((actual ?? Number.NaN) - expected)).toBeLessThan(0.1);
describe("verified stat calculations", () => {
  it("calculates Leaflet E-rank values", () => { expectApprox(calculateStats(monster("leaflet"), 1, "E")?.health, 43.5); expectApprox(calculateStats(monster("leaflet"), 1, "E")?.damage, 7.25); expectApprox(calculateStats(monster("leaflet"), 10, "E")?.health, 94.45); expectApprox(calculateStats(monster("leaflet"), 10, "E")?.damage, 15.74); expectApprox(calculateStats(monster("leaflet"), 20, "E")?.health, 170.65); expectApprox(calculateStats(monster("leaflet"), 20, "E")?.damage, 28.44); });
  it("calculates Wattoad E-rank values", () => { expectApprox(calculateStats(monster("wattoad"), 10, "E")?.health, 136.92); expectApprox(calculateStats(monster("wattoad"), 10, "E")?.damage, 22.81); expectApprox(calculateStats(monster("wattoad"), 20, "E")?.health, 247.36); expectApprox(calculateStats(monster("wattoad"), 20, "E")?.damage, 41.2); expect(calculateStats(monster("wattoad"), 65, "E")?.health).toBeCloseTo(6000, -1); expect(calculateStats(monster("wattoad"), 65, "E")?.damage).toBeCloseTo(1000, -1); });
  it("calculates Treemo E-rank values", () => { expectApprox(calculateStats(monster("treemo"), 10, "E")?.health, 354.15); expectApprox(calculateStats(monster("treemo"), 10, "E")?.damage, 33.04); });
  it("calculates Dummee E-rank values", () => { expect(calculateStats(monster("dummee"), 1, "E")?.health).toBeCloseTo(53, 5); expect(calculateStats(monster("dummee"), 1, "E")?.damage).toBeCloseTo(8, 5); expect(calculateStats(monster("dummee"), 65, "E")?.health).toBeCloseTo(4820, -1); expect(calculateStats(monster("dummee"), 65, "E")?.damage).toBeCloseTo(866.22, 2); });
  it("applies selected rank after E-rank growth", () => { const eRank = calculateStats(monster("leaflet"), 10, "E")!; expect(calculateStats(monster("leaflet"), 10, "A")?.health).toBeCloseTo(eRank.health * 2.86, 8); });
  it("rejects invalid levels", () => expect(() => calculateStats(monster("leaflet"), 0, "E")).toThrow(RangeError));
});

 */