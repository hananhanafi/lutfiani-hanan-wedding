import { supabaseAdmin } from "@/utils/supabase/admin";

/**
 * Supabase-backed rate limiter.
 * Returns { limited: true } if the IP has exceeded `max` requests in the given `windowSeconds`.
 * Automatically purges entries older than the window on each call.
 */
export async function checkRateLimit(
  ip: string,
  action: string,
  max: number,
  windowSeconds: number
): Promise<{ limited: boolean }> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Purge stale entries for this action (fire-and-forget)
  supabaseAdmin
    .from("rate_limits")
    .delete()
    .eq("action", action)
    .lt("created_at", windowStart)
    .then(() => {});

  // Record this request FIRST, then count. Inserting before counting closes the
  // check-then-act race: concurrent requests each persist their own row before
  // counting, so they observe one another. This can over-count slightly, which
  // is the safe direction (it never under-counts and lets abuse through).
  const { error: insertError } = await supabaseAdmin.from("rate_limits").insert({ ip, action });
  if (insertError) {
    // If we can't record the request, fail open rather than block legitimate users.
    console.error("Rate limit insert error:", insertError);
    return { limited: false };
  }

  // Count recent requests from this IP (includes the row we just inserted)
  const { count } = await supabaseAdmin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("action", action)
    .gte("created_at", windowStart);

  // `max` is the allowed number of requests per window; our own row is counted,
  // so the limit is exceeded once the count goes past max.
  return { limited: (count ?? 0) > max };
}

/**
 * Extract the real client IP from a Next.js request.
 * Falls back to "unknown" if no IP header is present.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
