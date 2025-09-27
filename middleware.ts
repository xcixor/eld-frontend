import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Helpers to decode a JWT payload and compute expiry
function base64UrlDecode(input: string): string {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = input.length % 4;
  if (pad) input += "=".repeat(4 - pad);
  try {
    return atob(input);
  } catch {
    return "";
  }
}

function decodeJwtPayload(token?: string | null): Record<string, any> | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = base64UrlDecode(parts[1]);
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function getApiTokenExpiryMs(token?: string | null): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  if (typeof payload.exp === "number") return payload.exp * 1000;
  if (typeof payload.iat === "number")
    return payload.iat * 1000 + 24 * 60 * 60 * 1000;
  return null;
}

function buildSignOutRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));

  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
  ];
  cookieNames.forEach((name) => response.cookies.delete(name));
  return response;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token && path === "/") {
    if (token.role === "Super Admin") {
      return NextResponse.redirect(
        new URL("/dashboard/administration", request.url),
      );
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (path === "/" || path === "/register") {
    return NextResponse.next();
  }

  if (!token) {
    return buildSignOutRedirect(request);
  }

  const apiToken = (token as any).apiToken as string | undefined;
  const now = Date.now();
  const apiExp = getApiTokenExpiryMs(apiToken);
  if (apiToken && apiExp !== null && now > apiExp) {
    return buildSignOutRedirect(request);
  }

  if (token.role === "Super Admin") {
    if (path === "/") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url),
      );
    }
    return NextResponse.next();
  }

  if (path.startsWith("/system")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (path.startsWith("/settings/customer") && token.role === "Account Admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/register",
    "/((?!api|_next|auth|static|.*\\..*$).*)",
  ],
};
