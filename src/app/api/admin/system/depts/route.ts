import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { normalizeOptional } from "@/lib/validators/common";
import { systemDeptSchema } from "@/lib/validators/system-dept";
import { resolveDeptAncestors } from "@/lib/system/dept";

export async function GET() {
  try {
    await requireApiPermission("system:dept:list");
    const depts = await prisma.sysDept.findMany({
      orderBy: [{ ancestors: "asc" }, { orderNum: "asc" }, { id: "asc" }],
    });
    return NextResponse.json(depts);
  } catch (error) {
    return handleApiError(error, "获取部门列表失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission("system:dept:create");
    const body = systemDeptSchema.parse(await request.json());
    const ancestors = await resolveDeptAncestors(prisma, body.parentId ?? null);

    const dept = await prisma.sysDept.create({
      data: {
        parentId: body.parentId ?? null,
        ancestors,
        name: body.name,
        orderNum: body.orderNum,
        leader: normalizeOptional(body.leader),
        phone: normalizeOptional(body.phone),
        email: normalizeOptional(body.email),
        status: body.status,
        remark: normalizeOptional(body.remark),
      },
    });

    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建部门失败");
  }
}
