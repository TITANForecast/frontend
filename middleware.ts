import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to handle trailing slash redirects without breaking POST requests.
 *
 * Next.js trailingSlash:true causes 308 redirects on URLs without trailing slashes.
 * Browsers drop POST request bodies during 308 redirects, causing API routes to hang.
 *
 * This middleware uses skipTrailingSlashRedirect (in next.config.js) to disable
 * the automatic redirect, then manually handles trailing slashes:
 * - API routes (POST/PUT/PATCH/DELETE): rewrite to trailing slash (preserves body)
 * - Page routes (GET): redirect to trailing slash (SEO-friendly)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if already has trailing slash or is a file/asset request
  if (pathname.endsWith("/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // For API routes, always rewrite (never redirect)
  // This avoids POST body loss and redirect loops with query params
  if (pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname + "/";
    return NextResponse.rewrite(url);
  }

  // For non-GET requests, rewrite to preserve the request body
  if (request.method !== "GET") {
    const url = request.nextUrl.clone();
    url.pathname = pathname + "/";
    return NextResponse.rewrite(url);
  }

  // For page GET requests, redirect (308) for SEO
  const url = request.nextUrl.clone();
  url.pathname = pathname + "/";
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
