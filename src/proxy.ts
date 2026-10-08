import { NextResponse, type NextRequest } from "next/server";

/**
 * Chequeo optimista del panel: sin cookie de sesión, se redirige al login.
 * La verificación real (firma y usuario) se hace en cada página y acción con requireAdmin().
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("sr_admin")) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
