# Cam Lab share preview Worker

`POST /share` stores a build preview in the `PREVIEWS` KV binding and returns a short link. `GET /b/<shortId>` renders social metadata and redirects to the build. `GET /card.png?b=<shortId>` renders the PNG directly with `cf-workers-og` 3.0.1. Browser Run is not required.

## Test locally before merging

Use two PowerShell terminals. Run the frontend with the local Worker URL; restart Next.js after changing this environment variable.

**Terminal 1 — project root**

```powershell
$env:NEXT_PUBLIC_SHARE_PREVIEW_URL = "http://127.0.0.1:8787"
npm run dev -- --hostname 127.0.0.1
```

**Terminal 2 — project root**

```powershell
cd .\cloudflare-share-worker
npm ci
npx wrangler dev --local --ip 127.0.0.1 --port 8787 --var "SITE_URL:http://127.0.0.1:3000/"
```

The `--local` flag uses local KV storage, including short links and previews. It does not modify the production KV namespace. Local data persists in `.wrangler/state`. The optional `SITE_URL` override points redirects and relative image/icon URLs to your local frontend. Without it, the existing GitHub Pages production URL remains the default.

1. Open http://127.0.0.1:3000/calculator/ and select a monster.
2. Set an account, equipment, attributes, trait, mutations, teammates and combat conditions, or apply a recommendation.
3. Open the browser Network tab, click **Share Build**, and verify `POST http://127.0.0.1:8787/share` returns 200 with `ok: true`, `shortId` and a local `shareUrl`.
4. Inspect the POST payload: `buildCode` and `preview` should include the updated build data, Combat Stats, account icons and Combat Conditions.
5. Paste the copied link into a new tab. It should return to your local calculator with the same build and account bonuses.
6. Copy the final segment of that link as `<shortId>`, then open `http://127.0.0.1:8787/card.png?b=<shortId>`. Verify the PNG, monster artwork, gear/trait/mutation icons, account bonuses and combat conditions.
7. Repeat after changing the build and in PvP. Stop and restart Wrangler; verify a saved local short link still resolves.

For a short-link HTML/metadata check in PowerShell:

```powershell
$shortId = "PASTE_THE_SHORT_ID_HERE"
(Invoke-WebRequest "http://127.0.0.1:8787/b/$shortId").Content
Invoke-WebRequest "http://127.0.0.1:8787/card.png?b=$shortId" -OutFile "$env:TEMP\cam-lab-local-preview.png"
```

Opening the Worker root URL by itself is not a share test: it has no build token and can return 404. The frontend can fall back to a long link if `/share` fails, so check the POST response rather than relying only on a copied-link notification. Local URLs cannot be fetched by Discord; test the PNG in your browser locally and check Discord after deploying to a reachable Worker.

When finished, stop Next.js and remove the local frontend override before rebuilding for production:

```powershell
Remove-Item Env:NEXT_PUBLIC_SHARE_PREVIEW_URL -ErrorAction SilentlyContinue
```

Keep the localhost override in the development command; do not add it to production Wrangler variables. Do not commit `node_modules`, `.wrangler`, or local environment files.

## Deploy

From this folder, install with `npm ci`, confirm the production `PREVIEWS` KV binding, then run `npx wrangler deploy` when ready. The configured production namespace is `cb036440dbbc4a8cae2c8876cd2da8c9`.
