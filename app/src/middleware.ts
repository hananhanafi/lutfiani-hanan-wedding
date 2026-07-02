import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { getToken } from "next-auth/jwt";

// Routes that bypass the site password gate
const EXEMPT_PREFIXES = ["/admin", "/scanner", "/api", "/pass", "/enter", "/_next"];

// Routes a "sender" role is allowed to visit
const SENDER_ALLOWED = ["/admin/whatsapp", "/admin/whatsapp-contacts", "/admin/kirim", "/admin/groups", "/admin/login"];

function isExempt(pathname: string) {
  return EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validate the expiring unlock cookie (`${expiry}.${sig}`): the signature must
 * match and the embedded expiry must be in the future.
 */
async function isUnlockCookieValid(cookie: string | undefined, secret: string): Promise<boolean> {
  if (!cookie) return false;
  const dot = cookie.lastIndexOf(".");
  if (dot < 0) return false;
  const expiryStr = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = await hmacHex(secret, `site_unlocked:${expiryStr}`);
  return sig === expected;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET ?? "";

  // Site password gate: redirect to /enter if cookie is missing or invalid
  if (!isExempt(pathname) && secret) {
    const cookieToken = request.cookies.get("site_unlocked")?.value;
    if (!(await isUnlockCookieValid(cookieToken, secret))) {
      const enterUrl = new URL("/enter", request.url);
      // Preserve the full path + query (e.g. ?token=…) so the guest's personal
      // invitation link isn't lost after unlocking.
      enterUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return NextResponse.redirect(enterUrl);
    }
  }

  // API routes don't need Supabase session cookie refreshing, and
  // forwarding the request through NextResponse.next({ request }) can break
  // multipart body streaming (e.g. file uploads).
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Role-based access: sender role may only visit whatsapp + kirim pages
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.role === "sender") {
      const allowed = SENDER_ALLOWED.some((p) => pathname.startsWith(p));
      if (!allowed) {
        return NextResponse.redirect(new URL("/admin/kirim", request.url));
      }
    }
  }

  const { supabaseResponse } = updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};