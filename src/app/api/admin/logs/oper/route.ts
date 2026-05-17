import { NextResponse } from "next/server";
import { Prisma, OperType, Status } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";

export async function GET(request: Request) {
  try {
    await requireApiPermission("log:oper:list");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const username = searchParams.get("username");
    const module = searchParams.get("module");
    const operType = searchParams.get("operType");
    const status = searchParams.get("status");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    const where: Prisma.SysOperLogWhereInput = {};
    if (username) where.username = { contains: username };
    if (module) where.module = module;
    if (operType) where.operType = operType as OperType;
    if (status) where.status = status as Status;
    if (startTime || endTime) {
      where.operTime = {};
      if (startTime) where.operTime.gte = new Date(startTime);
      if (endTime) where.operTime.lte = new Date(endTime);
    }

    const [total, list] = await Promise.all([
      prisma.sysOperLog.count({ where }),
      prisma.sysOperLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { operTime: "desc" },
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
      }),
    ]);

    return NextResponse.json({
      total,
      list: list.map((item) => ({
        ...item,
        operTime: item.operTime.toLocaleString("zh-CN"),
      })),
    });
  } catch (error) {
    return handleApiError(error, "查询操作日志失败");
  }
}
