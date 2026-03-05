import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "draxton_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type SessionPayload = {
  sid: string;
  uid: string;
  role: "ADMIN" | "USER";
  exp: number;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function authSecret(): string {
  return process.env.AUTH_SECRET || "change-me-in-env";
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", authSecret()).update(payloadB64).digest("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function parseAndVerifyToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = signPayload(payloadB64);

  const left = Buffer.from(signature);
  const right = Buffer.from(expectedSig);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payloadB64)) as SessionPayload;
    if (!parsed?.sid || !parsed?.uid || !parsed?.role || !parsed?.exp) return null;
    if (parsed.exp <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildToken(payload: SessionPayload): string {
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export async function createSession(userId: string, role: "ADMIN" | "USER") {
  const sessionId = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const payload: SessionPayload = {
    sid: sessionId,
    uid: userId,
    role,
    exp: expiresAt.getTime(),
  };
  const token = buildToken(payload);
  const tokenHash = hashToken(token);

  await prisma.session.create({
    data: {
      id: sessionId,
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({
      where: { tokenHash },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = parseAndVerifyToken(token);
  if (!payload) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findFirst({
    where: {
      id: payload.sid,
      tokenHash,
      userId: payload.uid,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: { id: true, email: true, role: true },
      },
    },
  });

  if (!session) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}
