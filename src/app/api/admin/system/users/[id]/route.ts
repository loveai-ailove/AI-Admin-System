import { NextResponse } from "next/server";
import { OperType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { normalizeOptional } from "@/lib/validators/common";
import { systemUserSchema } from "@/lib/validators/system-user";
import { logOperation } from "@/lib/logger";

function parseId(id: string) {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("参数错误");
  }
  return value;
}

async function ensureUserExists(id: number) {
  const user = await prisma.sysUser.findUnique({ where: { id } });
  if (!user) throw new Error("NOT_FOUND");
  return user;
}

async function ensureUniqueFields(id: number, username: string, email: string | null, mobile: string | null) {
  const existing = await prisma.sysUser.findFirst({
    where: {
      OR: [{ username }, ...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
      NOT: { id },
    },
  });

  if (!existing) return;
  if (existing.username === username) throw new Error("用户名已存在");
  if (email && existing.email === email) throw new Error("邮箱已存在");
  if (mobile && existing.mobile === mobile) throw new Error("手机号已存在");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:user:list");
    const { id } = await params;
    const user = await prisma.sysUser.findUnique({
      where: { id: parseId(id) },
      include: {
        dept: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      mobile: user.mobile,
      deptId: user.deptId,
      deptName: user.dept?.name ?? null,
      roleIds: user.roles.map((role) => role.roleId),
      roleNames: user.roles.map((role) => role.role.name),
      status: user.status,
      isAdmin: user.isAdmin,
      remark: user.remark,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return handleApiError(error, "获取系统用户失败");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireApiPermission("system:user:update");
    const { id } = await params;
    const userId = parseId(id);
    const body = systemUserSchema.parse(await request.json());
    const existingUser = await ensureUserExists(userId);
    const email = normalizeOptional(body.email);
    const mobile = normalizeOptional(body.mobile);
    const remark = normalizeOptional(body.remark);

    await ensureUniqueFields(userId, body.username, email, mobile);

    if (!body.deptId) {
      throw new Error("用户必须分配部门");
    }

    if (body.roleIds.length === 0) {
      throw new Error("用户必须至少分配一个角色");
    }

    if (currentUser.id === userId && body.status === "DISABLED") {
      throw new Error("不能禁用当前登录用户");
    }

    await prisma.$transaction(async (tx) => {
      await tx.sysUser.update({
        where: { id: userId },
        data: {
          username: body.username,
          nickname: body.nickname,
          email,
          mobile,
          deptId: body.deptId ?? null,
          status: body.status,
          remark,
          passwordHash: body.password ? await hashPassword(body.password) : existingUser.passwordHash,
        },
      });

      await tx.sysUserRole.deleteMany({ where: { userId } });

      if (body.roleIds.length > 0) {
        await tx.sysUserRole.createMany({
          data: body.roleIds.map((roleId) => ({ userId, roleId })),
        });
      }
    });

    await logOperation({
      request,
      module: "用户管理",
      operType: OperType.UPDATE,
      description: `修改用户: ${existingUser.username}`,
      requestParam: JSON.stringify(body),
    });

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    return handleApiError(error, "更新系统用户失败");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireApiPermission("system:user:delete");
    const { id } = await params;
    const userId = parseId(id);

    if (currentUser.id === userId) {
      throw new Error("不能删除当前登录用户");
    }

    const user = await ensureUserExists(userId);
    await prisma.sysUser.delete({ where: { id: userId } });

    await logOperation({
      request,
      module: "用户管理",
      operType: OperType.DELETE,
      description: `删除用户: ${user.username}`,
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    return handleApiError(error, "删除系统用户失败");
  }
}
