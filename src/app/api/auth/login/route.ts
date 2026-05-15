import { NextResponse } from "next/server";
import { Status } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/auth/api-auth";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await prisma.sysUser.findUnique({ where: { username: body.username } });

    if (!user) {
      throw new Error("用户名或密码错误");
    }

    if (user.status === Status.DISABLED) {
      throw new Error("账号已被禁用");
    }

    const matched = await verifyPassword(body.password, user.passwordHash);

    if (!matched) {
      throw new Error("用户名或密码错误");
    }

    const { ip, userAgent } = getRequestMeta(request);

    await prisma.sysUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    await createSession({ userId: user.id, ip, userAgent });

    return NextResponse.json({ message: "登录成功" });
  } catch (error) {
    return handleApiError(error, "登录失败");
  }
}
