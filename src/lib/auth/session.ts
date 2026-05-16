import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/constants";

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function createSession(params: {
  userId: number;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.sysUserSession.create({
    data: {
      userId: params.userId,
      token,
      expiresAt,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    expires: expiresAt,
  });

  return token;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await invalidateSessionByToken(token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function invalidateSessionByToken(token: string) {
  await prisma.sysUserSession.deleteMany({ where: { token } });
}

export async function invalidateUserSessions(userId: number) {
  await prisma.sysUserSession.deleteMany({ where: { userId } });
}

export async function listUserSessionTokens(userId: number) {
  const sessions = await prisma.sysUserSession.findMany({
    where: { userId },
    select: { token: true },
  });

  return sessions.map((session) => session.token);
}
