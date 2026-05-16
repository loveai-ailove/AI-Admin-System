import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { resetPasswordSchema } from "@/lib/validators/profile";
import { listUserSessionTokens } from "@/lib/auth/session";
import { logOperation, updateLogoutTimeBySessionTokens } from "@/lib/logger";
import { OperType } from "@/generated/prisma/client";

function parseId(id: string) {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("参数错误");
  }
  return value;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:user:update");
    const { id } = await params;
    const userId = parseId(id);
    const body = resetPasswordSchema.parse(await request.json());

    const user = await prisma.sysUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("NOT_FOUND");
    }

    const sessionTokens = await listUserSessionTokens(userId);
    const passwordHash = await hashPassword(body.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.sysUser.update({
        where: { id: userId },
        data: {
          passwordHash,
        },
      });

      await tx.sysUserSession.deleteMany({
        where: { userId },
      });
    });

    await updateLogoutTimeBySessionTokens(sessionTokens);
    await logOperation({
      request,
      module: "用户管理",
      operType: OperType.UPDATE,
      description: `重置用户密码: ${user.username}`,
      requestParam: JSON.stringify(body),
    });

    return NextResponse.json({ message: "密码重置成功" });
  } catch (error) {
    return handleApiError(error, "重置密码失败");
  }
}
