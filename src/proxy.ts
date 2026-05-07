import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Next.js 16 uses proxy.ts (renamed from middleware.ts)
// Export function must be named 'proxy'

const PUBLIC_PATHS = [
  "/api/auth",
  "/api/clinicians",
  "/_next",
  "/favicon.ico",
  "/icon",
  "/sw.js",
  "/manifest",
];

const LOCALES = ["en", "bn"];
const DEFAULT_LOCALE = "en";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static/api files
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Locale redirect ───────────────────────────────────────────────────────
  // If the path doesn't start with a locale, redirect to default locale
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale && !pathname.startsWith("/api")) {
    // Detect preferred locale from Accept-Language header
    const acceptLang = request.headers.get("accept-language") ?? "";
    const prefersBengali = acceptLang.toLowerCase().includes("bn");
    const locale = prefersBengali ? "bn" : DEFAULT_LOCALE;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // ── Auth protection ───────────────────────────────────────────────────────
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const userRole = (session?.user as any)?.role ?? "user";

  // Detect locale from pathname
  const locale = LOCALES.find((l) => pathname.startsWith(`/${l}`)) ?? DEFAULT_LOCALE;

  // Protected: user dashboard + assessment
  const isUserProtected =
    pathname.startsWith(`/${locale}/dashboard`) ||
    pathname.startsWith(`/${locale}/assessment`);

  // Protected: expert panel
  const isExpertProtected = pathname.startsWith(`/${locale}/expert/dashboard`);

  // Auth pages (don't redirect logged-in users back to login)
  const isAuthPage = pathname.startsWith(`/${locale}/auth`);

  if (isAuthPage && isLoggedIn) {
    const dest = userRole === "expert" || userRole === "admin"
      ? `/${locale}/expert/dashboard`
      : `/${locale}/dashboard`;
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isUserProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  if (isExpertProtected) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
    }
    if (userRole !== "expert" && userRole !== "admin") {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
