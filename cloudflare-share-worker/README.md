# CAM Lab browserless OG worker

This version removes Browser Run from `/card.png` generation.

## What changed
- `/share` still stores preview data in Cloudflare KV
- `/b/<shortId>` still resolves short IDs from KV
- `/card.png` is now rendered directly in the Worker using `cf-cf-workers-og`
- Browser Run is only used as an optional fallback for older links that were never primed

## Deploy

Because this worker now depends on npm packages / WASM, deploy it as a small Wrangler project instead of pasting a single file.

1. Install dependencies:
   npm install

2. Make sure your existing Cloudflare Worker still has the `PREVIEWS` KV binding attached in the dashboard.

3. Deploy:
   npx wrangler deploy

If you want to keep the old fallback for unprimed C1 links, also keep the `BROWSER` binding.
If you do not care about old unprimed links anymore, you can remove the `BROWSER` binding after this version is live.


## Bound KV namespace
- PREVIEWS -> cb036440dbbc4a8cae2c8876cd2da8c9


Pinned renderer version: cf-workers-og 3.0.1
