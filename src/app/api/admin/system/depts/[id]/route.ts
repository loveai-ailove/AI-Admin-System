import { NextResponse } from "next/server";
import { OperType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { normalizeOptional } from "@/lib/validators/common";
import { systemDeptSchema } from "@/lib/validators/system-dept";
import { assertDeptMoveAllowed, cascadeDeptAncestors, resolveDeptAncestors } from "@/lib/system/dept";
import { logOperation } from "@/lib/logger";

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
    await requireApiPermission("system:dept:list");
    const { id } = await params;
    const dept = await prisma.sysDept.findUnique({ where: { id: parseId(id) } });
    if (!dept) throw new Error("NOT_FOUND");
    return NextResponse.json(dept);
  } catch (error) {
    return handleApiError(error, "获取部门失败");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:dept:update");
    const { id } = await params;
    const deptId = parseId(id);
    const body = systemDeptSchema.parse(await request.json());

    const existing = await prisma.sysDept.findUnique({ where: { id: deptId } });
    if (!existing) throw new Error("NOT_FOUND");

    await assertDeptMoveAllowed(prisma, deptId, body.parentId ?? null);
    const newAncestors = await resolveDeptAncestors(prisma, body.parentId ?? null);

    await prisma.$transaction(async (tx) => {
      await tx.sysDept.update({
        where: { id: deptId },
        data: {
          parentId: body.parentId ?? null,
          ancestors: newAncestors,
          name: body.name,
          orderNum: body.orderNum,
          leader: normalizeOptional(body.leader),
          phone: normalizeOptional(body.phone),
          email: normalizeOptional(body.email),
          status: body.status,
          remark: normalizeOptional(body.remark),
        },
      });

      if (existing.ancestors !== newAncestors) {
        await cascadeDeptAncestors(tx, {
          deptId,
          oldAncestors: existing.ancestors,
          newAncestors,
        });
      }
    });

    await logOperation({
      request,
      module: "部门管理",
      operType: OperType.UPDATE,
      description: `修改部门: ${existing.name}`,
      requestParam: JSON.stringify(body),
    });

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    return handleApiError(error, "更新部门失败");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("system:dept:delete");
    const { id } = await params;
    const deptId = parseId(id);

    const [dept, childCount, userCount] = await Promise.all([
      prisma.sysDept.findUnique({ where: { id: deptId } }),
      prisma.sysDept.count({ where: { parentId: deptId } }),
      prisma.sysUser.count({ where: { deptId } }),
    ]);

    if (!dept) throw new Error("NOT_FOUND");
    if (childCount > 0) throw new Error("请先删除子部门");
    if (userCount > 0) throw new Error("该部门下仍有用户，不能删除");

    await prisma.sysDept.delete({ where: { id: deptId } });

    await logOperation({
      request,
      module: "部门管理",
      operType: OperType.DELETE,
      description: `删除部门: ${dept.name}`,
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    return handleApiError(error, "删除部门失败");
  }
}
