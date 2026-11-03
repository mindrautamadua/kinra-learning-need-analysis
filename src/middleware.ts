import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESI, tokenValid } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const ok = await tokenValid(request.cookies.get(COOKIE_SESI)?.value);
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  if (!ok && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (ok && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
