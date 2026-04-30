import type { ImageLoaderProps } from "next/image";

/**
 * Skip default /_next/image proxy for remote URLs so CDNs (e.g. Unsplash) are
 * fetched by the browser — avoids "upstream response is invalid" when the
 * optimizer's server-side fetch is blocked or returns HTML.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  if (src.startsWith("/")) {
    return src;
  }
  try {
    const u = new URL(src);
    if (u.hostname === "images.unsplash.com") {
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(quality ?? 80));
      if (!u.searchParams.has("auto")) {
        u.searchParams.set("auto", "format");
      }
    }
    return u.toString();
  } catch {
    return src;
  }
}
