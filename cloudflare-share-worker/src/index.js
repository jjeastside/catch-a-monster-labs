const SITE_URL = "https://jjeastside.github.io/catch-a-monster-labs/";
const PREVIEW_SELECTOR = "#cam-lab-share-preview-data";
const CACHE_VERSION = "v3";

function escapeHtml(value) {
  return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
}

function absoluteAssetUrl(path) {
  if (!path) return `${SITE_URL}preview.png`;

  try {
    // Production assetPath may already include /catch-a-monster-labs/.
    if (path.startsWith("/catch-a-monster-labs/")) {
      return new URL(path, new URL(SITE_URL).origin).toString();
    }

    // A raw public-folder path such as /monster-artwork/dumplorer.png
    // should remain under the GitHub Pages repository base path.
    if (path.startsWith("/")) {
      return new URL(`.${path}`, SITE_URL).toString();
    }

    return new URL(path, SITE_URL).toString();
  } catch {
    return `${SITE_URL}preview.png`;
  }
}

function getBuildCode(url) {
  if (url.pathname.startsWith("/b/")) {
    try {
      return decodeURIComponent(url.pathname.slice(3));
    } catch {
      return url.pathname.slice(3);
    }
  }

  return url.searchParams.get("b") ?? "";
}

function camLabBuildUrl(buildCode) {
  return `${SITE_URL}#b=${encodeURIComponent(buildCode)}`;
}

function cacheKeyForPreview(origin, buildCode) {
  const url = new URL(`/_preview-data-${CACHE_VERSION}`, origin);
  url.searchParams.set("b", buildCode);
  return new Request(url.toString(), { method: "GET" });
}

function cacheKeyForPng(origin, buildCode) {
  const url = new URL(`/card-${CACHE_VERSION}.png`, origin);
  url.searchParams.set("b", buildCode);
  return new Request(url.toString(), { method: "GET" });
}

function cardUrl(origin, buildCode, pathname) {
  const url = new URL(pathname, origin);
  url.searchParams.set("b", buildCode);
  return url.toString();
}

function findAttribute(attributes, name) {
  return (attributes ?? []).find((attribute) => attribute?.name === name)?.value ?? "";
}

async function rawScrapeDebug(env, buildCode) {
  if (!env.BROWSER) {
    return {
      ok: false,
      error: "Missing Cloudflare Browser Run binding named BROWSER.",
    };
  }

  const response = await env.BROWSER.quickAction("scrape", {
    url: camLabBuildUrl(buildCode),
    elements: [{ selector: PREVIEW_SELECTOR }],
    waitForSelector: {
      selector: PREVIEW_SELECTOR,
      timeout: 30000,
    },
    gotoOptions: {
      waitUntil: "networkidle2",
      timeout: 60000,
    },
  });

  const bodyText = await response.text();

  let parsedBody = bodyText;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch {
    // Keep raw text when the response is not JSON.
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    requestedBuildUrl: camLabBuildUrl(buildCode),
    selector: PREVIEW_SELECTOR,
    body: parsedBody,
  };
}

