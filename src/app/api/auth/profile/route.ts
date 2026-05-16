import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { normalizeOptional } from "@/lib/validators/common";
import { profileUpdateSchema } from "@/lib/validators/profile";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { logOperation } from "@/lib/logger";
import { OperType } from "@/generated/prisma/client";

export async function GET() {
  try {
    const currentUser = await requireApiPermission();
    const user = await prisma.sysUser.findUnique({
      where: { id: currentUser.id },
      include: {
        dept: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json({
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      mobile: user.mobile,
      deptName: user.dept?.name ?? null,
      roleNames: user.roles.map((item) => item.role.name),
      remark: user.remark,
    });
  } catch (error) {
    return handleApiError(error, "获取个人信息失败");
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await requireApiPermission();
    const body = profileUpdateSchema.parse(await request.json());
    const email = normalizeOptional(body.email);
    const mobile = normalizeOptional(body.mobile);
    const remark = normalizeOptional(body.remark);

    const existing = await prisma.sysUser.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
        NOT: { id: currentUser.id },
      },
    });

    if (existing) {
      if (email && existing.email === email) throw new Error("邮箱已存在");
      if (mobile && existing.mobile === mobile) throw new Error("手机号已存在");
    }

    await prisma.sysUser.update({
      where: { id: currentUser.id },
      data: {
        nickname: body.nickname,
        email,
        mobile,
        remark,
      },
    });

    await logOperation({
      request,
      module: "个人中心",
      operType: OperType.UPDATE,
      description: `更新个人资料: ${currentUser.username}`,
      requestParam: JSON.stringify(body),
    });

    return NextResponse.json({ message: "个人信息已更新" });
  } catch (error) {
    return handleApiError(error, "更新个人信息失败");
  }
}
