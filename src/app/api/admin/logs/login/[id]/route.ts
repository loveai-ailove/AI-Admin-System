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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("log:login:delete");
    const { id } = await params;
    const logId = parseId(id);

    const log = await prisma.sysLoginLog.findUnique({ where: { id: logId } });
    if (!log) {
      throw new Error("NOT_FOUND");
    }

    await prisma.sysLoginLog.delete({ where: { id: logId } });

    await logOperation({
      request,
      module: "登录日志",
      operType: OperType.DELETE,
      description: `删除登录日志: ${log.username || `#${log.id}`}`,
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    return handleApiError(error, "删除登录日志失败");
  }
}
