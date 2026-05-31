import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { getToken } from "next-auth/jwt";

// Routes that bypass the site password gate
const EXEMPT_PREFIXES = ["/admin", "/scanner", "/api", "/pass", "/enter", "/_next"];

// Routes a "sender" role is allowed to visit
const SENDER_ALLOWED = ["/admin/whatsapp", "/admin/kirim", "/admin/login"];

function isExempt(pathname: string) {
  return EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

async function computeUnlockToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("site_unlocked"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET ?? "";

  // Site password gate: redirect to /enter if cookie is missing or invalid
  if (!isExempt(pathname) && secret) {
    const cookieToken = request.cookies.get("site_unlocked")?.value;
    const expected = await computeUnlockToken(secret);
    if (cookieToken !== expected) {
      const enterUrl = new URL("/enter", request.url);
      enterUrl.searchParams.set("redirect", pathname);
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