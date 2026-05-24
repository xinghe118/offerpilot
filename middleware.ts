import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthRequired } from "@/lib/auth/guards";

export function middleware(request: NextRequest) {
  if (!isAuthRequired()) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token");
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth");

  if (token || isLoginPage || isAuthApi) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
