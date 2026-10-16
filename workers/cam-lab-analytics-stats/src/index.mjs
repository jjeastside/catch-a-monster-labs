/**
 * Public aggregate Cam Lab page-view counts, powered by Cloudflare Web Analytics.
 * Every 30 minutes, a Cron Trigger copies aggregated daily page views into KV.
 * The public endpoint ONLY reads KV; it never exposes an Analytics API token.
 * Previously recorded days stay in KV after Cloudflare's analytics retention window.
 */
const GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";
const KV_KEY = "cam-lab-daily-pageviews-v1";
const TRACKING_START = "2026-10-15"; // Date Web Analytics was created for Cam Lab.
const PUBLIC_ORIGIN = "https://jjeastside.github.io";
const MAX_LOOKBACK_DAYS = 29; // Inclusive today => at most 30 daily buckets.
const QUERY = `
query DailyCamLabViews($accountTag: String!, $siteTag: String!, $since: Time!, $until: Time!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      rumPageloadEventsAdaptiveGroups(
        limit: 40,
        filter: { siteTag: $siteTag, datetime_geq: $since, datetime_lt: $until },
        orderBy: [date_ASC]
      ) {
        dimensions { date }
        count
      }
    }
  }
}`;

const utcDay = (date) => date.toISOString().slice(0, 10);
const addDays = (date, n) => new Date(date.getTime() + n * 86400000);
const validDay = (day) => /^\d{4}-\d{2}-\d{2}$/.test(day);
const safeCount = (count) => Number.isSafeInteger(count) && count >= 0;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": PUBLIC_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=300",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders() });
}

function requireConfig(env) {
  if (!env.STATS_KV || !env.CF_ANALYTICS_API_TOKEN || !/^[a-f0-9]{32}$/i.test(env.CF_ACCOUNT_ID || "") ||
      !/^[a-f0-9]{32}$/i.test(env.CF_SITE_TAG || "")) {
    throw new Error("Configure STATS_KV, CF_ACCOUNT_ID, CF_SITE_TAG, and CF_ANALYTICS_API_TOKEN");
  }
}

export async function syncDailyStats(env, now = new Date()) {
  requireConfig(env);
  const today = new Date(`${utcDay(now)}T00:00:00.000Z`);
  const startDay = [utcDay(addDays(today, -MAX_LOOKBACK_DAYS)), TRACKING_START].sort().at(-1);
  const until = addDays(today, 1).toISOString().replace(".000Z", "Z");
  const since = `${startDay}T00:00:00Z`;

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.CF_ANALYTICS_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        accountTag: env.CF_ACCOUNT_ID,
        siteTag: env.CF_SITE_TAG,
        since,
        until,
      },
    }),
  });

  if (!response.ok) throw new Error(`Cloudflare Analytics HTTP ${response.status}`);
  const result = await response.json();
  if (result.errors?.length) throw new Error(`Cloudflare GraphQL: ${JSON.stringify(result.errors)}`);
  const groups = result?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;
  if (!Array.isArray(groups) || groups.length > 40) throw new Error("Invalid Cloudflare daily analytics result");

  const saved = (await env.STATS_KV.get(KV_KEY, "json")) || { days: {} };
  const days = Object.assign(Object.create(null), saved.days || {});

  // Set each refreshed day to zero first, so no-traffic dates don't retain old counts.
  for (let date = new Date(`${startDay}T00:00:00Z`); date <= today; date = addDays(date, 1)) {
    days[utcDay(date)] = 0;
  }
  for (const group of groups) {
    const date = group?.dimensions?.date;
    if (!validDay(date) || date < startDay || date > utcDay(today) || !safeCount(group.count)) {
      throw new Error("Unexpected date or page-view count in Cloudflare analytics");
    }
    days[date] += group.count;
  }

  await env.STATS_KV.put(KV_KEY, JSON.stringify({
    days,
    updatedAt: now.toISOString(),
  }));
}

export async function readStats(env, now = new Date()) {
  const record = await env.STATS_KV?.get(KV_KEY, "json");
  if (!record?.days || !record.updatedAt) return null;

  const today = new Date(`${utcDay(now)}T00:00:00.000Z`);
  const weekStart = utcDay(addDays(today, -6));
  const currentDay = utcDay(today);
  let weeklyViews = 0;
  let totalViews = 0;

  for (const [day, value] of Object.entries(record.days)) {
    if (!validDay(day) || day < TRACKING_START || day > currentDay || !safeCount(value)) continue;
    totalViews += value;
    if (day >= weekStart) weeklyViews += value;
  }

  return {
    weeklyViews,
    totalViews,
    updatedAt: record.updatedAt,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
    if (request.method !== "GET" || url.pathname !== "/stats") {
      return json({ error: "Not found" }, 404);
    }
    try {
      const stats = await readStats(env);
      if (!stats) return json({ error: "Analytics not initialized yet" }, 503);
      return json(stats);
    } catch (error) {
      console.error("Unable to load public analytics stats:", error);
      return json({ error: "Analytics temporarily unavailable" }, 503);
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(syncDailyStats(env).catch((error) => {
      console.error("Unable to synchronize Cam Lab analytics:", error);
      throw error;
    }));
  },
};
