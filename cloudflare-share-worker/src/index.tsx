import { ImageResponse } from "cf-workers-og/html";

const SITE_URL = "https://jjeastside.github.io/catch-a-monster-labs/";
const PREVIEW_TTL_SECONDS = 60 * 60 * 24 * 30;
const SHORT_ID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type Env = {
  PREVIEWS: KVNamespace;
};

type PreviewData = {
  name: string;
  rarity: string;
  element: string;
  damage: string;
  health: string;
  critChance: string;
  critMultiplier: string;
  image: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function isBuildCode(value: string) {
  return value.startsWith("C1");
}

function getRouteToken(url: URL) {
  if (url.pathname.startsWith("/b/")) {
    try {
      return decodeURIComponent(url.pathname.slice(3));
    } catch {
      return url.pathname.slice(3);
    }
  }

  return url.searchParams.get("b") ?? "";
}

function camLabBuildUrl(buildCode: string) {
  return `${SITE_URL}#b=${encodeURIComponent(buildCode)}`;
}

function previewStorageKey(buildCode: string) {
  return `preview:${buildCode}`;
}

function buildToShortKey(buildCode: string) {
  return `build:${buildCode}`;
}

function shortToBuildKey(shortId: string) {
  return `short:${shortId}`;
}

function cacheKeyForPng(origin: string, buildCode: string) {
  const url = new URL("/card-browserless-v2.png", origin);
  url.searchParams.set("b", buildCode);
  return new Request(url.toString(), { method: "GET" });
}

function absoluteAssetUrl(path: string | undefined) {
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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
      ? value as Record<string, unknown>
      : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function normalizePreview(value: unknown): PreviewData {
  const preview = asRecord(value);

  return {
    name: stringValue(preview.monsterName, stringValue(preview.name, "Shared Build")),
    rarity: stringValue(preview.rarity),
    element: stringValue(preview.element),
    damage: stringValue(preview.damage, "—"),
    health: stringValue(preview.health, "—"),
    critChance: stringValue(preview.critChance, "—"),
    critMultiplier: stringValue(preview.critMultiplier, "—"),
    image: absoluteAssetUrl(stringValue(preview.imagePath, stringValue(preview.image))),
  };
}

function previewLooksValid(preview: PreviewData) {
  return Boolean(
      preview.name &&
      preview.name !== "Shared Build" &&
      preview.damage &&
      preview.damage !== "—" &&
      preview.health &&
      preview.health !== "—",
  );
}

function getDefaultCache(): Cache {
  return (caches as CacheStorage & { default: Cache }).default;
}

function randomShortId(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let output = "";

  for (const byte of bytes) {
    output += SHORT_ID_CHARS[byte % SHORT_ID_CHARS.length];
  }

  return output;
}

async function getOrCreateShortId(env: Env, buildCode: string) {
  const existing = await env.PREVIEWS.get(buildToShortKey(buildCode));
  if (existing) return existing;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shortId = randomShortId(6);
    const collision = await env.PREVIEWS.get(shortToBuildKey(shortId));

    if (collision) continue;

    await env.PREVIEWS.put(shortToBuildKey(shortId), buildCode);
    await env.PREVIEWS.put(buildToShortKey(buildCode), shortId);
    return shortId;
  }

  throw new Error("Unable to allocate a short share ID.");
}

async function resolveBuildCode(env: Env, token: string) {
  if (isBuildCode(token)) return token;

  const buildCode = await env.PREVIEWS.get(shortToBuildKey(token));
  if (!buildCode) {
    throw new Error("Shared build was not found.");
  }

  return buildCode;
}

async function storePreview(env: Env, origin: string, buildCode: string, preview: PreviewData) {
  if (!previewLooksValid(preview)) {
    throw new Error("Invalid preview payload.");
  }

  await env.PREVIEWS.put(
      previewStorageKey(buildCode),
      JSON.stringify(preview),
      {
        expirationTtl: PREVIEW_TTL_SECONDS,
      },
  );

  await getDefaultCache().delete(cacheKeyForPng(origin, buildCode));
}

async function getPreviewData(env: Env, buildCode: string) {
  const stored = await env.PREVIEWS.get(previewStorageKey(buildCode), { type: "json" });
  const preview = normalizePreview(stored);

  if (!previewLooksValid(preview)) {
    throw new Error("This shared build has no primed preview data in KV.");
  }

  return preview;
}

function rarityBorderBackground(rarity: string) {
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
      return "linear-gradient(90deg,#ff3347,#ff8a1f,#ffe13b,#35e56f,#22bde8,#b43cff)";
    case "Secret":
      return "#ff2738";
    case "Void":
      return "linear-gradient(135deg,#84ff00,#4cff8f,#00f2ff,#0096c7)";
    default:
      return "#3b4759";
  }
}

