import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { normalizeOptional } from "@/lib/validators/common";
import { systemMenuSchema } from "@/lib/validators/system-menu";

export async function GET() {
  try {
    await requireApiPermission("system:menu:list");
    const menus = await prisma.sysMenu.findMany({ orderBy: [{ orderNum: "asc" }, { id: "asc" }] });
    return NextResponse.json(menus);
  } catch (error) {
    return handleApiError(error, "获取菜单列表失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission("system:menu:create");
    const body = systemMenuSchema.parse(await request.json());

    const created = await prisma.sysMenu.create({
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

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建菜单失败");
  }
}
