import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { normalizeOptional } from "@/lib/validators/common";
import { systemRoleSchema } from "@/lib/validators/system-role";

function parseId(id: string) {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("参数错误");
  }
  return value;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:role:list");
    const { id } = await params;
    const role = await prisma.sysRole.findUnique({
      where: { id: parseId(id) },
      include: { menus: true },
    });

    if (!role) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json(role);
  } catch (error) {
    return handleApiError(error, "获取角色失败");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:role:update");
    const { id } = await params;
    const roleId = parseId(id);
    const body = systemRoleSchema.parse(await request.json());

    const role = await prisma.sysRole.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new Error("NOT_FOUND");
    }

    const duplicate = await prisma.sysRole.findFirst({
      where: { code: body.code, NOT: { id: roleId } },
    });
    if (duplicate) {
      throw new Error("角色编码已存在");
    }

    await prisma.$transaction(async (tx) => {
      await tx.sysRole.update({
        where: { id: roleId },
        data: {
          name: body.name,
          code: body.code,
          orderNum: body.orderNum,
          status: body.status,
          remark: normalizeOptional(body.remark),
        },
      });

      await tx.sysRoleMenu.deleteMany({ where: { roleId } });

      if (body.menuIds.length > 0) {
        await tx.sysRoleMenu.createMany({
          data: body.menuIds.map((menuId) => ({ roleId, menuId })),
        });
      }
    });

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    return handleApiError(error, "更新角色失败");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:role:delete");
    const { id } = await params;
    const roleId = parseId(id);

    const [role, userCount] = await Promise.all([
      prisma.sysRole.findUnique({ where: { id: roleId } }),
      prisma.sysUserRole.count({ where: { roleId } }),
    ]);

    if (!role) {
      throw new Error("NOT_FOUND");
    }

    if (userCount > 0) {
      throw new Error("该角色已分配给用户，不能删除");
    }

    await prisma.sysRole.delete({ where: { id: roleId } });
    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    return handleApiError(error, "删除角色失败");
  }
}
