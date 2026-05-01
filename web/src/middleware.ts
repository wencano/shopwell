import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getClientIp, getEdgeIpRatelimit } from "@/lib/ratelimit-edge";

export async function middleware(request: NextRequest) {
  const limiter = getEdgeIpRatelimit();
  if (limiter) {
    const ip = getClientIp(request);
    const { success, limit, remaining, reset } = await limiter.limit(ip);
    if (!success) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((reset - Date.now()) / 1000),
      );
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
        },
      });
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