function buildCardMarkup(data: PreviewData) {
  const classification = [data.element, data.rarity].filter(Boolean).join(" • ");

  return `
    <div style="
      display:flex;
      width:1200px;
      height:630px;
      padding:24px;
      background:#070d16;
      font-family:Arial, Helvetica, sans-serif;
      color:white;
      box-sizing:border-box;
    ">
      <div style="
        display:flex;
        flex-direction:column;
        width:100%;
        height:100%;
        border:2px solid #314258;
        border-radius:28px;
        background:linear-gradient(90deg,#0f1a2a 0%, #091428 55%, #08111f 100%);
        padding:28px 34px;
        box-sizing:border-box;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:22px;
        ">
          <div style="display:flex;color:#7f8cff;font-size:22px;font-weight:800;letter-spacing:4px;">CAM / LAB</div>
          <div style="display:flex;color:#7f8cff;font-size:17px;font-weight:800;letter-spacing:4px;">SHARED BUILD</div>
        </div>

        <div style="display:flex;flex:1;gap:36px;">
          <div style="display:flex;flex-direction:column;width:320px;flex-shrink:0;">
            <div style="
              display:flex;
              width:320px;
              height:320px;
              padding:6px;
              border-radius:32px;
              background:${rarityBorderBackground(data.rarity)};
              box-sizing:border-box;
            ">
              <div style="
                display:flex;
                align-items:center;
                justify-content:center;
                width:100%;
                height:100%;
                background:#101824;
                border-radius:27px;
                overflow:hidden;
              ">
                <img
                  src="${escapeHtml(data.image)}"
                  alt=""
                  style="width:280px;height:280px;object-fit:contain;"
                />
              </div>
            </div>
            <div style="display:flex;margin-top:24px;color:#66758b;font-size:16px;">
              Catch a Monster Labs • Build Preview
            </div>
          </div>

          <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
            <div style="display:flex;color:#7d89ff;font-size:17px;letter-spacing:4px;font-weight:800;">MONSTER OVERVIEW</div>
            <div style="display:flex;margin-top:12px;font-size:56px;line-height:0.98;font-weight:850;max-width:100%;">
              ${escapeHtml(data.name)}
            </div>
            <div style="display:flex;margin-top:10px;color:#d8dee9;font-size:22px;font-weight:700;">
              ${escapeHtml(classification || "CAM Lab Build")}
            </div>

            <div style="display:flex;flex-direction:column;gap:18px;margin-top:26px;">
              <div style="display:flex;gap:18px;">
                ${statBox("DAMAGE", data.damage)}
                ${statBox("HEALTH", data.health)}
              </div>
              <div style="display:flex;gap:18px;">
                ${statBox("CRIT CHANCE", data.critChance)}
                ${statBox("CRIT MULTIPLIER", data.critMultiplier)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


function statBox(label: string, value: string) {
  return `
    <div style="
      display:flex;
      flex-direction:column;
      justify-content:flex-start;
      width:344px;
      height:110px;
      border:2px solid #32465f;
      border-radius:18px;
      background:#091424;
      padding:18px 24px;
      box-sizing:border-box;
      flex-shrink:0;
    ">
      <div style="display:flex;color:#8fa0ba;font-size:15px;letter-spacing:3px;font-weight:800;">${escapeHtml(label)}</div>
      <div style="display:flex;margin-top:16px;font-size:37px;line-height:1;font-weight:850;">${escapeHtml(value)}</div>
    </div>
  `;
}


const worker = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname === "/share" && request.method === "POST") {
      let body: Record<string, unknown>;
      try {
        body = asRecord(await request.json());
      } catch {
        return new Response("Invalid JSON body.", {
          status: 400,
          headers: {
            "content-type": "text/plain; charset=UTF-8",
            ...corsHeaders(),
          },
        });
      }

      const buildCode = stringValue(body.buildCode);
      if (!isBuildCode(buildCode)) {
        return new Response("Invalid build code.", {
          status: 400,
          headers: {
            "content-type": "text/plain; charset=UTF-8",
            ...corsHeaders(),
          },
        });
      }

      const preview = normalizePreview(body.preview);
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
      const shortId = await getOrCreateShortId(env, buildCode);

      return new Response(
          JSON.stringify({
            ok: true,
            shortId,
            shareUrl: `${url.origin}/b/${shortId}`,
          }),
          {
            headers: {
              "content-type": "application/json; charset=UTF-8",
              "cache-control": "no-store",
              ...corsHeaders(),
            },
          },
      );
    }

    const rawToken = getRouteToken(url);
    let buildCode: string;

    try {
      buildCode = await resolveBuildCode(env, rawToken);
    } catch (error) {
      return new Response(
          `CAM Lab preview error: ${error instanceof Error ? error.message : String(error)}`,
          {
            status: 404,
            headers: { "content-type": "text/plain; charset=UTF-8" },
          },
      );
    }

    let data: PreviewData;
    try {
      data = await getPreviewData(env, buildCode);
    } catch (error) {
      return new Response(
          `CAM Lab preview error: ${error instanceof Error ? error.message : String(error)}`,
          {
            status: 500,
            headers: { "content-type": "text/plain; charset=UTF-8" },
          },
      );
    }

    if (url.pathname === "/card.png") {
      const cache = getDefaultCache();
      const cacheKey = cacheKeyForPng(url.origin, buildCode);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const image = await ImageResponse.create(buildCardMarkup(data), {
        width: 1200,
        height: 630,
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=604800, immutable",
        },
      });

      await cache.put(cacheKey, image.clone());
      return image;
    }

    const targetUrl = camLabBuildUrl(buildCode);
    const title = `${data.name} — CAM Lab Build`;
    const classification = [data.element, data.rarity].filter(Boolean).join(" · ");
    const description =
        `${classification}${classification ? " | " : ""}` +
        `${data.damage} DMG · ${data.health} HP · ` +
        `${data.critChance} Crit · ${data.critMultiplier} Crit Multiplier`;

    const imageUrl = `${url.origin}/card.png?b=${encodeURIComponent(rawToken)}`;

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

export default worker;
