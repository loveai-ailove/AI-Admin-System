import { NextResponse } from "next/server";
import { OperType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";
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
    await requireApiPermission("log:oper:list");
    const { id } = await params;
    const log = await prisma.sysOperLog.findUnique({
      where: { id: parseId(id) },
      select: {
        id: true,
        userId: true,
        username: true,
        module: true,
        operType: true,
        description: true,
        method: true,
        requestUrl: true,
        requestParam: true,
        response: true,
        ip: true,
        status: true,
        errorMsg: true,
        operTime: true,
        costTime: true,
      },
    });

    if (!log) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json({
      ...log,
      operTime: log.operTime.toLocaleString("zh-CN"),
    });
  } catch (error) {
    return handleApiError(error, "获取操作日志失败");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("log:oper:delete");
    const { id } = await params;
    const logId = parseId(id);

    const log = await prisma.sysOperLog.findUnique({ where: { id: logId } });
    if (!log) {
      throw new Error("NOT_FOUND");
    }

    await prisma.sysOperLog.delete({ where: { id: logId } });

    await logOperation({
      request,
      module: "操作日志",
      operType: OperType.DELETE,
      description: `删除操作日志: ${log.description || `#${log.id}`}`,
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    return handleApiError(error, "删除操作日志失败");
  }
}
