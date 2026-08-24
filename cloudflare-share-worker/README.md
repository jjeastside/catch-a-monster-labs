# CAM Lab Discord PNG preview fix

This version changes the Open Graph image from SVG to a real 1200x630 PNG.

## Important Cloudflare setup

This Worker uses Cloudflare Browser Run to turn the stat-card HTML into a PNG.

Before testing `/card.png`, add a Browser Run binding named exactly:

BROWSER

Also make sure the Worker's compatibility date is 2026-03-24 or newer.

If you deploy with Wrangler, this config is included in `wrangler.toml`.

If you are using Cloudflare's dashboard editor, replace the existing Worker code with
`src/index.js`, then add the Browser Run binding in the Worker's bindings/settings area.

## Free tier

Cloudflare Browser Run currently includes 10 minutes of browser usage per day on Workers Free.
The Worker caches each generated PNG for 7 days, so repeated Discord requests for the same
build should normally reuse the cached image rather than render it again.
