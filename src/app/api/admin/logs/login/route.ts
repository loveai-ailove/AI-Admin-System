import { NextResponse } from "next/server";
import { Prisma, LoginStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth/api-auth";

export async function GET(request: Request) {
  try {
    await requireApiPermission("log:login:list");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const username = searchParams.get("username");
    const status = searchParams.get("status");
    const ip = searchParams.get("ip");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    const where: Prisma.SysLoginLogWhereInput = {};
    if (username) where.username = { contains: username };
    if (status) where.status = status as LoginStatus;
    if (ip) where.ip = { contains: ip };
    if (startTime || endTime) {
      where.loginTime = {};
      if (startTime) where.loginTime.gte = new Date(startTime);
      if (endTime) where.loginTime.lte = new Date(endTime);
    }

    const [total, list] = await Promise.all([
      prisma.sysLoginLog.count({ where }),
      prisma.sysLoginLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { loginTime: "desc" },
        select: {
          id: true,
          userId: true,
          username: true,
          ip: true,
          userAgent: true,
          status: true,
          loginTime: true,
          logoutTime: true,
          msg: true,
        },
      }),
    ]);

    return NextResponse.json({
      total,
      list: list.map((item) => ({
        ...item,
        loginTime: item.loginTime.toLocaleString("zh-CN"),
        logoutTime: item.logoutTime?.toLocaleString("zh-CN") || null,
      })),
    });
  } catch (error) {
    return handleApiError(error, "查询登录日志失败");
  }
}
