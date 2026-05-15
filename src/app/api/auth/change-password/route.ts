import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validators/profile";
import { requireApiPermission } from "@/lib/auth/api-auth";

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

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.sysUser.update({
      where: { id: currentUser.id },
      data: {
        passwordHash,
      },
    });

    return NextResponse.json({ message: "密码修改成功" });
  } catch (error) {
    return handleApiError(error, "修改密码失败");
  }
}
