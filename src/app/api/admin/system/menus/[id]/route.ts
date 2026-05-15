import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { normalizeOptional } from "@/lib/validators/common";
import { systemMenuSchema } from "@/lib/validators/system-menu";

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
    await requireApiPermission("system:menu:list");
    const { id } = await params;
    const menu = await prisma.sysMenu.findUnique({ where: { id: parseId(id) } });
    if (!menu) throw new Error("NOT_FOUND");
    return NextResponse.json(menu);
  } catch (error) {
    return handleApiError(error, "获取菜单失败");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:menu:update");
    const { id } = await params;
    const menuId = parseId(id);
    const body = systemMenuSchema.parse(await request.json());

    const existing = await prisma.sysMenu.findUnique({ where: { id: menuId } });
    if (!existing) throw new Error("NOT_FOUND");
    if (body.parentId === menuId) throw new Error("上级菜单不能选择自己");

    await prisma.sysMenu.update({
      where: { id: menuId },
      data: {
        parentId: body.parentId ?? null,
        name: body.name,
        type: body.type,
        path: normalizeOptional(body.path),
        component: normalizeOptional(body.component),
        perms: normalizeOptional(body.perms),
        icon: normalizeOptional(body.icon),
        orderNum: body.orderNum,
        visible: body.visible,
        status: body.status,
        remark: normalizeOptional(body.remark),
      },
    });

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    return handleApiError(error, "更新菜单失败");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:menu:delete");
    const { id } = await params;
    const menuId = parseId(id);

    const [menu, childCount, roleCount] = await Promise.all([
      prisma.sysMenu.findUnique({ where: { id: menuId } }),
      prisma.sysMenu.count({ where: { parentId: menuId } }),
      prisma.sysRoleMenu.count({ where: { menuId } }),
    ]);

    if (!menu) throw new Error("NOT_FOUND");
    if (childCount > 0) throw new Error("请先删除子菜单");
    if (roleCount > 0) throw new Error("该菜单已分配给角色，不能删除");

    await prisma.sysMenu.delete({ where: { id: menuId } });
    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    return handleApiError(error, "删除菜单失败");
  }
}
