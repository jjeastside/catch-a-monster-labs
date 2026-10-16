# Cam Lab public page-view counters

Displays **Views This Week** (rolling 7 UTC calendar days, including today) and **Total Views** (since Web Analytics was activated on 2026-10-15) on the Home page. Counts are **page views**, not identifiable users or unique visitors.

The beacon already exists in `app/layout.tsx` from the earlier analytics change. This Worker queries *Cloudflare Web Analytics* in a scheduled job; it does NOT count every fetch to this Worker. Each day is stored in KV so older days continue to count after Cloudflare's analytics data retention period. The public `/stats` route only exposes aggregate numbers.

## Configure

1. In Cloudflare **Account Home**, copy your **Account ID** (not your site token). Put it in the `CF_ACCOUNT_ID` field in `wrangler.toml`.
2. Create a **new Workers KV namespace** (for example `CAM_LAB_ANALYTICS_DAILY`). Copy its namespace ID into `id` under `[[kv_namespaces]]`. Leave the binding name `STATS_KV` unchanged. This will not affect the existing `cam-lab-feedback` or `cam-lab-share` Workers.
3. Create an **API token** under Cloudflare **Manage account → API Tokens** (or My Profile → API Tokens) with **Account → Account Analytics → Read** permission, restricted to your own account. **Never paste this API token into GitHub, the website, the Wrangler TOML, or a chat.** This is *different* from the public Web Analytics beacon token.
4. In a terminal at `workers/cam-lab-analytics-stats` (install Node/npm if necessary), run:

   ```powershell
   npx wrangler login
   npx wrangler secret put CF_ANALYTICS_API_TOKEN
   npx wrangler deploy
   ```

   `wrangler secret put` requires a deployed Worker on some Wrangler versions; if so, run `npx wrangler deploy` first, then `npx wrangler secret put CF_ANALYTICS_API_TOKEN`, followed by `npx wrangler deploy` if prompted. Paste the private token when prompted by Wrangler, not into a source file.
5. Cloudflare's scheduled trigger runs at minutes 05 and 35 each hour (UTC), so the initial totals can take up to ~30 minutes. For a faster first run, use **Workers → cam-lab-analytics-stats → Triggers → Cron Events → Test** if available; otherwise wait for the scheduled execution.
6. Test the Worker response by opening `https://cam-lab-analytics-stats.camlab.workers.dev/stats` in a browser. It should return JSON with `weeklyViews`, `totalViews`, `updatedAt`. Verify the Workers subdomain is **camlab.workers.dev** for your account; if different, update `STATS_ENDPOINT` in `app/components/home-page-views.tsx`.
7. Deploy the two Home page files to GitHub Pages normally. Once the Worker has synced data, the Home page shows the actual counts automatically.

## How totals work

- The scheduled job fetches the most recent 30 daily buckets, refreshing delayed or revised Cloudflare data. It merges those daily counts into KV without erasing older saved days.
- This keeps historical totals across the GraphQL API's retention limit **as long as the scheduled job keeps running**. Days that are outside the queryable history before the first successful sync cannot be recovered.
- The total is **since analytics tracking started**, not the number of GitHub Pages visits from before the beacon was installed. Analytics is an estimate and may undercount blocked or disabled JS.
- No zero is displayed until the first successful sync; unavailable data is displayed as `—`.
- The public API sends an `Access-Control-Allow-Origin` response permitting the GitHub Pages origin but **not** private Cloudflare credentials.

### Verify

After deployment, visit the website a few times without an ad blocker, allow a new Cron execution, and compare the numbers with the Cloudflare Web Analytics dashboard over a matching UTC date range. Cloudflare's sampled aggregation can produce small differences.

The code also contains a minimal no-dependency test (`node --test workers/cam-lab-analytics-stats/test.mjs`).
