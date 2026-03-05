import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "draxton_session";

type SessionPayload = {
  sid: string;
  uid: string;
  role: "ADMIN" | "USER";
  exp: number;
};

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

function secret() {
  return process.env.AUTH_SECRET || "change-me-in-env";
}

async function sign(payloadB64: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const bytes = Array.from(new Uint8Array(signature));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, receivedSig] = parts;
  const expectedSig = await sign(payloadB64);
  if (receivedSig !== expectedSig) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as SessionPayload;
    if (!payload?.uid || !payload?.sid || !payload?.role || !payload?.exp) return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const protectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/Dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/Admin");

  if (!protectedPath) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname.startsWith("/admin") || pathname.startsWith("/Admin")) && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/Dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/Dashboard/:path*",
    "/projects/:path*",
    "/reports/:path*",
    "/admin/:path*",
    "/Admin/:path*",
  ],
};
