import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAdmin =
    (pathname.startsWith("/admin") && pathname !== "/admin/login") || pathname.startsWith("/api/admin/");

  if (!requiresAdmin || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const ok = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
