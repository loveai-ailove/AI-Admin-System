import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { normalizeOptional } from "@/lib/validators/common";
import { systemRoleSchema } from "@/lib/validators/system-role";

export async function GET() {
  try {
    await requireApiPermission("system:role:list");
    const roles = await prisma.sysRole.findMany({
      include: { menus: true },
      orderBy: [{ orderNum: "asc" }, { id: "asc" }],
    });
    return NextResponse.json(roles);
  } catch (error) {
    return handleApiError(error, "获取角色列表失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission("system:role:create");
    const body = systemRoleSchema.parse(await request.json());

    const existing = await prisma.sysRole.findUnique({ where: { code: body.code } });
    if (existing) {
      throw new Error("角色编码已存在");
    }

    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.sysRole.create({
        data: {
          name: body.name,
          code: body.code,
          orderNum: body.orderNum,
          status: body.status,
          remark: normalizeOptional(body.remark),
        },
      });

      if (body.menuIds.length > 0) {
        await tx.sysRoleMenu.createMany({
          data: body.menuIds.map((menuId) => ({ roleId: created.id, menuId })),
        });
      }

      return created;
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建角色失败");
  }
}
