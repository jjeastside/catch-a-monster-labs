const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix public-folder assets when the app is hosted below a GitHub Pages repo path. */
export function assetPath(path: string): string {
    if (!basePath || !path.startsWith("/") || path.startsWith("//")) {
        return path;
    }

    return `${basePath}${path}`;
}