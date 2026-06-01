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

  // Count recent requests from this IP
  const { count } = await supabaseAdmin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("action", action)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= max) {
    return { limited: true };
  }

  // Record this request
  await supabaseAdmin.from("rate_limits").insert({ ip, action });

  return { limited: false };
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
