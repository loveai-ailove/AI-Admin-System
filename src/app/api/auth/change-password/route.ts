import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validators/profile";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { clearSession, listUserSessionTokens } from "@/lib/auth/session";
import { logOperation, updateLogoutTimeBySessionTokens } from "@/lib/logger";
import { OperType } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const currentUser = await requireApiPermission();
    const body = changePasswordSchema.parse(await request.json());
    const user = await prisma.sysUser.findUnique({ where: { id: currentUser.id } });

    if (!user) {
      throw new Error("NOT_FOUND");
    }

    const matched = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!matched) {
      throw new Error("当前密码不正确");
    }

    const sessionTokens = await listUserSessionTokens(currentUser.id);
    const passwordHash = await hashPassword(body.newPassword);
    await prisma.$transaction(async (tx) => {
      await tx.sysUser.update({
        where: { id: currentUser.id },
        data: {
          passwordHash,
        },
      });

      await tx.sysUserSession.deleteMany({
        where: { userId: currentUser.id },
      });
    });

    await updateLogoutTimeBySessionTokens(sessionTokens);
    await logOperation({
      request,
      module: "个人中心",
      operType: OperType.UPDATE,
      description: `修改个人密码: ${currentUser.username}`,
      requestParam: JSON.stringify(body),
    });
    await clearSession();

    return NextResponse.json({ message: "密码修改成功，请重新登录" });
  } catch (error) {
    return handleApiError(error, "修改密码失败");
  }
}
