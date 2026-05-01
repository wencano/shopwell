import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

let ratelimit: Ratelimit | null | undefined;

/**
 * Distributed IP rate limit for Edge middleware.
 * Requires Upstash Redis (free tier). If env is unset, returns null (no limiting — fine for local dev).
 */
export function getEdgeIpRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    ratelimit = null;
    return ratelimit;
  }

  const redis = new Redis({ url, token });
  const perMinute =
    Number.parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? "200", 10) || 200;

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(perMinute, "60 s"),
    analytics: true,
    prefix: "shopwell:ip",
  });
  return ratelimit;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
