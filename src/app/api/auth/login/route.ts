import { NextResponse } from "next/server";
import { Status, LoginStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/auth/api-auth";
import { logLogin } from "@/lib/logger";
import { verifySlideCaptcha } from "@/lib/captcha";

export async function POST(request: Request) {
  const { ip, userAgent } = getRequestMeta(request);
  let username = "";

  try {
    const body = loginSchema.parse(await request.json());
    username = body.username;

    // 验证滑动验证码（必填，始终执行）
    const captchaResult = verifySlideCaptcha(body.captchaId, body.captchaOffsetX);
    if (!captchaResult.success) {
      await logLogin({ username, ip: ip || undefined, userAgent: userAgent || undefined, status: LoginStatus.FAIL, msg: captchaResult.reason ?? "验证码错误" });
      return NextResponse.json(
        { error: captchaResult.reason ?? "验证码错误", captchaError: true },
        { status: 400 }
      );
    }

    const user = await prisma.sysUser.findUnique({ where: { username: body.username } });

    if (!user) {
      await logLogin({ username, ip: ip || undefined, userAgent: userAgent || undefined, status: LoginStatus.FAIL, msg: "用户名或密码错误" });
      throw new Error("用户名或密码错误");
    }

    if (user.status === Status.DISABLED) {
      await logLogin({ userId: user.id, username, ip: ip || undefined, userAgent: userAgent || undefined, status: LoginStatus.FAIL, msg: "账号已被禁用" });
      throw new Error("账号已被禁用");
    }

    const matched = await verifyPassword(body.password, user.passwordHash);

    if (!matched) {
      await logLogin({ userId: user.id, username, ip: ip || undefined, userAgent: userAgent || undefined, status: LoginStatus.FAIL, msg: "用户名或密码错误" });
      throw new Error("用户名或密码错误");
    }

    await prisma.sysUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    const sessionToken = await createSession({ userId: user.id, ip, userAgent });

    await logLogin({
      userId: user.id,
      sessionToken,
      username,
      ip: ip || undefined,
      userAgent: userAgent || undefined,
      status: LoginStatus.SUCCESS,
      msg: "登录成功",
    });

    return NextResponse.json({ message: "登录成功" });
  } catch (error) {
    if (!username) {
      await logLogin({ username: "unknown", ip: ip || undefined, userAgent: userAgent || undefined, status: LoginStatus.FAIL, msg: error instanceof Error ? error.message : "登录失败" });
    }
    return handleApiError(error, "登录失败");
  }
}
