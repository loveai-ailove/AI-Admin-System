import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { normalizeOptional } from "@/lib/validators/common";
import { systemUserSchema } from "@/lib/validators/system-user";

async function ensureUniqueUserFields(params: {
  username: string;
  email: string | null;
  mobile: string | null;
  excludeId?: number;
}) {
  const conditions: Prisma.SysUserWhereInput[] = [{ username: params.username }];

  if (params.email) {
    conditions.push({ email: params.email });
  }

  if (params.mobile) {
    conditions.push({ mobile: params.mobile });
  }

  const existing = await prisma.sysUser.findFirst({
    where: {
      OR: conditions,
      NOT: params.excludeId ? { id: params.excludeId } : undefined,
    },
  });

  if (!existing) return;
  if (existing.username === params.username) throw new Error("用户名已存在");
  if (params.email && existing.email === params.email) throw new Error("邮箱已存在");
  if (params.mobile && existing.mobile === params.mobile) throw new Error("手机号已存在");
}

export async function GET() {
  try {
    await requireApiPermission("system:user:list");

    const users = await prisma.sysUser.findMany({
      include: {
        dept: true,
        roles: { include: { role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      users.map((item) => ({
        id: item.id,
        username: item.username,
        nickname: item.nickname,
        email: item.email,
        mobile: item.mobile,
        deptId: item.deptId,
        deptName: item.dept?.name ?? null,
        roleIds: item.roles.map((role) => role.roleId),
        roleNames: item.roles.map((role) => role.role.name),
        status: item.status,
        isAdmin: item.isAdmin,
        createdAt: item.createdAt,
      }))
    );
  } catch (error) {
    return handleApiError(error, "获取系统用户列表失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission("system:user:create");
    const body = systemUserSchema.parse(await request.json());

    if (!body.password) {
      throw new Error("新增用户时必须填写密码");
    }

    const email = normalizeOptional(body.email);
    const mobile = normalizeOptional(body.mobile);
    const remark = normalizeOptional(body.remark);

    await ensureUniqueUserFields({ username: body.username, email, mobile });

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.sysUser.create({
        data: {
          username: body.username,
          nickname: body.nickname,
          passwordHash,
          email,
          mobile,
          deptId: body.deptId ?? null,
          status: body.status,
          isAdmin: body.isAdmin,
          remark,
        },
      });

      if (body.roleIds.length > 0) {
        await tx.sysUserRole.createMany({
          data: body.roleIds.map((roleId) => ({ userId: created.id, roleId })),
        });
      }

      return created;
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建系统用户失败");
  }
}
