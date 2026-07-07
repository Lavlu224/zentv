import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const url = req.nextUrl;
  const { pathname } = url;

  if (!req.auth && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const isRSC = req.headers.get("RSC") === "1" || req.headers.get("Next-Router-Prefetch") === "1";
    if (isRSC) return NextResponse.next();
    const loginUrl = new URL("/admin/login", url.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