async function readPreviewFromCamLab(env, buildCode) {
  if (!env.BROWSER) {
    throw new Error("Missing Cloudflare Browser Run binding named BROWSER.");
  }

  const response = await env.BROWSER.quickAction("scrape", {
    url: camLabBuildUrl(buildCode),
    elements: [{ selector: PREVIEW_SELECTOR }],
    waitForSelector: {
      selector: PREVIEW_SELECTOR,
      timeout: 30000,
    },
    gotoOptions: {
      waitUntil: "networkidle2",
      timeout: 60000,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Browser Run scrape failed (${response.status}): ${message}`);
  }

  const payload = await response.json();
  const selectorResult = payload?.result?.find(
      (entry) => entry?.selector === PREVIEW_SELECTOR
  );
  const element = selectorResult?.results?.[0];

  if (!element) {
    throw new Error("CAM Lab loaded, but no share preview data was found.");
  }

  const encodedPreview = findAttribute(element.attributes, "data-preview");
  if (!encodedPreview) {
    throw new Error("CAM Lab share preview data was empty.");
  }

  let preview;
  try {
    preview = JSON.parse(encodedPreview);
  } catch {
    throw new Error("CAM Lab returned invalid share preview JSON.");
  }

  return {
    name: preview.monsterName || "Shared Build",
    rarity: preview.rarity || "",
    element: preview.element || "",
    damage: preview.damage || "—",
    health: preview.health || "—",
    critChance: preview.critChance || "—",
    critMultiplier: preview.critMultiplier || "—",
    image: absoluteAssetUrl(preview.imagePath),
  };
}

async function getPreviewData(env, origin, buildCode, ctx) {
  const cache = caches.default;
  const key = cacheKeyForPreview(origin, buildCode);
  const cached = await cache.match(key);

  if (cached) {
    const cachedPreview = await cached.json();

    const looksValid =
        cachedPreview &&
        cachedPreview.name &&
        cachedPreview.name !== "Shared Build" &&
        cachedPreview.damage &&
        cachedPreview.damage !== "—" &&
        cachedPreview.health &&
        cachedPreview.health !== "—";

    if (looksValid) {
      return cachedPreview;
    }
  }

  const preview = await readPreviewFromCamLab(env, buildCode);

  const cachedResponse = new Response(JSON.stringify(preview), {
    headers: {
      "content-type": "application/json; charset=UTF-8",
      // Reuse exact build results so Discord fetching the page and image
      // normally costs only one calculator scrape.
      "cache-control": "public, max-age=604800",
    },
  });

  const looksValid =
      preview &&
      preview.name &&
      preview.name !== "Shared Build" &&
      preview.damage &&
      preview.damage !== "—" &&
      preview.health &&
      preview.health !== "—";

  if (looksValid) {
    ctx.waitUntil(cache.put(key, cachedResponse));
  }

  return preview;
}

function buildCardHtml(data) {
  const classification = [data.element, data.rarity].filter(Boolean).join(" • ");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  html, body {
    width: 1200px;
    height: 630px;
    margin: 0;
    overflow: hidden;
    background: #08111c;
    font-family: Arial, Helvetica, sans-serif;
    color: white;
  }

  .canvas {
    width: 1200px;
    height: 630px;
    padding: 28px;
    background:
      radial-gradient(circle at 20% 20%, rgba(83,96,255,.10), transparent 32%),
      linear-gradient(180deg, #0b1421, #07101a);
  }

  .shell {
    height: 100%;
    border: 2px solid #344255;
    border-radius: 28px;
    background: linear-gradient(145deg, #152031, #0d1622);
    padding: 28px 34px;
    box-shadow: 0 18px 50px rgba(0,0,0,.35);
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 42px;
    margin-bottom: 22px;
  }

  .brand, .shared {
    color: #7885ff;
    font-weight: 800;
    letter-spacing: 4px;
  }

  .brand { font-size: 22px; }
  .shared { font-size: 17px; }

  .content {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 42px;
  }

  .portrait-wrap {
    width: 320px;
    height: 320px;
    padding: 6px;
    border-radius: 32px;
    background: linear-gradient(135deg,#ff3b30,#ff9f0a,#ffd60a,#32d74b,#0a84ff,#bf5af2);
  }

  .portrait {
    width: 100%;
    height: 100%;
    border-radius: 27px;
    background: #101824;
    object-fit: contain;
    display: block;
  }

  .overview-label {
    color: #7d89ff;
    font-size: 17px;
    letter-spacing: 4px;
    font-weight: 800;
    margin-top: 6px;
  }

  .name {
    font-size: 50px;
    line-height: 1.06;
    font-weight: 850;
    margin: 12px 0 9px;
  }

  .classification {
    color: #d8dee9;
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 30px;
  }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .stat {
    height: 112px;
    border: 2px solid #35455a;
    border-radius: 18px;
    background: #0b1521;
    padding: 18px 24px;
  }

  .label {
    color: #8fa0ba;
    font-size: 15px;
    letter-spacing: 3px;
    font-weight: 800;
    margin-bottom: 13px;
  }

  .value {
    font-size: 37px;
    line-height: 1;
    font-weight: 850;
  }

  .footer {
    color: #66758b;
    font-size: 16px;
    margin-top: 24px;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="shell">
      <div class="top">
        <div class="brand">CAM / LAB</div>
        <div class="shared">SHARED BUILD</div>
      </div>

      <div class="content">
        <div>
          <div class="portrait-wrap">
            <img class="portrait" src="${escapeHtml(data.image)}" alt="">
          </div>
          <div class="footer">Catch a Monster Labs • Build Preview</div>
        </div>

        <div>
          <div class="overview-label">MONSTER OVERVIEW</div>
          <div class="name">${escapeHtml(data.name)}</div>
          <div class="classification">${escapeHtml(classification || "CAM Lab Build")}</div>

          <div class="stats">
            <div class="stat">
              <div class="label">DAMAGE</div>
              <div class="value">${escapeHtml(data.damage)}</div>
            </div>
            <div class="stat">
              <div class="label">HEALTH</div>
              <div class="value">${escapeHtml(data.health)}</div>
            </div>
            <div class="stat">
              <div class="label">CRIT CHANCE</div>
              <div class="value">${escapeHtml(data.critChance)}</div>
            </div>
            <div class="stat">
              <div class="label">CRIT MULTIPLIER</div>
              <div class="value">${escapeHtml(data.critMultiplier)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const buildCode = getBuildCode(url);

    if (!buildCode.startsWith("C1")) {
      return Response.redirect(SITE_URL, 302);
    }

    if (url.pathname === "/debug") {
      const debug = await rawScrapeDebug(env, buildCode);

      return new Response(JSON.stringify(debug, null, 2), {
        status: debug.ok ? 200 : 500,
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex",
        },
      });
    }

    let data;
    try {
      data = await getPreviewData(env, url.origin, buildCode, ctx);
    } catch (error) {
      return new Response(
          `CAM Lab preview error: ${error instanceof Error ? error.message : String(error)}`,
          {
            status: 500,
            headers: { "content-type": "text/plain; charset=UTF-8" },
          },
      );
    }

    // Hidden HTML page Browser Run turns into the final social PNG.
    if (url.pathname === "/card") {
      return new Response(buildCardHtml(data), {
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "public, max-age=604800",
          "x-robots-tag": "noindex",
        },
      });
    }

    if (url.pathname === "/card.png") {
      const cache = caches.default;
      const cacheKey = cacheKeyForPng(url.origin, buildCode);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const screenshot = await env.BROWSER.quickAction("screenshot", {
        url: cardUrl(url.origin, buildCode, "/card"),
        viewport: {
          width: 1200,
          height: 630,
          deviceScaleFactor: 1,
        },
        screenshotOptions: {
          type: "png",
          fullPage: false,
          captureBeyondViewport: false,
        },
        gotoOptions: {
          waitUntil: "networkidle0",
          timeout: 30000,
        },
      });

      if (!screenshot.ok) return screenshot;

      const png = new Response(screenshot.body, {
        status: screenshot.status,
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=604800, immutable",
        },
      });

      ctx.waitUntil(cache.put(cacheKey, png.clone()));
      return png;
    }

    const targetUrl = camLabBuildUrl(buildCode);
    const title = `${data.name} — CAM Lab Build`;
    const classification = [data.element, data.rarity].filter(Boolean).join(" · ");
    const description =
        `${classification}${classification ? " | " : ""}` +
        `${data.damage} DMG · ${data.health} HP · ` +
        `${data.critChance} Crit · ${data.critMultiplier} Crit Multiplier`;

    const imageUrl = cardUrl(url.origin, buildCode, "/card.png");

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CAM Lab">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${escapeHtml(url.toString())}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}">
</head>
<body>
  <p>Opening <a href="${escapeHtml(targetUrl)}">${escapeHtml(data.name)} in CAM Lab</a>…</p>
  <script>location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "public, max-age=300",
        "x-robots-tag": "noindex",
      },
    });
  },
};
