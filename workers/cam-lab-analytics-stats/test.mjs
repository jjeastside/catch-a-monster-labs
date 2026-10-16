import { test } from "node:test";
import assert from "node:assert/strict";
import { syncDailyStats, readStats } from "./src/index.mjs";

const mockKV = () => {
  let data;
  return {
    get: async () => data && JSON.parse(data),
    put: async (_key, value) => { data = value; },
  };
};

test("sync snapshots views and preserves prior days for all-time", async () => {
  const originalFetch = globalThis.fetch;
  const KV = mockKV();
  const env = {
    STATS_KV: KV,
    CF_ANALYTICS_API_TOKEN: "private-placeholder",
    CF_ACCOUNT_ID: "a".repeat(32),
    CF_SITE_TAG: "d6ce3a70a0a142c5bfefcdc462bcc515",
  };
  globalThis.fetch = async (_url, req) => {
    const { variables } = JSON.parse(req.body);
    assert.equal(variables.siteTag, env.CF_SITE_TAG);
    return { ok: true, json: async () => ({ data: { viewer: { accounts: [{ rumPageloadEventsAdaptiveGroups: [
      { dimensions: { date: "2026-10-15" }, count: 8 },
      { dimensions: { date: "2026-10-16" }, count: 3 },
    ] }] } } }) };
  };
  try {
    await syncDailyStats(env, new Date("2026-10-16T18:30:00Z"));
    const result = await readStats(env, new Date("2026-10-16T19:00:00Z"));
    assert.deepEqual([result.weeklyViews, result.totalViews], [11, 11]);
    assert.equal((await readStats(env, new Date("2026-10-25T01:00:00Z"))).weeklyViews, 0);
    assert.equal((await readStats(env, new Date("2026-10-25T01:00:00Z"))).totalViews, 11);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
