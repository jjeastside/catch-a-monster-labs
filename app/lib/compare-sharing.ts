import type { Build } from "../types/build";
import {
  createBuildShareCode,
  decodeSharedBuildCode,
} from "./build-sharing";

export type CompareMode = "shared" | "custom";

export type CompareShareState = {
  mode: CompareMode;
  builds: Build[];
};

const COMPARE_SHARE_PREFIX = "CP1";
const COMPARE_HASH_PREFIX = "#c=";
const SHARE_PREVIEW_BASE_URL =
  process.env.NEXT_PUBLIC_SHARE_PREVIEW_URL?.trim() ||
  "https://cam-lab-share.camlab.workers.dev";

function getSharePreviewBaseUrl(): string {
  return SHARE_PREVIEW_BASE_URL.replace(/\/+$/, "");
}

function encodeBase64Url(value: string): string {
  if (typeof window === "undefined") return "";
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window
    .btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
      Math.ceil(value.length / 4) * 4,
      "=",
    );
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function createCompareShareCode(state: CompareShareState): string {
  const payload = JSON.stringify({
    m: state.mode === "custom" ? "c" : "s",
    b: state.builds.slice(0, 4).map((build) => createBuildShareCode(build)),
  });
  return `${COMPARE_SHARE_PREFIX}.${encodeBase64Url(payload)}`;
}

export function decodeCompareShareCode(code: string): CompareShareState | null {
  if (!code.startsWith(`${COMPARE_SHARE_PREFIX}.`)) return null;

  const decoded = decodeBase64Url(code.slice(COMPARE_SHARE_PREFIX.length + 1));
  if (!decoded) return null;

  try {
    const payload = JSON.parse(decoded) as { m?: string; b?: unknown };
    if (!Array.isArray(payload.b) || payload.b.length < 2 || payload.b.length > 4) {
      return null;
    }

    const builds = payload.b
      .map((entry) =>
        typeof entry === "string" ? decodeSharedBuildCode(entry) : null,
      )
      .filter((entry): entry is Partial<Build> => entry !== null)
      .map((entry) => entry as Build);

    if (builds.length !== payload.b.length || builds.some((build) => !build.monsterId)) {
      return null;
    }

    return {
      mode: payload.m === "c" ? "custom" : "shared",
      builds,
    };
  } catch {
    return null;
  }
}

export function getSharedCompareFromLocation(): CompareShareState | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.startsWith(COMPARE_HASH_PREFIX)) return null;
  return decodeCompareShareCode(hash.slice(COMPARE_HASH_PREFIX.length));
}

export function createCompareShareUrl(state: CompareShareState): string {
  const code = createCompareShareCode(state);
  return `${getSharePreviewBaseUrl()}/compare/${encodeURIComponent(code)}`;
}
