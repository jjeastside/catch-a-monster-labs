const SITE_URL = "https://jjeastside.github.io/catch-a-monster-labs/";
const PREVIEW_SELECTOR = '#cam-lab-share-preview-data[data-ready="true"]';
const CACHE_VERSION = "v5";

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
    if (path.startsWith("/catch-a-monster-labs/")) {
      return new URL(path, new URL(SITE_URL).origin).toString();
    }

    if (path.startsWith("/")) {
      return new URL(`.${path}`, SITE_URL).toString();
    }

    return new URL(path, SITE_URL).toString();
  } catch {
    return `${SITE_URL}preview.png`;
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
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

function normalizePreview(preview) {
  return {
    name: preview?.monsterName || preview?.name || "Shared Build",
    rarity: preview?.rarity || "",
    element: preview?.element || "",
    damage: preview?.damage || "—",
    health: preview?.health || "—",
    critChance: preview?.critChance || "—",
    critMultiplier: preview?.critMultiplier || "—",
    image: absoluteAssetUrl(preview?.imagePath || preview?.image || ""),
  };
}

function previewLooksValid(preview) {
  return Boolean(
      preview &&
      preview.name &&
      preview.name !== "Shared Build" &&
      preview.damage &&
      preview.damage !== "—" &&
      preview.health &&
      preview.health !== "—"
  );
}

async function storePreview(env, origin, buildCode, preview) {
  if (!env.PREVIEWS) {
    throw new Error("Missing Cloudflare KV binding named PREVIEWS.");
  }

  if (!previewLooksValid(preview)) {
    throw new Error("Invalid preview payload.");
  }

  await env.PREVIEWS.put(
      buildCode,
      JSON.stringify(preview),
      {
        expirationTtl: 60 * 60 * 24 * 30,
      },
  );

  // If this build was rendered before, invalidate only the edge PNG cache.
  await caches.default.delete(cacheKeyForPng(origin, buildCode));
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

  const textPreview =
      element.text ??
      element.textContent ??
      element.innerText ??
      element.innerHTML ??
      "";

  const attributePreview = findAttribute(element.attributes, "data-preview");
  const rawPreview =
      (typeof textPreview === "string" ? textPreview.trim() : "") ||
      (typeof attributePreview === "string" ? attributePreview.trim() : "");

  if (!rawPreview) {
    throw new Error("CAM Lab share preview data was empty.");
  }

  let preview;
  try {
    preview = JSON.parse(rawPreview);
  } catch {
    throw new Error(`CAM Lab returned invalid share preview JSON: ${rawPreview.slice(0, 200)}`);
  }

  return normalizePreview(preview);
}

async function getPreviewData(env, origin, buildCode) {
  if (!env.PREVIEWS) {
    throw new Error("Missing Cloudflare KV binding named PREVIEWS.");
  }

  const stored = await env.PREVIEWS.get(buildCode, { type: "json" });
  if (previewLooksValid(stored)) {
    return stored;
  }

  // Backwards-compatible fallback for links created before KV priming existed.
  // New Share Build links should normally never reach this branch.
  const preview = await readPreviewFromCamLab(env, buildCode);
  await storePreview(env, origin, buildCode, preview);
  return preview;
}

function rarityBorderBackground(rarity) {
  switch (rarity) {
    case "Common":
      return "#707070";
    case "Uncommon":
      return "#28a745";
    case "Rare":
      return "#299ddd";
    case "Epic":
      return "#bd45d8";
    case "Legendary":
      return "#f28a22";
    case "Mythical":
      return "linear-gradient(to right,#ff3347,#ff8a1f,#ffe13b,#35e56f,#22bde8,#b43cff)";
    case "Secret":
      return "#ff2738";
    case "Void":
      return "linear-gradient(135deg,#84ff00,#4cff8f,#00f2ff,#0096c7)";
    default:
      return "#3b4759";
  }
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
    background: ${rarityBorderBackground(data.rarity)};
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

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname === "/prime" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response("Invalid JSON body.", {
          status: 400,
          headers: {
            "content-type": "text/plain; charset=UTF-8",
            ...corsHeaders(),
          },
        });
      }

      const buildCode = String(body?.buildCode ?? "");
      if (!buildCode.startsWith("C1")) {
        return new Response("Invalid build code.", {
          status: 400,
          headers: {
            "content-type": "text/plain; charset=UTF-8",
            ...corsHeaders(),
          },
        });
      }

      const preview = normalizePreview(body?.preview ?? {});
      if (!previewLooksValid(preview)) {
        return new Response("Invalid preview payload.", {
          status: 400,
          headers: {
            "content-type": "text/plain; charset=UTF-8",
            ...corsHeaders(),
          },
        });
      }

      await storePreview(env, url.origin, buildCode, preview);

      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "no-store",
          ...corsHeaders(),
        },
      });
    }

    const buildCode = getBuildCode(url);

    if (!buildCode.startsWith("C1")) {
      return Response.redirect(SITE_URL, 302);
    }

    let data;
    try {
      data = await getPreviewData(env, url.origin, buildCode);
    } catch (error) {
      return new Response(
          `CAM Lab preview error: ${error instanceof Error ? error.message : String(error)}`,
          {
            status: 500,
            headers: { "content-type": "text/plain; charset=UTF-8" },
          },
      );
    }

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

      if (!env.BROWSER) {
        return new Response(
            "Missing Cloudflare Browser Run binding named BROWSER.",
            { status: 500 }
        );
      }

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
