import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuth) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin")) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
    if (!session.user?.email || !adminEmails.includes(session.user.email)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
